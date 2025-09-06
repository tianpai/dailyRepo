//Current Limitations (to be aware of)
//   - No type coercion: values from @Query are strings; controllers must
//   coerce (e.g., Number(page)).
//   - No formal validation: only presence checks for required params. Consider
//   adding schema decorators later (e.g., Zod).
//   - Date override is ad‑hoc via _dateOverride. It works; you can formalize
//   later (e.g., return { data, meta: { date } } and the decorator prefers
//   meta.date).
//   - No per‑route status override (always 200 on success). You might later
//   add @Status(201) for write routes.
//   - Middleware support (@Use) is not yet present; router-factory currently
//   just attaches the decorated handler.

/*  For each controllers
 *  - Always return plain business objects from controller methods; never
 *    envelope or send response.
 *  - For required query params, set default to undefined in @Query.
 *  - Include all variables used in cache keys in @Query or @Param so
 *    interpolation works and cache partitions correctly.
 *  - Keep any service-layer caching off for v2 routes to avoid double
 *    caching
 */

import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { makeSuccess, makeError } from "@/interfaces/api";
import { withCache } from "@/utils/controller-helper";

// ----------------------
// Type aliases & helpers
// ----------------------
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type ControllerClass = new (...args: unknown[]) => unknown;
export type MethodName = string;

export type CacheCondition<T = unknown> = (data: T) => boolean;

export interface QueryParam {
  name: string;
  defaultValue: unknown; // undefined => required
}

export interface RouteConfig {
  httpMethod: HttpMethod;
  path: string;
  cacheKey?: string;
  cacheTTL?: number; // seconds
  cacheCondition?: CacheCondition;
  queryParams: QueryParam[];
  pathParams: string[];
  schema?: {
    query?: ZodTypeAny;
    params?: ZodTypeAny;
    body?: ZodTypeAny;
  };
}

export type RouteMap = Map<MethodName, RouteConfig>;
export type MethodMetadataRegistry = Map<ControllerClass, RouteMap>;

// Store metadata for each decorated method
const methodMetadata: MethodMetadataRegistry = new Map();

// Helper to get/set method metadata
function getRouteConfig(target: unknown, methodName: string): RouteConfig {
  const constructor = (target as { constructor: ControllerClass }).constructor;

  if (!methodMetadata.has(constructor)) {
    methodMetadata.set(constructor, new Map());
  }

  const methods = methodMetadata.get(constructor)!;
  if (!methods.has(methodName)) {
    methods.set(methodName, {
      httpMethod: "GET",
      path: "",
      queryParams: [],
      pathParams: [],
    });
  }

  return methods.get(methodName)!;
}

// Main decorator that creates Express route handler
function createHttpDecorator(method: HttpMethod) {
  return function (path: string) {
    return function (
      target: unknown,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) {
      const config = getRouteConfig(target, propertyKey);
      config.httpMethod = method;
      config.path = path;

      const originalMethod = descriptor.value;

      // Replace with Express route handler
      descriptor.value = async function (
        req: Request,
        res: Response,
        _next: NextFunction,
      ): Promise<void> {
        try {
          // 0. Parse parameters into single object (Schema-first, fallback to legacy)
          const params = parseParameters(req, config);

          let result;

          // 1. Caching (if configured)
          if (config.cacheKey && config.cacheTTL) {
            const dynamicCacheKey = interpolateCacheKey(
              config.cacheKey,
              req,
              config,
            );

            const { data, fromCache } = await withCache(
              dynamicCacheKey,
              () => originalMethod.call(this, params),
              config.cacheTTL,
              config.cacheCondition,
            );

            result = data;

            // 3. Send data with cache info
            const dateToUse =
              (result && (result as any)._dateOverride) ||
              new Date().toISOString();
            if (result && (result as any)._dateOverride) {
              delete (result as any)._dateOverride; // Remove internal property
            }
            const response = makeSuccess(result, dateToUse);
            response.isCached = fromCache;
            res.status(200).json(response);
          } else {
            // No caching - direct call
            result = await originalMethod.call(this, params);

            // 3. Send data
            const dateToUse =
              (result && (result as any)._dateOverride) ||
              new Date().toISOString();
            if (result && (result as any)._dateOverride) {
              delete (result as any)._dateOverride; // Remove internal property
            }
            const response = makeSuccess(result, dateToUse);
            res.status(200).json(response);
          }
        } catch (error) {
          // 2. Error handling
          handleError(error, res);
        }
      };

      return descriptor;
    };
  };
}

// Parse query params, path params, body into clean object
function parseParameters(
  req: Request,
  config: RouteConfig,
): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};
  const pathParams: Record<string, unknown> = {};

  // If schema is provided, use it for validation/coercion
  if (config.schema) {
    const parsedQuery = parseViaSchema(config.schema.query, req.query, "query");
    const parsedParams = parseViaSchema(
      config.schema.params,
      req.params,
      "params",
    );
    const parsedBody = parseViaSchema(config.schema.body, req.body, "body");

    const result: Record<string, unknown> = {
      ...(parsedQuery ?? {}),
      ...(parsedParams ?? {}),
    };

    if (config.httpMethod === "POST" || config.httpMethod === "PUT") {
      (result as Record<string, unknown> & { body?: unknown }).body =
        parsedBody ?? req.body;
    }

    return result;
  }

  // Minimal, pragmatic coercion based on default value types.
  // Future: replace with schema-based validation/coercion (e.g., Zod) via @QuerySchema.
  const coerceByDefaultType = (
    defaultValue: unknown,
    raw: unknown,
  ): unknown => {
    // Only coerce when a default is provided (undefined means "required" string-like)
    if (defaultValue === undefined) {
      return raw;
    }

    switch (typeof defaultValue) {
      case "number": {
        if (raw === undefined || raw === "") {
          return defaultValue;
        }
        switch (typeof raw) {
          case "number":
            return raw;
          default: {
            const n = Number(raw as string);
            return Number.isNaN(n) ? defaultValue : n;
          }
        }
      }
      case "boolean": {
        if (raw === undefined || raw === "") {
          return defaultValue;
        }
        switch (typeof raw) {
          case "boolean":
            return raw;
          case "number":
            return raw !== 0;
          default: {
            const s = String(raw).toLowerCase();
            switch (s) {
              case "true":
              case "1":
                return true;
              case "false":
              case "0":
                return false;
              default:
                return defaultValue;
            }
          }
        }
      }
      default: {
        // For strings/others, return the raw value (or default if undefined)
        return raw === undefined ? defaultValue : raw;
      }
    }
  };

  // Parse query parameters into object
  for (const param of config.queryParams) {
    const value = (req.query as Record<string, unknown>)[param.name];
    // Minimal required check remains below; here we coerce when a default exists
    queryParams[param.name] = coerceByDefaultType(param.defaultValue, value);

    // Check for required parameters (undefined default means required)
    if (
      param.defaultValue === undefined &&
      (value === undefined || value === "")
    ) {
      throw new Error(`Required query parameter '${param.name}' is missing`);
    }
  }

  // Parse path parameters into object
  for (const paramName of config.pathParams) {
    pathParams[paramName] = (req.params as Record<string, unknown>)[paramName];
  }

  // Return single object with all parameters
  const result: Record<string, unknown> = { ...queryParams, ...pathParams };

  // Add body for POST/PUT requests
  if (config.httpMethod === "POST" || config.httpMethod === "PUT") {
    (result as Record<string, unknown> & { body?: unknown }).body = req.body;
  }

  return result;
}

function parseViaSchema(
  schema: ZodTypeAny | undefined,
  source: unknown,
  kind: "query" | "params" | "body",
): Record<string, unknown> | null {
  if (!schema) {
    return null;
  }

  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const message = zodIssuesToMessage(parsed.error, kind);
    throw new Error(message);
  }
  return parsed.data as Record<string, unknown>;
}

function zodIssuesToMessage(err: ZodError, kind: string): string {
  const issues = err.issues
    .map((i) => {
      const path = i.path.join(".") || kind;
      return `${path}: ${i.message}`;
    })
    .join("; ");
  return `Invalid ${kind}: ${issues}`;
}

// Replace {paramName} in cache key with actual values
function interpolateCacheKey(
  keyPattern: string,
  req: Request,
  config: RouteConfig,
): string {
  let key = keyPattern;

  // If legacy query/params metadata exists, use it first
  if (config.queryParams.length > 0 || config.pathParams.length > 0) {
    for (const param of config.queryParams) {
      const value =
        (req.query as Record<string, unknown>)[param.name] ??
        param.defaultValue;
      key = key.replace(`{${param.name}}`, String(value));
    }
    for (const paramName of config.pathParams) {
      key = key.replace(
        `{${paramName}}`,
        String((req.params as Record<string, unknown>)[paramName]),
      );
    }
    return key;
  }

  // Schema-only: replace any {token} by looking up in req.query/req.params
  const tokenRegex = /\{([^}]+)\}/g;
  key = key.replace(tokenRegex, (_match, tokenName) => {
    const qVal = (req.query as Record<string, unknown>)[tokenName];
    const pVal = (req.params as Record<string, unknown>)[tokenName];
    const v = qVal ?? pVal ?? "";
    return String(v);
  });

  return key;
}

// Standardized error handling
function handleError(error: unknown, res: Response): void {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  let statusCode = 500;

  // Simple error classification (enhance as needed)
  if (message.toLowerCase().includes("not found")) {
    statusCode = 404;
  } else if (
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("required") ||
    message.toLowerCase().includes("validation")
  ) {
    statusCode = 400;
  } else if (message.toLowerCase().includes("timeout")) {
    statusCode = 408;
  } else if (message.toLowerCase().includes("unavailable")) {
    statusCode = 503;
  }

  res
    .status(statusCode)
    .json(makeError(new Date().toISOString(), statusCode, message));
}

// HTTP Method Decorators
export const Get = createHttpDecorator("GET");
export const Post = createHttpDecorator("POST");
export const Put = createHttpDecorator("PUT");
export const Delete = createHttpDecorator("DELETE");

// Cache Decorator
export function Cache(
  keyPattern: string,
  ttl: number,
  condition?: CacheCondition,
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const config = getRouteConfig(target, propertyKey);
    config.cacheKey = keyPattern;
    config.cacheTTL = ttl;
    config.cacheCondition = condition;

    return descriptor;
  };
}

// Parameter Decorators
export function Query(querySchema: Record<string, unknown>) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const config = getRouteConfig(target, propertyKey);
    // Store the entire query schema instead of individual params
    config.queryParams = Object.entries(querySchema).map(
      ([name, defaultValue]) => ({
        name,
        defaultValue,
      }),
    );

    return descriptor;
  };
}

export function Param(name: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const config = getRouteConfig(target, propertyKey);
    config.pathParams.push(name);

    return descriptor;
  };
}

// Export metadata for router registration
export function getControllerRoutes(
  controllerClass: ControllerClass,
): RouteMap {
  return methodMetadata.get(controllerClass) || new Map();
}

// Combined schema decorator (concise): @Schema({ query, params, body })
export function Schema(def: {
  query?: ZodTypeAny;
  params?: ZodTypeAny;
  body?: ZodTypeAny;
}) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const config = getRouteConfig(target, propertyKey);
    config.schema = { ...(config.schema || {}), ...def };
    return descriptor;
  };
}

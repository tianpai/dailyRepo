// HTTP Decorators - Handle all Express plumbing
// Controller methods become pure business logic

import { Request, Response, NextFunction } from "express";
import { makeSuccess, makeError } from "@/interfaces/api";
import { withCache } from "@/utils/controller-helper";

// Store metadata for each decorated method
const methodMetadata = new Map<any, Map<string, RouteConfig>>();

interface RouteConfig {
  httpMethod: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  cacheKey?: string;
  cacheTTL?: number;
  cacheCondition?: (data: any) => boolean;
  queryParams: Array<{ name: string; defaultValue: any }>;
  pathParams: string[];
}

// Helper to get/set method metadata
function getRouteConfig(target: any, methodName: string): RouteConfig {
  const constructor = target.constructor;

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
function createHttpDecorator(method: "GET" | "POST" | "PUT" | "DELETE") {
  return function (path: string) {
    return function (
      target: any,
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
      ) {
        try {
          // 0. Parse parameters into single object
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
            const dateToUse = result._dateOverride || new Date().toISOString();
            delete result._dateOverride; // Remove internal property
            const response = makeSuccess(result, dateToUse);
            response.isCached = fromCache;
            res.status(200).json(response);
          } else {
            // No caching - direct call
            result = await originalMethod.call(this, params);

            // 3. Send data
            const dateToUse = result._dateOverride || new Date().toISOString();
            delete result._dateOverride; // Remove internal property
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
function parseParameters(req: Request, config: RouteConfig): any {
  const queryParams: Record<string, any> = {};
  const pathParams: Record<string, any> = {};

  // Parse query parameters into object
  for (const param of config.queryParams) {
    const value = req.query[param.name];
    queryParams[param.name] = value !== undefined ? value : param.defaultValue;

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
    pathParams[paramName] = req.params[paramName];
  }

  // Return single object with all parameters
  const result: any = { ...queryParams, ...pathParams };

  // Add body for POST/PUT requests
  if (config.httpMethod === "POST" || config.httpMethod === "PUT") {
    result.body = req.body;
  }

  return result;
}

// Replace {paramName} in cache key with actual values
function interpolateCacheKey(
  keyPattern: string,
  req: Request,
  config: RouteConfig,
): string {
  let key = keyPattern;

  // Replace query params
  for (const param of config.queryParams) {
    const value = req.query[param.name] || param.defaultValue;
    key = key.replace(`{${param.name}}`, String(value));
  }

  // Replace path params
  for (const paramName of config.pathParams) {
    key = key.replace(`{${paramName}}`, String(req.params[paramName]));
  }

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
  condition?: (data: any) => boolean,
) {
  return function (
    target: any,
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
export function Query(querySchema: Record<string, any>) {
  return function (
    target: any,
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
    target: any,
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
  controllerClass: any,
): Map<string, RouteConfig> {
  return methodMetadata.get(controllerClass) || new Map();
}

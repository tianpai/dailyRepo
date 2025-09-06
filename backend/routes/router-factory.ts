// Automatic Router Registration System
// Discovers decorated controllers and creates Express routers

import { Router } from "express";
import { getControllerRoutes } from "../decorators/http-decorators";

// Type for controller classes
type ControllerClass = new (...args: any[]) => any;

// Registry to hold controller instances and their base paths
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ControllerRegistration {
  controllerClass: ControllerClass;
  basePath: string;
  instance: any;
}

/**
 * Create a router with automatic controller registration
 *
 * @param basePath - Base path for all routes (e.g., '/api/v1')
 * @param controllers - Map of controller classes to their base paths
 */
export function createRouter(
  basePath: string,
  controllers: Record<string, ControllerClass>,
): Router {
  const router = Router();

  console.log(`----- Creating router for ${basePath}`);

  for (const [controllerBasePath, ControllerClass] of Object.entries(
    controllers,
  )) {
    const combinedBasePath = `${basePath}${controllerBasePath}`;
    registerController(router, combinedBasePath, ControllerClass);
  }

  return router;
}

/**
 * Register a single controller with the router
 */
function registerController(
  router: Router,
  basePath: string,
  ControllerClass: ControllerClass,
): void {
  // Create controller instance
  const controllerInstance = new ControllerClass();

  // Get all decorated methods from the controller
  const routes = getControllerRoutes(ControllerClass);

  console.log(
    `----- Registering controller: ${ControllerClass.name} at ${basePath}`,
  );

  if (routes.size === 0) {
    console.warn(`No decorated methods found in ${ControllerClass.name}`);
    return;
  }

  for (const [methodName, config] of routes) {
    // Combine base path with method path
    const fullPath = basePath + config.path;

    // Get the handler method and bind it to the controller instance
    const handler = (controllerInstance as any)[methodName].bind(
      controllerInstance,
    );

    // Register with Express router based on HTTP method
    switch (config.httpMethod) {
      case "GET":
        router.get(fullPath, handler);
        break;
      case "POST":
        router.post(fullPath, handler);
        break;
      case "PUT":
        router.put(fullPath, handler);
        break;
      case "DELETE":
        router.delete(fullPath, handler);
        break;
      default:
        console.warn(
          `Unsupported HTTP method: ${config.httpMethod} for ${methodName}`,
        );
    }

    // Log the registered route
    console.log(
      `${config.httpMethod} ${fullPath} -> ${ControllerClass.name}.${methodName}`,
    );

    // Log additional metadata
    if (config.cacheKey) {
      console.log(
        `      Cache: ${config.cacheKey} (TTL: ${config.cacheTTL}s)`,
      );
    }
    if (config.queryParams.length > 0) {
      const queryInfo = config.queryParams
        .map((p) => `${p.name}=${p.defaultValue}`)
        .join(", ");
      console.log(`      Query: ${queryInfo}`);
    }
    if (config.pathParams.length > 0) {
      console.log(`      Params: ${config.pathParams.join(", ")}`);
    }
  }

  console.log("");
}

/**
 * Create a simple router for a single controller (for testing)
 */
export function createControllerRouter(
  ControllerClass: ControllerClass,
  basePath: string = "",
): Router {
  const router = Router();
  registerController(router, basePath, ControllerClass);
  return router;
}

/**
 * Get route information for debugging
 */
export function inspectController(ControllerClass: ControllerClass) {
  const routes = getControllerRoutes(ControllerClass);

  console.log(`Inspecting ${ControllerClass.name}:`);

  if (routes.size === 0) {
    console.log("  No decorated methods found");
    return;
  }

  for (const [methodName, config] of routes) {
    console.log(`  ${config.httpMethod} ${config.path} -> ${methodName}`);
    if (config.cacheKey) {
      console.log(`    Cache: ${config.cacheKey}`);
    }
    if (config.queryParams.length > 0) {
      console.log(
        `    Query: ${config.queryParams.map((p) => p.name).join(", ")}`,
      );
    }
  }
}

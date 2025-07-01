import VisitorLog from "../model/VisitorLog";

export const logVisitor = async (req, res, next) => {
  try {
    // Skip logging for health checks and other internal requests
    const shouldSkipLogging = (req) => {
      const userAgent = req.headers["user-agent"] || "";
      const path = req.path;

      // Skip Render health checks
      if (userAgent.includes("Render/") && path === "/health") {
        return true;
      }

      // Skip other health check paths
      if (path === "/health") {
        return true;
      }

      // Vercel screenshot requests
      if (userAgent.includes("vercel-screenshot/1.0")) return true;

      return false;
    };

    if (shouldSkipLogging(req)) {
      return next();
    }

    // Extract real IP address (handles proxies and load balancers)
    const getClientIP = (req) => {
      return (
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-real-ip"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        "unknown"
      );
    };

    const visitorData = {
      ip: getClientIP(req),
      userAgent: req.headers["user-agent"] || "unknown",
      path: req.path,
      method: req.method,
    };

    // Save to database (fire and forget - don't block the request)
    VisitorLog.create(visitorData).catch((err) => {
      console.error("Error logging visitor:", err);
    });

    next();
  } catch (error) {
    console.error("Visitor logging middleware error:", error);
    next(); // Continue even if logging fails
  }
};

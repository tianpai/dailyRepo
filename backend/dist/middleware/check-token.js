import dotenv from "dotenv";
dotenv.config();
export function checkFrontendToken(req, res, next) {
    const FRONTEND_TOKEN = process.env.API_TOKEN;
    const auth = req.headers["authorization"] || "";
    const token = auth.startsWith("Bearer ")
        ? auth.slice(7)
        : req.headers["x-api-key"];
    if (token === FRONTEND_TOKEN) {
        return next();
    }
    res.status(401).json({ error: "Unauthorized" });
}
//# sourceMappingURL=check-token.js.map
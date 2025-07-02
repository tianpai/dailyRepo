import { Router } from "express";
import developerRouter from "./developer-routes";
import languageRouter from "./language-routes";
import repoRouter from "./repo-routes";

const mainRouter = Router();

// relative to: /api/v1/
mainRouter.use("/repos", repoRouter);
mainRouter.use("/developers", developerRouter);
mainRouter.use("/languages", languageRouter);

// api versioning
const apiVersion = "v1";
const apiBasePath = `/api/${apiVersion}`;
const apiRouterV1 = Router();
apiRouterV1.use(apiBasePath, mainRouter);

export default apiRouterV1;

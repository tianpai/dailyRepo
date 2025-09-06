import { Router } from "express";
import { createRouterFromControllers } from "./router-factory";
import { RepoController } from "../version2/repo-controller";

//TODO:  Import other controllers as we migrate them
// import { NewDeveloperController } from './new-developer-controller';
// import { NewLanguageController } from './new-language-controller';

export function createV2Router(): Router {
  return createRouterFromControllers("/api/v2", [RepoController]);
}

export default createV2Router;

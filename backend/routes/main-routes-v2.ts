import { Router } from "express";
import { createRouterFromControllers } from "./router-factory";
import { RepoController } from "../version2/repo-controller";
import { StarHistoryController } from "../version2/star-history-controller";
import { DeveloperController } from "../version2/developer-controller";
import { LanguageController } from "../version2/language-controller";

//TODO:  Import other controllers as we migrate them
// import { NewDeveloperController } from './new-developer-controller';
// import { NewLanguageController } from './new-language-controller';

export function createV2Router(): Router {
  return createRouterFromControllers("/api/v2", [
    RepoController,
    StarHistoryController,
    DeveloperController,
    LanguageController,
  ]);
}

export default createV2Router;

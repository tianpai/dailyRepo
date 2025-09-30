import { Router } from "express";
import { createRouterFromControllers } from "./router-factory";
import { RepoController } from "@version2/repo-controller";
import { StarHistoryController } from "@version2/star-history-controller";
import { DeveloperController } from "@version2/developer-controller";
import { LanguageController } from "@version2/language-controller";
import { KeywordController } from "@version2/keyword-controller";

export function createV2Router(): Router {
  return createRouterFromControllers("/api/v2", [
    RepoController,
    StarHistoryController,
    DeveloperController,
    LanguageController,
    KeywordController,
  ]);
}

export default createV2Router;

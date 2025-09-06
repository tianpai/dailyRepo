import { Router } from "express";
import { createRouter } from "./router-factory";
import { RepoController } from "../version2/repo-controller";

//TODO:  Import other controllers as we migrate them
// import { NewDeveloperController } from './new-developer-controller';
// import { NewLanguageController } from './new-language-controller';

export function createV2Router(): Router {
  const controllers = {
    "/repos": RepoController,
    // '/developers': NewDeveloperController, // TODO: Migrate
    // '/languages': NewLanguageController,   // TODO: Migrate
  };

  return createRouter("/api/v2", controllers);
}

export default createV2Router;

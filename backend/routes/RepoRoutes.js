import { Router } from "express";
import * as RepoController from "../controller/RepoController.js";

const repoRouter = Router();

repoRouter.get("/trending", RepoController.getRepoTopTrending);

export default repoRouter;

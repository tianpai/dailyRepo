import { Router } from "express";
import {
  getLanguagesList,
  getLanguageTrendingRepos,
  getTopLang,
} from "@controller/language-controller";

const languageRouter: Router = Router();

languageRouter.get("/", getLanguagesList);
languageRouter.get("/:language/trending", getLanguageTrendingRepos);
languageRouter.get("/language-list", getTopLang); //?top=N

export default languageRouter;

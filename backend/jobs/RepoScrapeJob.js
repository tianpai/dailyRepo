import { getRepo, getTrending } from "../services/RepoScraping.js";
import { getTodayUTC } from "../utils/time.js";
import { calculateTrendScore } from "../utils/trendScore.js";
import Repo from "../models/Repo.js";

export async function prepTrendingData() {
  const trendingList = await getTrending();
  const dataList = [];
  const today = getTodayUTC();

  // forEach does not work with async/await
  for (const repo of trendingList) {
    try {
      const fullRepoData = await getRepo(repo);
      const {
        name,
        full_name: fullName,
        description,
        url,
        license,
        created_at: createdAt,
        updated_at: lastUpdate,
        topics,
        stargazers_count: stars,
        watchers_count: watches,
        forks_count: forks,
        owner: { login: owner },
      } = fullRepoData;

      const languageJSON = await fetch(fullRepoData.languages_url).then((res) =>
        res.json(),
      );

      const age = Date.now() - new Date(createdAt);
      const repoDataToSave = {
        name,
        fullName,
        description,
        url,
        language: languageJSON,
        lastUpdate: new Date(lastUpdate).getTime(),
        createdAt: new Date(createdAt).getTime(),
        age,
        topics: topics || [],
        license: license?.name || "No license",
        stars: { [today]: stars },
        forks: { [today]: forks },
        watches: { [today]: watches },
        owner,
        stats: {
          trends: calculateTrendScore({ stars, forks, watches, age }),
          scrapedDate: getTodayUTC(),
          category: [],
        },
      };
      dataList.push(repoDataToSave);
    } catch (error) {
      console.error("Error fetching repo data:", error);
    }
  }
  return dataList;
}

(async () => {
  console.log(await prepTrendingData());
})();

export async function saveData(repos) {
  const today = getTodayUTC();
  for (const repo of repos) {
    const existingRepo = await Repo.findOne({
      fullName: repo.fullName,
    });

    if (existingRepo) {
      existingRepo.stars.set(today, repo.stars[today]);
      existingRepo.forks.set(today, repo.forks[today]);
      existingRepo.watches.set(today, repo.watches[today]);
      existingRepo.lastUpdate = repo.lastUpdate;
      existingRepo.stats.trends = repo.stats.trends;
      existingRepo.stats.scrapedDate = today;

      await existingRepo.save();
    } else {
      const newRepo = new Repo(repo);
      await newRepo.save();
    }
  }
}

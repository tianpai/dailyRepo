import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repo } from '../../database/schemas/repo.schema';
import { StarHistory } from '../../database/schemas/star-history.schema';
import { StarHistoryService } from './star-history.service';
import { ScraperConfigService } from './scraper-config.service';

interface StarHistoryProcessResult {
  repoId: string;
  repoName: string;
  history: Array<{ date: string; count: number }>;
}

@Injectable()
export class StarHistoryScraperService {
  constructor(
    @InjectModel(Repo.name) private repoModel: Model<Repo>,
    @InjectModel(StarHistory.name)
    private starHistoryModel: Model<StarHistory>,
    private starHistoryService: StarHistoryService,
    private scraperConfig: ScraperConfigService,
  ) {}

  async processStarHistory(repoNames: string[]): Promise<void> {
    if (!repoNames || repoNames.length === 0) {
      console.log('No repos to process for star history');
      return;
    }

    if (this.scraperConfig.isTestMode()) {
      repoNames = repoNames.slice(0, 3);
    }

    console.log(`Processing star history for ${repoNames.length} repos...`);

    const { validRepoNames, repoMap, skippedCount } =
      await this.validateRepositoriesInDatabase(repoNames);

    if (validRepoNames.length === 0) {
      console.log('No valid repositories found in database');
      return;
    }

    const allSuccessfulResults = await this.processStarHistorySequentially(
      validRepoNames,
      repoMap,
    );

    if (!this.scraperConfig.isTestMode()) {
      await this.saveStarHistoryResults(allSuccessfulResults);
    }

    console.log(
      `Star history complete: ${allSuccessfulResults.length} successful, ${validRepoNames.length - allSuccessfulResults.length} failed, ${skippedCount} skipped`,
    );
  }

  private async validateRepositoriesInDatabase(repoNames: string[]): Promise<{
    validRepoNames: string[];
    repoMap: Map<string, string>;
    skippedCount: number;
  }> {
    const existingRepos = await this.repoModel
      .find({
        fullName: { $in: repoNames },
      })
      .select('_id fullName')
      .lean<Array<{ _id: string; fullName: string }>>();

    const repoMap = new Map<string, string>();
    const validRepoNames: string[] = [];

    existingRepos.forEach((repo) => {
      repoMap.set(repo.fullName, repo._id);
      validRepoNames.push(repo.fullName);
    });

    const skippedCount = repoNames.length - validRepoNames.length;

    console.log(
      `Repository validation: ${validRepoNames.length} valid, ${skippedCount} skipped`,
    );

    return {
      validRepoNames,
      repoMap,
      skippedCount,
    };
  }

  private async processStarHistorySequentially(
    repoNames: string[],
    repoMap: Map<string, string>,
  ): Promise<StarHistoryProcessResult[]> {
    const successfulResults: StarHistoryProcessResult[] = [];

    for (let i = 0; i < repoNames.length; i++) {
      const repoName = repoNames[i];
      const repoId = repoMap.get(repoName);

      if (!repoId) {
        console.log(`  Skipped ${repoName}: No repoId found`);
        continue;
      }

      try {
        const data = await this.starHistoryService.fetchStarHistory(repoName);
        console.log(
          `[${i + 1}/${repoNames.length}] ${repoName} ${data?.length || 0} data points`,
        );

        successfulResults.push({
          repoId,
          repoName,
          history: data,
        });
      } catch (error) {
        console.log(`  Failed ${repoName}: ${(error as Error).message}`);
      }

      if (i < repoNames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    return successfulResults;
  }

  private async saveStarHistoryResults(
    results: StarHistoryProcessResult[],
  ): Promise<void> {
    if (results.length === 0) {
      console.log('No star history data to save');
      return;
    }

    const upsertOperations = results.map(({ repoId, history }) => ({
      updateOne: {
        filter: { repoId },
        update: {
          repoId,
          saveDate: new Date(),
          history,
        },
        upsert: true,
      },
    }));

    await this.starHistoryModel.bulkWrite(upsertOperations);

    console.log(`Successfully saved star history for ${results.length} repos`);
  }
}

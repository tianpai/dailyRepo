import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Repo } from '../../database/schemas/repo.schema';

const SUPPORTED_LANGUAGES: string[] = [
  'c++',
  'go',
  'java',
  'javascript',
  'python',
  'rust',
  'typescript',
];

interface LanguageAggregationItem {
  language: string;
  count: number;
  repos: number;
}

@Injectable()
export class LanguagesService {
  constructor(@InjectModel(Repo.name) private repoModel: Model<Repo>) {}

  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  async getTopLanguages(top = 5): Promise<Record<string, number>> {
    const pipeline: PipelineStage[] = [
      { $match: { language: { $exists: true, $ne: null } } },
      { $project: { language: { $objectToArray: '$language' } } },
      { $unwind: '$language' },
      {
        $group: {
          _id: '$language.k',
          totalCount: { $sum: '$language.v' },
          repoCount: { $sum: 1 },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: top },
      {
        $project: {
          _id: 0,
          language: '$_id',
          count: '$totalCount',
          repos: '$repoCount',
        },
      },
    ];

    const result =
      await this.repoModel.aggregate<LanguageAggregationItem>(pipeline);
    const languageMap = result.reduce(
      (acc: Record<string, number>, item: LanguageAggregationItem) => {
        acc[item.language] = item.count;
        return acc;
      },
      {} as Record<string, number>,
    );
    return languageMap;
  }
}

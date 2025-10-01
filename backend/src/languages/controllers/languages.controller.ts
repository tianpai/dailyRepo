import { Controller, Get, Query, UsePipes, Logger } from '@nestjs/common';
import { LanguagesService } from '../services/languages.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const TopLangQuerySchema = z.object({
  top: z.coerce.number().int().min(1).max(15).default(5),
});

@Controller('languages')
export class LanguagesController {
  private readonly logger = new Logger(LanguagesController.name);

  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  getLanguagesList() {
    this.logger.debug('GET /languages');
    const languages = this.languagesService.getSupportedLanguages();
    return {
      languages,
      _dateOverride: this.getTodayUTC(),
    };
  }

  @Get('trending')
  getLanguageTrendingRepos() {
    this.logger.debug('GET /languages/trending');
    return {
      trending: [],
      _dateOverride: this.getTodayUTC(),
    };
  }

  @Get('top')
  @UsePipes(new ZodValidationPipe(TopLangQuerySchema))
  async getTopLang(@Query() query: z.infer<typeof TopLangQuerySchema>) {
    const { top } = query;
    this.logger.debug(`GET /languages/top - top: ${top}`);
    const data: Record<string, number> =
      await this.languagesService.getTopLanguages(top);
    return {
      data,
      _dateOverride: this.getTodayUTC(),
    };
  }

  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
  }
}

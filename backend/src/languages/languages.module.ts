import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { LanguagesController } from './controllers/languages.controller';
import { LanguagesService } from './services/languages.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule implements OnModuleInit {
  private readonly logger = new Logger(LanguagesModule.name);

  onModuleInit() {
    this.logger.log('LanguagesModule initialized - 3 endpoints registered');
  }
}

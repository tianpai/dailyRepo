import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { ReposModule } from '../repos/repos.module';

@Module({
  imports: [ReposModule],
  providers: [CronjobsService],
})
export class CronjobsModule {}

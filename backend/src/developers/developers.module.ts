import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DevelopersController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule implements OnModuleInit {
  private readonly logger = new Logger(DevelopersModule.name);

  onModuleInit() {
    this.logger.log('DevelopersModule initialized - 3 endpoints registered');
  }
}

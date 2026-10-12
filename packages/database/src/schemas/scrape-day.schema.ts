import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'scrapedays' })
export class ScrapeDay extends Document {
  @Prop({ required: true, unique: true })
  date: string;

  @Prop({ required: true })
  repositoryCount: number;

  @Prop({ enum: ['running', 'complete', 'partial', 'failed'] })
  status?: 'running' | 'complete' | 'partial' | 'failed';

  @Prop()
  expectedRepositoryCount?: number;

  @Prop({ type: [String], default: [] })
  failedRepositories: string[];

  @Prop({ type: [String], default: [] })
  failedPages: string[];

  @Prop()
  completedAt?: Date;
}

export const ScrapeDaySchema = SchemaFactory.createForClass(ScrapeDay);

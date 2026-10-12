import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'scrapedays' })
export class ScrapeDay extends Document {
  @Prop({ required: true, unique: true })
  date: string;

  @Prop({ required: true })
  repositoryCount: number;

  @Prop({ required: true })
  completedAt: Date;
}

export const ScrapeDaySchema = SchemaFactory.createForClass(ScrapeDay);

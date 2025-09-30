import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'trendingdevelopers' })
export class TrendingDeveloper extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  repositoryPath: string;

  @Prop({ required: true })
  profileUrl: string;

  @Prop()
  avatar_url?: string;

  @Prop()
  location?: string;

  @Prop({ type: [String], default: [] })
  trendingRecord: string[];
}

export const TrendingDeveloperSchema =
  SchemaFactory.createForClass(TrendingDeveloper);

// Add indexes
TrendingDeveloperSchema.index({ trendingRecord: -1 });
TrendingDeveloperSchema.index({ username: 1, trendingRecord: -1 });

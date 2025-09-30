import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'weeklytopicfindings' })
export class WeeklyTopicFindings extends Document {
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  week: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  languageTopicMap: {
    [language: string]: {
      [cluster: string]: number;
    };
  };

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const WeeklyTopicFindingsSchema =
  SchemaFactory.createForClass(WeeklyTopicFindings);

// Add indexes
WeeklyTopicFindingsSchema.index({ year: 1, week: 1 }, { unique: true });
WeeklyTopicFindingsSchema.index({ createdAt: -1 });

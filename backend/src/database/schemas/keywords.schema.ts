import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class KeywordAnalysis {
  @Prop({ required: true })
  originalTopicsCount: number;

  @Prop({ type: [String], required: true })
  topKeywords: string[];

  @Prop({ type: Map, of: [String], default: {} })
  related: Map<string, string[]>;

  @Prop({ type: Map, of: Number, default: {} })
  clusterSizes: Map<string, number>;
}

@Schema({ collection: 'keywords' })
export class Keywords extends Document {
  @Prop({ required: true, unique: true })
  date: string;

  @Prop({ required: true, type: KeywordAnalysis })
  analysis: KeywordAnalysis;
}

export const KeywordsSchema = SchemaFactory.createForClass(Keywords);

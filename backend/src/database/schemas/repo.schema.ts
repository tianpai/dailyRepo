import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LanguageMap = Record<string, number>;

@Schema({ collection: 'repos' })
export class Repo extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  url: string;

  @Prop({ type: Object })
  language: LanguageMap;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop()
  createdAt: string;

  @Prop()
  lastUpdate: string;

  @Prop()
  license: string;

  @Prop()
  trendingDate: string;

  @Prop({ type: [String], default: [] })
  trendingRecord: string[];
}

export const RepoSchema = SchemaFactory.createForClass(Repo);

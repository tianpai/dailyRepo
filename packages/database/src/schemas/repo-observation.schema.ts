import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { LanguageMap } from './repo.schema';

@Schema({ collection: 'repos' })
export class RepoObservation extends Document {
  @Prop({ type: Number, required: true })
  repo_id: number;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  date: string;

  @Prop()
  description: string;

  @Prop({ type: Object, required: true })
  language: LanguageMap;

  @Prop({ type: [String], required: true })
  topics: string[];

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  lastUpdate: string;

  @Prop({ type: String, default: null })
  license: string | null;
}

export const RepoObservationSchema =
  SchemaFactory.createForClass(RepoObservation);
RepoObservationSchema.index({ fullName: 1, date: 1 }, { unique: true });
RepoObservationSchema.index({ repo_id: 1, date: 1 });
RepoObservationSchema.index({ date: 1 });

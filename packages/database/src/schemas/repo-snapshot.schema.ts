import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { LanguageMap } from './repo.schema';

@Schema({ collection: 'reposnapshots' })
export class RepoSnapshot extends Document {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ type: Object, required: true })
  language: LanguageMap;

  @Prop({ type: [String], required: true })
  topics: string[];
}

export const RepoSnapshotSchema = SchemaFactory.createForClass(RepoSnapshot);
RepoSnapshotSchema.index({ date: 1, fullName: 1 }, { unique: true });

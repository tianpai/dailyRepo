import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export class StarHistoryEntry {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true, min: 0 })
  count: number;
}

@Schema({ collection: 'starhistories' })
export class StarHistory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Repo', required: true })
  repoId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  saveDate: Date;

  @Prop({ type: [StarHistoryEntry], default: [] })
  history: StarHistoryEntry[];
}

export const StarHistorySchema = SchemaFactory.createForClass(StarHistory);

// Add indexes
StarHistorySchema.index({ repoId: 1, saveDate: -1 });
StarHistorySchema.index({ 'history.date': 1 });

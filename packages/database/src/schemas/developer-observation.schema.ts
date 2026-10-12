import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'trendingdevelopers' })
export class DeveloperObservation extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  repositoryPath: string;

  @Prop({ required: true })
  profileUrl: string;

  @Prop()
  avatar_url: string;

  @Prop()
  location?: string;
}

export const DeveloperObservationSchema =
  SchemaFactory.createForClass(DeveloperObservation);
DeveloperObservationSchema.index({ username: 1, date: 1 }, { unique: true });
DeveloperObservationSchema.index({ date: 1 });

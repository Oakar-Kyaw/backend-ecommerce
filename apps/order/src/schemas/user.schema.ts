import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, default: 'CUSTOMER' })
  role: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

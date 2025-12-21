import { Prop, Schema , SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type ShippingLocationDocument = HydratedDocument<ShippingLocation>;

@Schema({ timestamps: true })
export class ShippingLocation {

  @Prop({ required: false })
  name: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address1: string;

  @Prop()
  address2?: string;

  @Prop()
  addressTitle?: string;

  @Prop({ default: false })
  markDefault: boolean;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ required: false })
  placeId?: string;

  // 🔗 Reference to User
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: false,
    index: true,
  })
  user: Types.ObjectId;
}

export const ShippingLocationSchema =
  SchemaFactory.createForClass(ShippingLocation);

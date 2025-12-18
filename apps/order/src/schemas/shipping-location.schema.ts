import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShippingLocationDocument = HydratedDocument<ShippingLocation>;

@Schema({ timestamps: true })
export class ShippingLocation {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ required: false })
  placeId?: string;
}

export const ShippingLocationSchema =
  SchemaFactory.createForClass(ShippingLocation);

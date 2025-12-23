import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type BrandDocument = HydratedDocument<BrandMeta>;

@Schema({ timestamps: true })
export class BrandMeta {
  @Prop({ required: false })
  brandId: number;

  @Prop({required: false})
  name: string;

  @Prop({required: false})
  imageUrl: string;

  @Prop({required: false})
  email: string;

  @Prop({ required: false, default: false })
  isDeleted: boolean;
}


export const BrandSchema = SchemaFactory.createForClass(BrandMeta);


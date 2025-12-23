import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { BrandMeta } from "./brand.shema";
export type ProductDocument = HydratedDocument<ProductMeta>;

@Schema({ timestamps: true })
export class ProductMeta {
  
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productMainImage: string;

  @Prop({ required: false })
  isDeleted: string;

  @Prop({ type: Types.ObjectId, ref: BrandMeta.name, required: true })
  brandId: Types.ObjectId;

}

export const ProductSchema = SchemaFactory.createForClass(ProductMeta);
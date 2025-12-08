export class ProductResponseDto {
  id: string;
  name: string;
  code: string;
  type: string;
  weight: string;
  discountPercent: number;
  categoryId: string;
  subcategoryId: string;
  description: string;
  mainImage: string;
  colors: ProductColorResponseDto[];
  sizes: ProductSizeResponseDto[];
}

export class ProductColorResponseDto {
  id: string;
  name: string;
  hex: string;
  images: {
    front: string | null;
    back: string | null;
    sideL: string | null;
    sideR: string | null;
  };
}

export class ProductSizeResponseDto {
  id: string;
  name: string;
  price: number;
  quantities: Record<string, number>;
}

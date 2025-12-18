import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'apps/product/prisma/prisma.service';
import {
  CreateProductDto,
  ParsedColor,
  ParsedSize,
} from '../dto/create-product.dto';
import { FileUpload } from 'libs/utils/file-upload';
import axios from 'axios';
import { envConfig } from 'libs/config/envConfig';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUpload,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    // 1. Parse JSON fields
    let colors: ParsedColor[] = [];
    let sizes: ParsedSize[] = [];
    try {
      colors = JSON.parse(createProductDto.colors);
      sizes = JSON.parse(createProductDto.sizes);
    } catch (e) {
      throw new BadRequestException('Invalid JSON for colors or sizes');
    }

    // 2. Upload Main Image
    const mainImageFile = files.find((f) => f.fieldname === 'mainImage');
    if (!mainImageFile) {
      throw new BadRequestException('Main image is required');
    }
    const mainImageUpload = await this.fileUpload.uploadSingle({
      file: mainImageFile,
      folderName: 'products',
    });
    const mainImageUrl = mainImageUpload.url;

    // 3. Create Product
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        code: createProductDto.code,
        type: createProductDto.type,
        weight: createProductDto.weight,
        discountPercent: parseFloat(createProductDto.discountPercent),
        description: createProductDto.description,
        mainImage: mainImageUrl,
        brandId: parseInt(createProductDto.brandId),
        categoryId: parseInt(createProductDto.categoryId),
        subCategoryId: createProductDto.subcategoryId
          ? parseInt(createProductDto.subcategoryId)
          : null,
      },
    });

    // 4. Process Colors
    const colorIdMap = new Map<string, number>(); // tempId -> dbId

    for (const color of colors) {
      // Upload images for this color
      const views = ['front', 'back', 'sideL', 'sideR'];
      const imageUrls: Record<string, string | null> = {
        front: null,
        back: null,
        sideL: null,
        sideR: null,
      };

      for (const view of views) {
        const fieldName = `color_${color.id}_${view}`;
        const file = files.find((f) => f.fieldname === fieldName);
        if (file) {
          const upload = await this.fileUpload.uploadSingle({
            file,
            folderName: 'products/colors',
          });
          imageUrls[view] = upload.url;
        }
      }

      const createdColor = await this.prisma.productColor.create({
        data: {
          productId: product.id,
          name: color.name,
          hex: color.hex,
          imageFront: imageUrls.front,
          imageBack: imageUrls.back,
          imageSideL: imageUrls.sideL,
          imageSideR: imageUrls.sideR,
        },
      });
      colorIdMap.set(color.id, createdColor.id);
    }

    // 5. Process Sizes and Variants
    for (const size of sizes) {
      const createdSize = await this.prisma.productSize.create({
        data: {
          productId: product.id,
          name: size.name,
          price: size.price,
        },
      });

      // Quantities
      if (size.quantities) {
        for (const [colorTempId, quantity] of Object.entries(size.quantities)) {
          const colorDbId = colorIdMap.get(colorTempId);
          if (colorDbId) {
            await this.prisma.productVariant.create({
              data: {
                productId: product.id,
                productSizeId: createdSize.id,
                productColorId: colorDbId,
                quantity: quantity,
              },
            });
          }
        }
      }
    }

    return this.findOne(product.id);
  }

  async findAll({
    page = 1,
    pageSize = 10,
    brandId,
  }: {
    page?: number;
    pageSize?: number;
    brandId?: number;
  } = {}) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = { isDeleted: false };
    if (brandId) {
      where.brandId = brandId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          colors: true,
          sizes: true,
          variants: true,
        },
        skip,
        take,
      }),
      this.prisma.product.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const mapped = this.mapToResponse(product).data;
        const brand = await this.fetchBrandDetails(product.brandId);
        return { ...mapped, brand };
      }),
    );

    return {
      success: true,
      message: 'LIST_OF_ITEMS',
      data: enrichedProducts,
      part: total,
      page,
      pageSize,
      limit: pageSize,
      skip,
      totalPages,
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, isDeleted: false },
      include: {
        colors: true,
        sizes: true,
        variants: true,
      },
    });
    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);

    const brand = await this.fetchBrandDetails(product.brandId);

    // Map to response format
    const mapped = this.mapToResponse(product).data;
    return {
      success: true,
      message: 'ITEM_BY_ID',
      data: { ...mapped, brand },
    };
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);

    await this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Product deleted successfully' };
  }

  private async fetchBrandDetails(brandId: number) {
    if (!brandId) {
      console.log('fetchBrandDetails: brandId is missing');
      return null;
    }
    try {
      const url = `http://localhost:${envConfig().user_service_port}/api/v1/brands/${brandId}`;
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching brand details for ID ${brandId}:`,
        error.message,
      );
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return null;
    }
  }

  private mapToResponse(product: any) {
    const colors = product.colors.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      hex: c.hex,
      images: {
        front: c.imageFront,
        back: c.imageBack,
        sideL: c.imageSideL,
        sideR: c.imageSideR,
      },
    }));

    const sizes = product.sizes.map((s) => {
      const quantities: Record<string, number> = {};
      const variants = product.variants.filter((v) => v.productSizeId === s.id);
      variants.forEach((v) => {
        quantities[v.productColorId.toString()] = v.quantity;
      });

      return {
        id: s.id.toString(),
        name: s.name,
        price: s.price,
        quantities,
      };
    });

    return {
      data: {
        id: product.id.toString(),
        name: product.name,
        code: product.code,
        type: product.type,
        weight: product.weight,
        discountPercent: product.discountPercent,
        brandId: product.brandId,
        categoryId: product.categoryId.toString(),
        subcategoryId: product.subCategoryId?.toString(),
        description: product.description,
        mainImage: product.mainImage,
        colors,
        sizes,
      },
    };
  }
}

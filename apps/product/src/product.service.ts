import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'apps/product/prisma/prisma.service';
import { CreateProductDto, ParsedColor, ParsedSize } from '../dto/create-product.dto';
import { FileUpload } from 'libs/utils/file-upload';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUpload: FileUpload,
  ) {}

  async create(createProductDto: CreateProductDto, files: Array<Express.Multer.File>) {
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
    const mainImageFile = files.find(f => f.fieldname === 'mainImage');
    if (!mainImageFile) {
        throw new BadRequestException('Main image is required');
    }
    const mainImageUpload = await this.fileUpload.uploadSingle({ file: mainImageFile, folderName: 'products' });
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
        categoryId: parseInt(createProductDto.categoryId),
        subCategoryId: createProductDto.subcategoryId ? parseInt(createProductDto.subcategoryId) : null,
      },
    });

    // 4. Process Colors
    const colorIdMap = new Map<string, number>(); // tempId -> dbId

    for (const color of colors) {
        // Upload images for this color
        const views = ['front', 'back', 'sideL', 'sideR'];
        const imageUrls: Record<string, string | null> = { front: null, back: null, sideL: null, sideR: null };

        for (const view of views) {
            const fieldName = `color_${color.id}_${view}`;
            const file = files.find(f => f.fieldname === fieldName);
            if (file) {
                const upload = await this.fileUpload.uploadSingle({ file, folderName: 'products/colors' });
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
            }
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
            }
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
                        }
                    });
                }
            }
        }
    }

    return this.findOne(product.id);
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        colors: true,
        sizes: true,
        variants: true,
      },
    });

    return {
      data: products.map((product) => this.mapToResponse(product).data),
    };
  }

  async findOne(id: number) {
      const product = await this.prisma.product.findUnique({
          where: { id, isDeleted: false },
          include: {
              colors: true,
              sizes: true,
              variants: true,
          }
      });
      if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

      // Map to response format
      return this.mapToResponse(product);
  }

  async remove(id: number) {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

      await this.prisma.product.update({
          where: { id },
          data: { isDeleted: true }
      });

      return { message: 'Product deleted successfully' };
  }

  private mapToResponse(product: any) {
      const colors = product.colors.map(c => ({
          id: c.id.toString(),
          name: c.name,
          hex: c.hex,
          images: {
              front: c.imageFront,
              back: c.imageBack,
              sideL: c.imageSideL,
              sideR: c.imageSideR,
          }
      }));

      const sizes = product.sizes.map(s => {
          const quantities: Record<string, number> = {};
          const variants = product.variants.filter(v => v.productSizeId === s.id);
          variants.forEach(v => {
             quantities[v.productColorId.toString()] = v.quantity;
          });
          
          return {
              id: s.id.toString(),
              name: s.name,
              price: s.price,
              quantities
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
            categoryId: product.categoryId.toString(),
            subcategoryId: product.subCategoryId?.toString(),
            description: product.description,
            mainImage: product.mainImage,
            colors,
            sizes
          }
      };
  }
}

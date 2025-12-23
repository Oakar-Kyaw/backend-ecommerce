import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Get,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ProductResponseDto,
  ProductListResponseDto,
  ProductItemResponseDto,
} from '../dto/product-response.dto';
import { Serialize } from 'libs/interceptor/response.interceptor';
import { CreateAddToCartDto, CreateUserFavoriteDto } from '../dto/user-data.dto';
import { UserData } from './user/user.data';
import { AddToCartListResponseDto, CreatedAddToCartResponseDto, CreatedUserFavoriteResponseDto, DeletedAddToCartResponseDto, DeletedUserFavoriteResponseDto, UserFavoriteListResponseDto } from '../dto/user-data-response.dto';
import { publishEvent } from 'libs/queue/redis/redis.producer';
import { EVENTS, TYPES } from 'libs/queue/constant';

@ApiTags('Items')
@Controller(['api/products', 'api/v1/products', 'api/v1/items', 'api/v1/product'])
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly userData: UserData
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  @Serialize(ProductListResponseDto)
  @ApiOperation({ summary: 'Get list of products' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  @ApiQuery({
    name: 'brandId',
    required: false,
    description: 'Filter by Brand ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: ProductListResponseDto,
  })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('brandId') brandId?: number,
  ) {
    return this.productService.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      brandId: brandId ? Number(brandId) : undefined,
    });
  }

  @Get(':id')
  @Serialize(ProductItemResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductItemResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @Post(":id/favorite")
  @Serialize(CreatedUserFavoriteResponseDto)
  @ApiResponse({
    status: 201,
    description: 'User favorite created successfully',
    type: CreatedUserFavoriteResponseDto,
  })
  async createFavorite(
    @Body() data: CreateUserFavoriteDto,
  ) {
    return this.userData.createFavorite(data);
  }

  @Post(":id/add-to-cart")
  @Serialize(CreatedAddToCartResponseDto)
  @ApiResponse({
    status: 201,
    description: 'User Add To Cart created successfully',
    type: CreatedAddToCartResponseDto,
  })
  async createAddtoCart(
    @Body() data: CreateAddToCartDto,
  ) {
    return this.userData.createAddToCart(data);
  }

  @Get(":id/favorite")
  @Serialize(UserFavoriteListResponseDto)
  @ApiResponse({
    status: 201,
    description: 'User favorite List',
    type: UserFavoriteListResponseDto,
  })
  async getFavorite(
    @Body("userId") userId: number
  ) {
    return this.userData.getUserFavorite(userId);
  }

  @Get(":id/add-to-cart")
  @Serialize(AddToCartListResponseDto)
  @ApiResponse({
    status: 201,
    description: 'User Add To Cart successfully',
    type: AddToCartListResponseDto,
  })
  async getAddtoCart(
    //@Param('id', ParseIntPipe) id: number,
    @Body("userId") userId: number
  ) {
    return this.userData.getAddToCart(userId);
  }

  @Delete(":id/favorite")
  @Serialize(DeletedUserFavoriteResponseDto)
  @ApiResponse({
    status: 201,
    description: 'Deleted User favorite successfully',
    type: DeletedUserFavoriteResponseDto,
  })
  async deleteFavorite(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userData.deleteFavorite(id);
  }

  @Delete(":id/add-to-cart")
  @Serialize(DeletedAddToCartResponseDto)
  @ApiResponse({
    status: 201,
    description: 'Delete Add To Cart successfully',
    type: DeletedAddToCartResponseDto,
  })
  async deleteAddtoCart(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userData.deleteAddToCart(id);
  }
  
  @Post('testing')
 async testing(
    @Body('brandId') brandId: number,
    @Body('productId') productId: string,
    @Body('productMainImage') mainImage: number,
    @Body('productName') name: string,
  ) {
    console.log("test",  {
      type: TYPES.CREATED_PRODUCT,
      brandId: brandId,
      productId: productId,
      productMainImage: mainImage,
      productName: name
    })
    await publishEvent(EVENTS.PRODUCT_EVENT, {
      type: TYPES.CREATED_PRODUCT,
      brandId: brandId,
      productId: productId,
      productMainImage: mainImage,
      productName: name
    })
    return {}
  }
}

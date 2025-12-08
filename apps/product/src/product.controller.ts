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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/product-response.dto';

@ApiTags('Items')
@Controller('api/v1/items')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'List of products' })
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Product details', type: ProductResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

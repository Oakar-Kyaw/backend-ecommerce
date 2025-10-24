import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    Request,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { BrandService } from './brand.service';
  import { CreateBrandDto } from '../dto/create-brand.dto';
  import { UpdateBrandDto } from '../dto/update-brand.dto';
  import { Serialize } from '../../../libs/interceptor/response.interceptor';
  import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
  import {
    BrandListResponseDto,
    BrandByIdResponseDto,
    CreatedBrandResponseDto,
    UpdatedBrandResponseDto,
    DeletedBrandResponseDto,
  } from '../dto/brand-response.dto';
  import {
    NotFoundResponseDto,
    ServerErrorResponseDto,
  } from '../../../libs/interceptor/error-response';
  
  @ApiTags('Brands')
  @Controller('api/v1/brands')
  export class BrandController {
    constructor(private readonly brandService: BrandService) {}
  
    // ===== CREATE BRAND =====
    @Serialize(CreatedBrandResponseDto)
    @UseInterceptors(FileInterceptor('photo')) // optional file upload if needed
    @Post()
    @ApiBody({ type: CreateBrandDto })
    @ApiResponse({ status: 201, description: 'Brand created successfully', type: CreatedBrandResponseDto })
    @ApiResponse({ status: 500, description: 'Internal Server Error', type: ServerErrorResponseDto })
    create(@Body() createBrandDto: CreateBrandDto) {
      return this.brandService.create(createBrandDto);
    }
  
    // ===== GET ALL BRANDS =====
    @Serialize(BrandListResponseDto)
    @Get()
    @ApiOperation({ summary: 'Get list of brands, optionally filtered' })
    @ApiQuery({ name: 'isDeleted', required: false, description: 'Filter by deleted status' })
    @ApiQuery({ name: 'name', required: false, description: 'Filter by brand name' })
    @ApiQuery({ name: 'code', required: false, description: 'Filter by brand code' })
    @ApiResponse({ status: 200, description: 'List of brands', type: BrandListResponseDto })
    @ApiResponse({ status: 500, description: 'Internal Server Error', type: ServerErrorResponseDto })
    async findAll(
      @Query('isDeleted') isDeleted?: boolean,
      @Query('name') name?: string,
      @Query('code') code?: string,
    ) {
      return this.brandService.findAll({ isDeleted, name, code });
    }
  
    // ===== GET BRAND BY ID =====
    @Serialize(BrandByIdResponseDto)
    @Get(':id')
    @ApiResponse({ status: 200, description: 'Brand by ID', type: BrandByIdResponseDto })
    @ApiResponse({ status: 404, description: 'Brand not found', type: NotFoundResponseDto })
    @ApiResponse({ status: 500, description: 'Internal Server Error', type: ServerErrorResponseDto })
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.brandService.findOne(id);
    }
  
    // ===== UPDATE BRAND =====
    @Serialize(UpdatedBrandResponseDto)
    @UseInterceptors(FileInterceptor('photo')) // optional file upload
    @Patch(':id')
    @ApiResponse({ status: 200, description: 'Update brand by ID', type: UpdatedBrandResponseDto })
    @ApiResponse({ status: 404, description: 'Brand not found', type: NotFoundResponseDto })
    @ApiResponse({ status: 500, description: 'Internal Server Error', type: ServerErrorResponseDto })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateBrandDto: UpdateBrandDto) {
      return this.brandService.update(id, updateBrandDto);
    }
  
    // ===== DELETE BRAND (SOFT DELETE) =====
    @Serialize(DeletedBrandResponseDto)
    @Delete(':id')
    @ApiResponse({ status: 200, description: 'Soft delete brand by ID', type: DeletedBrandResponseDto })
    @ApiResponse({ status: 404, description: 'Brand not found', type: NotFoundResponseDto })
    @ApiResponse({ status: 500, description: 'Internal Server Error', type: ServerErrorResponseDto })
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.brandService.softDelete(id);
    }
  }
  
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
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CategoryListResponseDto,
  CategoryByIdResponseDto,
  CreatedCategoryResponseDto,
  UpdatedCategoryResponseDto,
  DeletedCategoryResponseDto,
} from '../../dto/category-response.dto';
import { Serialize } from 'libs/interceptor/response.interceptor';
import {
  NotFoundResponseDto,
  ServerErrorResponseDto,
} from 'libs/interceptor/error-response';

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ===== CREATE CATEGORY =====
  @Serialize(CreatedCategoryResponseDto)
  @Post()
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CreatedCategoryResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  // ===== GET ALL CATEGORIES =====
  @Serialize(CategoryListResponseDto)
  @Get()
  @ApiOperation({ summary: 'Get list of categories, optionally filtered' })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by category title',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by category description',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: CategoryListResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  findAll(
    @Query('title') title?: string,
    @Query('description') description?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.categoryService.findAll({
      title,
      description,
      search,
      page,
      pageSize,
    });
  }

  // ===== GET CATEGORY BY ID =====
  @Serialize(CategoryByIdResponseDto)
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Category by ID',
    type: CategoryByIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  // ===== UPDATE CATEGORY =====
  @Serialize(UpdatedCategoryResponseDto)
  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Update category by ID',
    type: UpdatedCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  // ===== DELETE CATEGORY (SOFT DELETE) =====
  @Serialize(DeletedCategoryResponseDto)
  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Soft delete category by ID',
    type: DeletedCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.softDelete(id);
  }
}

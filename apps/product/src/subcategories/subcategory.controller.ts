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
import { SubCategoryService } from './subcategory.service';
import { CreateSubCategoryDto } from '../../dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from '../../dto/update-subcategory.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  SubCategoryListResponseDto,
  SubCategoryByIdResponseDto,
  CreatedSubCategoryResponseDto,
  UpdatedSubCategoryResponseDto,
  DeletedSubCategoryResponseDto,
} from '../../dto/subcategory-response.dto';
import { Serialize } from 'libs/interceptor/response.interceptor';
import {
  NotFoundResponseDto,
  ServerErrorResponseDto,
} from 'libs/interceptor/error-response';

@ApiTags('SubCategories')
@Controller('api/v1/subcategories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  // ===== CREATE SUBCATEGORY =====
  @Serialize(CreatedSubCategoryResponseDto)
  @Post()
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'SubCategory created successfully',
    type: CreatedSubCategoryResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.subCategoryService.create(createSubCategoryDto);
  }

  // ===== GET ALL SUBCATEGORIES =====
  @Serialize(SubCategoryListResponseDto)
  @Get()
  @ApiOperation({ summary: 'Get list of subcategories, optionally filtered' })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by subcategory title',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by subcategory description',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
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
    description: 'List of subcategories',
    type: SubCategoryListResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  findAll(
    @Query('title') title?: string,
    @Query('description') description?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.subCategoryService.findAll({
      title,
      description,
      categoryId,
      search,
      page,
      pageSize,
    });
  }

  // ===== GET SUBCATEGORY BY ID =====
  @Serialize(SubCategoryByIdResponseDto)
  @Get(':id')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiResponse({
    status: 200,
    description: 'SubCategory details',
    type: SubCategoryByIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'SubCategory not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoryService.findOne(id);
  }

  // ===== UPDATE SUBCATEGORY =====
  @Serialize(UpdatedSubCategoryResponseDto)
  @Patch(':id')
  @ApiOperation({ summary: 'Update subcategory by ID' })
  @ApiBody({ type: UpdateSubCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'SubCategory updated successfully',
    type: UpdatedSubCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'SubCategory not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    return this.subCategoryService.update(id, updateSubCategoryDto);
  }

  // ===== DELETE SUBCATEGORY =====
  @Serialize(DeletedSubCategoryResponseDto)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete subcategory by ID' })
  @ApiResponse({
    status: 200,
    description: 'SubCategory deleted successfully',
    type: DeletedSubCategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'SubCategory not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoryService.remove(id);
  }
}

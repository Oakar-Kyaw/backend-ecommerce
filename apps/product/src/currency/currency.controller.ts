import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from '../../dto/create-currency.dto';
import { UpdateCurrencyDto } from '../../dto/update-currency.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('api/v1/currency')
@Controller('api/v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new currency' })
  create(@Body() createCurrencyDto: CreateCurrencyDto) {
    return this.currencyService.create(createCurrencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all currencies with pagination' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'pageSize', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.currencyService.findAll({ page, pageSize, search, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get currency by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.currencyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update currency' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ) {
    return this.currencyService.update(id, updateCurrencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete currency' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.currencyService.remove(id);
  }
}

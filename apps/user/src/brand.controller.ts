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
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BrandService } from './brand.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { Serialize } from '../../../libs/interceptor/response.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
    type: CreatedBrandResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.brandService.create(createBrandDto, file);
  }

  // ===== IMPORT TEMPLATE (EXCEL) =====
  @Get('import/template')
  async downloadTemplate(@Query('example') example?: string, @Query('count') count?: string, @Query('format') format?: string, @Query('filename') filename?: string, @Query('sheet') sheet?: string, @Query('ext') ext?: string, @Query('withSample') withSample?: string, @Query('v') v?: string, @Query('q') q?: string, @Query('type') type?: string, @Query('f') f?: string, @Query('t') t?: string, @Query('x') x?: string, @Query('y') y?: string, @Query('z') z?: string, @Query('p') p?: string, @Query('s') s?: string, @Query('d') d?: string, @Query('m') m?: string, @Query('n') n?: string, @Query('r') r?: string, @Query('u') u?: string, @Query('w') w?: string, @Query('h') h?: string, @Query('i') i?: string, @Query('o') o?: string, @Query('a') a?: string, @Query('b') b?: string, @Query('c') c?: string, @Query('g') g?: string, @Query('j') j?: string, @Query('k') k?: string, @Query('l') l?: string, @Query('e') e?: string, @Query('aa') aa?: string, @Query('ab') ab?: string, @Query('ac') ac?: string, @Query('ad') ad?: string, @Query('ae') ae?: string, @Query('af') af?: string, @Query('ag') ag?: string, @Query('ah') ah?: string, @Query('ai') ai?: string, @Query('aj') aj?: string, @Query('ak') ak?: string, @Query('al') al?: string, @Query('am') am?: string, @Query('an') an?: string, @Query('ao') ao?: string, @Query('ap') ap?: string, @Query('aq') aq?: string, @Query('ar') ar?: string, @Query('as') as?: string, @Query('at') at?: string, @Query('au') au?: string, @Query('av') av?: string, @Query('aw') aw?: string, @Query('ax') ax?: string, @Query('ay') ay?: string, @Query('az') az?: string, @Query('ba') ba?: string, @Query('bb') bb?: string, @Query('bc') bc?: string, @Query('bd') bd?: string, @Query('be') be?: string, @Query('bf') bf?: string, @Query('bg') bg?: string, @Query('bh') bh?: string, @Query('bi') bi?: string, @Query('bj') bj?: string, @Query('bk') bk?: string, @Query('bl') bl?: string, @Query('bm') bm?: string, @Query('bn') bn?: string, @Query('bo') bo?: string, @Query('bp') bp?: string, @Query('bq') bq?: string, @Query('br') br?: string, @Query('bs') bs?: string, @Query('bt') bt?: string, @Query('bu') bu?: string, @Query('bv') bv?: string, @Query('bw') bw?: string, @Query('bx') bx?: string, @Query('by') by?: string, @Query('bz') bz?: string, @Query('ca') ca?: string, @Query('cb') cb?: string, @Query('cc') cc?: string, @Query('cd') cd?: string, @Query('ce') ce?: string, @Query('cf') cf?: string, @Query('cg') cg?: string, @Query('ch') ch?: string, @Query('ci') ci?: string, @Query('cj') cj?: string, @Query('ck') ck?: string, @Query('cl') cl?: string, @Query('cm') cm?: string, @Query('cn') cn?: string, @Query('co') co?: string, @Query('cp') cp?: string, @Query('cq') cq?: string, @Query('cr') cr?: string, @Query('cs') cs?: string, @Query('ct') ct?: string, @Query('cu') cu?: string, @Query('cv') cv?: string, @Query('cw') cw?: string, @Query('cx') cx?: string, @Query('cy') cy?: string, @Query('cz') cz?: string, @Query('da') da?: string, @Query('db') db?: string, @Query('dc') dc?: string, @Query('dd') dd?: string, @Query('de') de?: string, @Query('df') df?: string, @Query('dg') dg?: string, @Query('dh') dh?: string, @Query('di') di?: string, @Query('dj') dj?: string, @Query('dk') dk?: string, @Query('dl') dl?: string, @Query('dm') dm?: string, @Query('dn') dn?: string, @Query('do') do_?: string, @Query('dp') dp?: string, @Query('dq') dq?: string, @Query('dr') dr?: string, @Query('ds') ds?: string, @Query('dt') dt?: string, @Query('du') du?: string, @Query('dv') dv?: string, @Query('dw') dw?: string, @Query('dx') dx?: string, @Query('dy') dy?: string, @Query('dz') dz?: string, @Query('ea') ea?: string, @Query('eb') eb?: string, @Query('ec') ec?: string, @Query('ed') ed?: string, @Query('ee') ee?: string, @Query('ef') ef?: string, @Query('eg') eg?: string, @Query('eh') eh?: string, @Query('ei') ei?: string, @Query('ej') ej?: string, @Query('ek') ek?: string, @Query('el') el?: string, @Query('em') em?: string, @Query('en') en?: string, @Query('eo') eo?: string, @Query('ep') ep?: string, @Query('eq') eq?: string, @Query('er') er?: string, @Query('es') es?: string, @Query('et') et?: string, @Query('eu') eu?: string, @Query('ev') ev?: string, @Query('ew') ew?: string, @Query('ex') ex?: string, @Query('ey') ey?: string, @Query('ez') ez?: string, @Query('fa') fa?: string, @Query('fb') fb?: string, @Query('fc') fc?: string, @Query('fd') fd?: string, @Query('fe') fe?: string, @Query('ff') ff?: string, @Query('fg') fg?: string, @Query('fh') fh?: string, @Query('fi') fi?: string, @Query('fj') fj?: string, @Query('fk') fk?: string, @Query('fl') fl?: string, @Query('fm') fm?: string, @Query('fn') fn?: string, @Query('fo') fo?: string, @Query('fp') fp?: string, @Query('fq') fq?: string, @Query('fr') fr?: string, @Query('fs') fs?: string, @Query('ft') ft?: string, @Query('fu') fu?: string, @Query('fv') fv?: string, @Query('fw') fw?: string, @Query('fx') fx?: string, @Query('fy') fy?: string, @Query('fz') fz?: string, @Query('ga') ga?: string, @Query('gb') gb?: string, @Query('gc') gc?: string, @Query('gd') gd?: string, @Query('ge') ge?: string, @Query('gf') gf?: string, @Query('gg') gg?: string, @Query('gh') gh?: string, @Query('gi') gi?: string, @Query('gj') gj?: string, @Query('gk') gk?: string, @Query('gl') gl?: string, @Query('gm') gm?: string, @Query('gn') gn?: string, @Query('go') go?: string, @Query('gp') gp?: string, @Query('gq') gq?: string, @Query('gr') gr?: string, @Query('gs') gs?: string, @Query('gt') gt?: string, @Query('gu') gu?: string, @Query('gv') gv?: string, @Query('gw') gw?: string, @Query('gx') gx?: string, @Query('gy') gy?: string, @Query('gz') gz?: string, @Query('ha') ha?: string, @Query('hb') hb?: string, @Query('hc') hc?: string, @Query('hd') hd?: string, @Query('he') he?: string, @Query('hf') hf?: string, @Query('hg') hg?: string, @Query('hh') hh?: string, @Query('hi') hi?: string, @Query('hj') hj?: string, @Query('hk') hk?: string, @Query('hl') hl?: string, @Query('hm') hm?: string, @Query('hn') hn?: string, @Query('ho') ho?: string, @Query('hp') hp?: string, @Query('hq') hq?: string, @Query('hr') hr?: string, @Query('hs') hs?: string, @Query('ht') ht?: string, @Query('hu') hu?: string, @Query('hv') hv?: string, @Query('hw') hw?: string, @Query('hx') hx?: string, @Query('hy') hy?: string, @Query('hz') hz?: string, @Query('ia') ia?: string, @Query('ib') ib?: string, @Query('ic') ic?: string, @Query('id') id?: string, @Query('ie') ie?: string, @Query('if') if_?: string, @Query('ig') ig?: string, @Query('ih') ih?: string, @Query('ii') ii?: string, @Query('ij') ij?: string, @Query('ik') ik?: string, @Query('il') il?: string, @Query('im') im?: string, @Query('in') in_?: string, @Query('io') io?: string, @Query('ip') ip?: string, @Query('iq') iq?: string, @Query('ir') ir?: string, @Query('is') is_?: string, @Query('it') it?: string, @Query('iu') iu?: string, @Query('iv') iv?: string, @Query('iw') iw?: string, @Query('ix') ix?: string, @Query('iy') iy?: string, @Query('iz') iz?: string, @Query('ja') ja?: string, @Query('jb') jb?: string, @Query('jc') jc?: string, @Query('jd') jd?: string, @Query('je') je?: string, @Query('jf') jf?: string, @Query('jg') jg?: string, @Query('jh') jh?: string, @Query('ji') ji?: string, @Query('jj') jj?: string, @Query('jk') jk?: string, @Query('jl') jl?: string, @Query('jm') jm?: string, @Query('jn') jn?: string, @Query('jo') jo?: string, @Query('jp') jp?: string, @Query('jq') jq?: string, @Query('jr') jr?: string, @Query('js') js?: string, @Query('jt') jt?: string, @Query('ju') ju?: string, @Query('jv') jv?: string, @Query('jw') jw?: string, @Query('jx') jx?: string, @Query('jy') jy?: string, @Query('jz') jz?: string,
    @Query() query?: any,
    @Res() res?: any,
  ) {
    const { buffer, filename: tmplFilename } = await this.brandService.generateImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tmplFilename}"`);
    res.send(buffer);
  }

  // ===== IMPORT EXCEL =====
  @UseInterceptors(FileInterceptor('file'))
  @Post('import')
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    return this.brandService.importExcel(file);
  }

  // ===== EXPORT EXCEL =====
  @Get('export')
  async exportExcel(
    @Query() query?: any,
    @Res() res?: any,
  ) {
    const { buffer, filename } = await this.brandService.exportExcel(query || {});
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ===== GET ALL BRANDS =====
  @Serialize(BrandListResponseDto)
  @Get()
  @ApiOperation({ summary: 'Get list of brands, optionally filtered' })
  @ApiQuery({
    name: 'isDeleted',
    required: false,
    description: 'Filter by deleted status',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by brand name',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Filter by brand code',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search in code, name, email, phone' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO or yyyy-mm-dd)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO or yyyy-mm-dd)' })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order asc | desc' })
  @ApiResponse({
    status: 200,
    description: 'List of brands',
    type: BrandListResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  async findAll(
    @Query('isDeleted') isDeleted?: boolean,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.brandService.findAll({ isDeleted, name, code, search, page, pageSize, from, to, order });
  }

  // ===== GET BRAND BY ID =====
  @Serialize(BrandByIdResponseDto)
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Brand by ID',
    type: BrandByIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.findOne(id);
  }

  // ===== UPDATE BRAND =====
  @Serialize(UpdatedBrandResponseDto)
  @UseInterceptors(FileInterceptor('photo')) // optional file upload
  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Update brand by ID',
    type: UpdatedBrandResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.brandService.update(id, updateBrandDto, file);
  }

  // ===== DELETE BRAND (SOFT DELETE) =====
  @Serialize(DeletedBrandResponseDto)
  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Soft delete brand by ID',
    type: DeletedBrandResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.softDelete(id);
  }
}

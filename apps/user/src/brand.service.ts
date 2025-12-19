import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { PublishMessage } from 'libs/queue/publish';
import { PRISMA } from '../prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';
import {
  getPagination,
  buildPaginationResponse,
} from '../../../libs/utils/pagination';
import * as XLSX from 'xlsx';
import { UsersService } from './user.service';
import { RoleEnum, CreateUserWithProfileDto } from '../dto/create-user.dto';
import { EventPublisherService } from './event-publisher.service';
import { BrandUserService } from './brand-user.service';
import { QueueServices } from 'libs/queue/constant';

@Injectable()
export class BrandService {
  constructor(
    private readonly uploadFile: FileUpload,
    @Inject(PRISMA) private readonly prisma,
    private readonly usersService: UsersService,
    private readonly eventPublisherService: EventPublisherService,
    private readonly brandUserService: BrandUserService,
  ) {}

  async getUsersByBrand(brandId: number) {
    return this.brandUserService.getUsersByBrand(brandId);
  }

  // ===== CREATE BRAND =====
  async create(createBrandDto: CreateBrandDto, file: Express.Multer.File) {
    const { name, code } = createBrandDto;
    let photoUrl: string = '';
    // Check duplicate name or code
    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    if (existingBrand) {
      throw new ConflictException('Brand name or code already exists');
    }

    if (file)
      photoUrl = (
        await this.uploadFile.uploadSingle({ file, folderName: 'brand' })
      ).url;
    const brand = await this.prisma.brand.create({
      data: {
        ...createBrandDto,
        photoUrl,
      },
    });
    console.log('brand user', createBrandDto);

    // Create User if email is provided
    if (createBrandDto.email) {
      try {
        await this.usersService.create({
          email: createBrandDto.email,
          password: 'Brand123@',
          role: RoleEnum.SALE,
          brandId: brand.id,
          firstName: createBrandDto.name,
          phone: createBrandDto.phone,
        } as CreateUserWithProfileDto);

        console.log('user');
        //write user to auth db
        QueueServices.map(async (name) => {
          await this.eventPublisherService.createUser(name, {
            email: createBrandDto.email,
            password: 'Brand123@',
            role: RoleEnum.SALE,
            brandId: brand.id,
            firstName: createBrandDto.name,
            phone: createBrandDto.phone,
          });
        });
        console.log('end');
      } catch (error) {
        // Log error but don't fail the brand creation?
        // Or rethrow? If we rethrow, the client sees an error even though brand is created.
        // Given the requirement is strict ("it should create user account"),
        // failure to create user might be considered a failure of the operation.
        // However, since we can't rollback brand creation easily here without transaction,
        // we'll log it.
        console.error('Failed to create user for brand:', error);
        // We could also throw a warning or return it in the message.
      }
    }

    return {
      success: true,
      message: 'CREATED_BRAND',
      data: brand,
    };
  }

  // ===== FIND ALL BRANDS =====
  async findAll(query: {
    isDeleted?: boolean;
    name?: string;
    code?: string;
    search?: string;
    page?: string;
    pageSize?: string;
    from?: string;
    to?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = { isDeleted: false };

    if (query?.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query?.name) where.name = query.name;
    if (query?.code) where.code = query.code;

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.from || query?.to) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (query.from) {
        createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const page = query?.page ? Number(query.page) : undefined;
    const pageSize = query?.pageSize ? Number(query.pageSize) : undefined;
    const order = query?.order === 'asc' ? 'asc' : 'desc';
    const meta = getPagination({ page, pageSize });

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { id: order },
        skip: meta.skip,
        take: meta.limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return buildPaginationResponse(brands, meta, total, 'LIST_OF_BRANDS');
  }

  // ===== FIND BRAND BY ID =====
  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });

    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);

    return {
      success: true,
      message: 'BRAND_BY_ID',
      data: brand,
    };
  }

  // ===== UPDATE BRAND =====
  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    file: Express.Multer.File,
  ) {
    let photoUrl: string | undefined = undefined;

    const existingBrand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand)
      throw new NotFoundException(`Brand with ID ${id} not found`);

    // Check if another brand has same name or code
    const otherBrand = await this.prisma.brand.findFirst({
      where: {
        NOT: { id },
        OR: [{ name: updateBrandDto.name }, { code: updateBrandDto.code }],
      },
    });

    if (otherBrand) {
      throw new ConflictException(
        'Brand name or code already exists in another brand',
      );
    }

    if (existingBrand.photoUrl) photoUrl = existingBrand.photoUrl;

    if (file) {
      if (photoUrl) {
        const deleteKey = photoUrl.split('.com/')[1];
        this.uploadFile.deleteFile(deleteKey);
      }

      photoUrl = (
        await this.uploadFile.uploadSingle({ file, folderName: 'brand' })
      ).url;
    }

    const updatedBrand = await this.prisma.brand.update({
      where: { id },
      data: { ...updateBrandDto, photoUrl },
    });

    return {
      success: true,
      message: 'UPDATED_BRAND',
      data: updatedBrand,
    };
  }

  // ===== SOFT DELETE BRAND =====
  async softDelete(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found.`);

    const deletedBrand = await this.prisma.brand.update({
      where: { id },
      data: { isDeleted: true },
    });

    return {
      success: true,
      message: 'DELETED_BRAND',
      data: deletedBrand,
    };
  }

  // ===== GENERATE IMPORT TEMPLATE =====
  async generateImportTemplate() {
    const headers = [
      'name',
      'code',
      'phone',
      'email',
      'address',
      'description',
      'feedback',
      'info',
    ];

    const sampleRows = [
      {
        name: 'Sample Brand A',
        code: 'SAMPLE_A',
        phone: '091111111',
        email: 'a@example.com',
        address: 'Address A',
        description: 'Description A',
        feedback: 'Good',
        info: 'Contact A',
      },
      {
        name: 'Sample Brand B',
        code: 'SAMPLE_B',
        phone: '092222222',
        email: 'b@example.com',
        address: 'Address B',
        description: 'Description B',
        feedback: 'Nice',
        info: 'Contact B',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Brands');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    const filename = 'brand_import_template.xlsx';
    return { buffer, filename };
  }

  // ===== IMPORT EXCEL =====
  async importExcel(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      return { success: false, message: 'No file uploaded', data: null };
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const name = String(row.name || '').trim();
        const code = String(row.code || '').trim();
        const phone = String(row.phone || '').trim() || undefined;
        const email = String(row.email || '').trim() || undefined;
        const address = String(row.address || '').trim() || undefined;
        const description = String(row.description || '').trim() || undefined;
        const feedback = String(row.feedback || '').trim() || undefined;
        const info = String(row.info || '').trim() || undefined;

        if (!name || !code) {
          errors.push(
            `Missing required fields (name/code) for row with code: ${code || 'N/A'}`,
          );
          continue;
        }

        const before = await this.prisma.brand.findUnique({ where: { code } });

        const updateData: any = {
          name,
          phone,
          email,
          address,
          description,
          feedback,
          info,
        };
        if (before && before.isDeleted) updateData.isDeleted = false;

        const result = await this.prisma.brand.upsert({
          where: { code },
          update: updateData,
          create: {
            name,
            code,
            phone,
            email,
            address,
            description,
            feedback,
            info,
          },
        });

        if (before) updated += 1;
        else created += 1;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    return {
      success: true,
      message: 'IMPORTED_BRANDS',
      data: { created, updated, failed: errors.length, errors },
    };
  }

  // ===== EXPORT EXCEL =====
  async exportExcel(query: {
    isDeleted?: boolean;
    name?: string;
    code?: string;
    search?: string;
    from?: string;
    to?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (query?.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query?.name) where.name = query.name;
    if (query?.code) where.code = query.code;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.from || query?.to) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (query.from) createdAt.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const order = query?.order === 'asc' ? 'asc' : 'desc';
    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { id: order },
    });

    const rows = brands.map((b: any) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
      description: b.description || '',
      feedback: b.feedback || '',
      info: b.info || '',
      isDeleted: !!b.isDeleted,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : '',
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : '',
    }));

    const headers = [
      'id',
      'name',
      'code',
      'phone',
      'email',
      'address',
      'description',
      'feedback',
      'info',
      'isDeleted',
      'createdAt',
      'updatedAt',
    ];
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Brands');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    const filename = 'brands_export.xlsx';
    return { buffer, filename };
  }
}

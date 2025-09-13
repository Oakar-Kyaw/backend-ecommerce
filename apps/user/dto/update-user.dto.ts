import { PartialType } from '@nestjs/mapped-types';
import { CreateUserWithProfileDto } from './create-user.dto';

export class UpdateUserWithProfileDto extends PartialType(CreateUserWithProfileDto) {}

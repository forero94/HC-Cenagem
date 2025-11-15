import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Permission } from '@prisma/client';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  description?: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  @IsOptional()
  permissions?: Permission[];

  @IsBoolean()
  @IsOptional()
  requiresLicense?: boolean;
}

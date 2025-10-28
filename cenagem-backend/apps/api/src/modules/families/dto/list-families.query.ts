import { ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListFamiliesQueryDto {
  @ApiPropertyOptional({ description: 'Texto a buscar en código o nombre' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FamilyStatus })
  @IsOptional()
  @IsEnum(FamilyStatus)
  status?: FamilyStatus;

  @ApiPropertyOptional({ description: 'Provincia para filtrar' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description:
      'Incluir los miembros de la familia para enriquecer los resultados de búsqueda',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withMembers?: boolean;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de registros a devolver',
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @ApiPropertyOptional({
    description: 'Cursor de paginación basado en el ID interno',
    example: '02ce1b4b-5b39-4c97-988e-474542b8ef91',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

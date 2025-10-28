import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentCategory } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListAttachmentsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por familia' })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por miembro' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estudio' })
  @IsOptional()
  @IsString()
  studyId?: string;

  @ApiPropertyOptional({ enum: AttachmentCategory })
  @IsOptional()
  @IsEnum(AttachmentCategory)
  category?: AttachmentCategory;

  @ApiPropertyOptional({ description: 'Filtrar por etiquetas (AND)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Cantidad máxima de resultados',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;

  @ApiPropertyOptional({ description: 'Cursor de paginación' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

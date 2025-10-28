import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudyStatus, StudyType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListStudiesQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por familia' })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por miembro' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ enum: StudyType })
  @IsOptional()
  @IsEnum(StudyType)
  type?: StudyType;

  @ApiPropertyOptional({ enum: StudyStatus })
  @IsOptional()
  @IsEnum(StudyStatus)
  status?: StudyStatus;

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

  @ApiPropertyOptional({
    description: 'Cursor de paginación',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

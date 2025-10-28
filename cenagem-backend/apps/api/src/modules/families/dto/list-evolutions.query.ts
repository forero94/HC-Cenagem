import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListEvolutionsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por un miembro en particular' })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de evoluciones a devolver',
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
    description: 'Cursor basado en el ID de la evolución',
    example: '51fa5b32-b2a2-4f5a-a537-b4d2babf7181',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

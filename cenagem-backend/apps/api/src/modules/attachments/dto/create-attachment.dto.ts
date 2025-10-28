import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentCategory } from '@prisma/client';

export class CreateAttachmentDto {
  @ApiPropertyOptional({
    description: 'Identificador de la familia (se puede inferir desde la ruta)',
  })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Miembro asociado al adjunto' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Estudio asociado al adjunto' })
  @IsOptional()
  @IsString()
  studyId?: string;

  @ApiProperty({ description: 'Nombre de archivo original' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiPropertyOptional({ description: 'Tipo MIME del archivo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contentType?: string;

  @ApiPropertyOptional({
    enum: AttachmentCategory,
    default: AttachmentCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(AttachmentCategory)
  category?: AttachmentCategory;

  @ApiPropertyOptional({ description: 'Descripción breve del archivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Etiquetas asociadas',
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadatos adicionales', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Contenido codificado en base64' })
  @IsNotEmpty()
  @IsString()
  base64Data!: string;
}

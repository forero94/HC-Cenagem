import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FamilyStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FamilyMotiveDto {
  @ApiPropertyOptional({
    description: 'Identificador del grupo de motivo de consulta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupId?: string;

  @ApiPropertyOptional({ description: 'Etiqueta legible del grupo de motivo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  groupLabel?: string;

  @ApiPropertyOptional({ description: 'Identificador del motivo específico' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  detailId?: string;

  @ApiPropertyOptional({
    description: 'Etiqueta legible del motivo específico',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  detailLabel?: string;

  @ApiPropertyOptional({ description: 'Notas internas sobre el motivo' })
  @IsOptional()
  @IsString()
  motiveNotes?: string;
}

export class CreateFamilyDto {
  @ApiProperty({
    description: 'Código único de la historia clínica familiar',
    example: 'AG-0001',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({
    description: 'Nombre breve para identificar a la familia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ enum: FamilyStatus, default: FamilyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(FamilyStatus)
  status?: FamilyStatus;

  @ApiPropertyOptional({
    description: 'Provincia o jurisdicción de residencia principal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @ApiPropertyOptional({ description: 'Ciudad de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ description: 'Dirección de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Etiquetas libres asociadas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: FamilyMotiveDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FamilyMotiveDto)
  motive?: FamilyMotiveDto;

  @ApiPropertyOptional({ description: 'Narrativa clínica principal del caso' })
  @IsOptional()
  @IsString()
  motiveNarrative?: string;

  @ApiPropertyOptional({
    description: 'Motivo de consulta aportado por el paciente/familia',
  })
  @IsOptional()
  @IsString()
  motivePatient?: string;

  @ApiPropertyOptional({ description: 'Motivo de derivación institucional' })
  @IsOptional()
  @IsString()
  motiveDerivation?: string;

  @ApiPropertyOptional({
    description: 'Información de contacto (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  contactInfo?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Información de consanguinidad (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  consanguinity?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Antecedentes obstétricos (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  obstetricHistory?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Información de abuelos (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  grandparents?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Datos administrativos de intake (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  intake?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales (estructura libre)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

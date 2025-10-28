import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudyStatus, StudyType } from '@prisma/client';

export class CreateStudyDto {
  @ApiPropertyOptional({
    description: 'Identificador de la familia (se puede inferir desde la ruta)',
  })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Miembro asociado al estudio' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiProperty({ enum: StudyType, description: 'Tipo de estudio' })
  @IsNotEmpty()
  @IsEnum(StudyType)
  type!: StudyType;

  @ApiProperty({ description: 'Nombre del estudio', maxLength: 150 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción breve', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: StudyStatus, default: StudyStatus.REQUESTED })
  @IsOptional()
  @IsEnum(StudyStatus)
  status?: StudyStatus;

  @ApiPropertyOptional({
    description: 'Fecha de solicitud',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  requestedAt?: string;

  @ApiPropertyOptional({
    description: 'Fecha de resultado',
    example: '2025-10-15',
  })
  @IsOptional()
  @IsDateString()
  resultAt?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadatos adicionales', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

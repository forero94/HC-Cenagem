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
import { PatientSex } from '@prisma/client';

export class CreateMemberDto {
  @ApiProperty({ description: 'Rol dentro de la familia', example: 'Proband' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  role!: string;

  @ApiPropertyOptional({
    description: 'Iniciales o identificador corto',
    example: 'A1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  initials?: string;

  @ApiPropertyOptional({
    description: 'Parentesco dentro de la familia',
    example: 'Hija',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationship?: string;

  @ApiPropertyOptional({ description: 'Nombre del miembro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  givenName?: string;

  @ApiPropertyOptional({ description: 'Segundo nombre del miembro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  middleName?: string;

  @ApiPropertyOptional({ description: 'Apellido del miembro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({ enum: PatientSex })
  @IsOptional()
  @IsEnum(PatientSex)
  sex?: PatientSex;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento en formato ISO',
    example: '2020-01-31',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico o motivo principal' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Ocupación declarada' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @ApiPropertyOptional({ description: 'Nivel de escolaridad' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  schoolingLevel?: string;

  @ApiPropertyOptional({ description: 'Resumen clínico' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Información de contacto', type: Object })
  @IsOptional()
  @IsObject()
  contacto?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Datos filiatorios', type: Object })
  @IsOptional()
  @IsObject()
  filiatorios?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Antecedentes personales', type: Object })
  @IsOptional()
  @IsObject()
  antecedentes?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Notas libres', type: Object })
  @IsOptional()
  @IsObject()
  notes?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Metadatos adicionales', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

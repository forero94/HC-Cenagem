import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @ApiPropertyOptional({
    description: 'Identificador de la familia (se puede inferir desde la ruta)',
    example: 'a3a6d6e2-4f7f-44a3-b9c9-2fc242b1a8b1',
  })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({
    description: 'Identificador opcional del miembro asociado',
    example: '71485202-68b7-4b3c-9a85-2ccc3c67667d',
  })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiProperty({ description: 'Fecha y hora programada en formato ISO' })
  @IsNotEmpty()
  @IsDateString()
  scheduledFor!: string;

  @ApiPropertyOptional({
    description: 'Duración estimada en minutos',
    minimum: 5,
    maximum: 480,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMins?: number;

  @ApiPropertyOptional({
    description: 'Número de cupo/asiento dentro de la franja',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  seatNumber?: number;

  @ApiPropertyOptional({ description: 'Motivo resumido', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motive?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales del turno',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    description: 'Estado inicial del turno',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Metadatos adicionales', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

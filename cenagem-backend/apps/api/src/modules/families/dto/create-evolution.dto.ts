import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEvolutionDto {
  @ApiProperty({ description: 'Texto de la evolución registrada' })
  @IsNotEmpty()
  @IsString()
  note!: string;

  @ApiPropertyOptional({ description: 'Nombre de quien registra la evolución' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  authorName?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del profesional' })
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @ApiPropertyOptional({
    description: 'Fecha de registro (por defecto se usa el momento actual)',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

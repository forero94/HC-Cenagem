import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateUploadTicketDto {
  @ApiPropertyOptional({
    description: 'Categoría de adjunto a la que se asociará el ticket.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Integrante específico al que se asociará el ticket.',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Minutos de vigencia del ticket (1 a 180).',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  expiresInMinutes?: number;
}

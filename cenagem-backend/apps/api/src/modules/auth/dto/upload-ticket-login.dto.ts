import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadTicketLoginDto {
  @ApiProperty({
    description:
      'Ticket emitido previamente para permitir la carga de fotos desde otro dispositivo.',
  })
  @IsString()
  ticket: string;
}

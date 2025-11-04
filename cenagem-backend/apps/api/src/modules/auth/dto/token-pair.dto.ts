import { ApiProperty } from '@nestjs/swagger';

export class TokenPairDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ nullable: true })
  refreshToken: string | null;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  refreshExpiresIn: number;
}

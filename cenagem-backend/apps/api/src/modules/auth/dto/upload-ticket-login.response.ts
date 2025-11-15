import { ApiProperty } from '@nestjs/swagger';
import { TokenPairDto } from './token-pair.dto';

class UploadTicketUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ required: false, nullable: true })
  primaryRole: string | null;

  @ApiProperty({ required: false, nullable: true })
  licenseNumber: string | null;

  @ApiProperty({ required: false, nullable: true })
  documentNumber: string | null;

  @ApiProperty({ enum: ['upload-ticket'] })
  scope: 'upload-ticket';
}

class UploadTicketMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false, nullable: true })
  role?: string | null;

  @ApiProperty({ required: false, nullable: true })
  initials?: string | null;
}

class UploadTicketContextDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  familyId: string;

  @ApiProperty({ required: false, nullable: true })
  memberId: string | null;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  familyCode: string;

  @ApiProperty({ required: false, nullable: true })
  familyDisplayName: string | null;

  @ApiProperty({ required: false, nullable: true })
  memberLabel: string | null;

  @ApiProperty({ type: [UploadTicketMemberDto] })
  members: UploadTicketMemberDto[];
}

export class UploadTicketLoginResponseDto {
  @ApiProperty({ type: TokenPairDto })
  tokens: TokenPairDto;

  @ApiProperty({ type: UploadTicketUserDto })
  user: UploadTicketUserDto;

  @ApiProperty({ type: UploadTicketContextDto })
  ticket: UploadTicketContextDto;
}

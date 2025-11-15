import { TokenPairDto } from './token-pair.dto';
declare class UploadTicketUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    primaryRole: string | null;
    licenseNumber: string | null;
    documentNumber: string | null;
    scope: 'upload-ticket';
}
declare class UploadTicketMemberDto {
    id: string;
    label: string;
    role?: string | null;
    initials?: string | null;
}
declare class UploadTicketContextDto {
    id: string;
    familyId: string;
    memberId: string | null;
    expiresAt: Date;
    familyCode: string;
    familyDisplayName: string | null;
    memberLabel: string | null;
    members: UploadTicketMemberDto[];
}
export declare class UploadTicketLoginResponseDto {
    tokens: TokenPairDto;
    user: UploadTicketUserDto;
    ticket: UploadTicketContextDto;
}
export {};

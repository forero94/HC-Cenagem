import { PatientSex } from '@prisma/client';
export declare class CreateMemberDto {
    role: string;
    initials?: string;
    relationship?: string;
    givenName?: string;
    middleName?: string;
    lastName?: string;
    sex?: PatientSex;
    birthDate?: string;
    diagnosis?: string;
    occupation?: string;
    schoolingLevel?: string;
    summary?: string;
    contacto?: Record<string, unknown>;
    filiatorios?: Record<string, unknown>;
    antecedentes?: Record<string, unknown>;
    notes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

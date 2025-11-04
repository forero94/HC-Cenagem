import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database';
import { Prisma } from '@prisma/client';
export declare class UploadTicketsService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    createForFamily(input: {
        familyId: string;
        memberId?: string | null;
        createdById: string;
        expiresInMinutes?: number | null;
    }): Promise<{
        ticket: string;
        expiresAt: Date;
        familyId: string;
        memberId: string | null;
        familyCode: string;
        familyDisplayName: string | null;
        memberLabel: string | null;
    }>;
    consume(ticketValue: string): Promise<{
        ticket: {
            family: {
                id: string;
                code: string;
                displayName: string | null;
            };
            member: {
                id: string;
                lastName: string | null;
                role: string | null;
                givenName: string | null;
                filiatorios: Prisma.JsonValue;
            } | null;
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
        } & {
            id: string;
            metadata: Prisma.JsonValue | null;
            createdAt: Date;
            familyId: string;
            memberId: string | null;
            secretHash: string;
            expiresAt: Date;
            usageCount: number;
            lastUsedAt: Date | null;
            revokedAt: Date | null;
            createdById: string;
        };
        familyCode: string;
        familyDisplayName: string | null;
        memberLabel: string | null;
        members: {
            id: string;
            label: string;
            role: string | null;
            initials: string | null;
        }[];
    }>;
    private parseTicketValue;
    private resolveTtlMinutes;
    private getMemberInitials;
    private buildTicketMetadata;
    private getMemberMetadataLabel;
    private buildMemberLabel;
}

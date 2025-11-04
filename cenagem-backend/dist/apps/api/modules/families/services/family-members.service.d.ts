import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { FamilyMemberDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';
export declare class FamilyMembersService extends FamilyBaseService {
    private readonly mapper;
    constructor(prisma: PrismaService, mapper: FamilyMapper);
    listMembers(familyId: string): Promise<FamilyMemberDto[]>;
    getMemberOrThrow(familyId: string, memberId: string): Promise<FamilyMemberDto>;
    createMember(familyId: string, input: CreateMemberDto): Promise<FamilyMemberDto>;
    updateMember(familyId: string, memberId: string, input: UpdateMemberDto): Promise<FamilyMemberDto>;
    deleteMember(familyId: string, memberId: string): Promise<void>;
    getMembersForFamily(familyId: string, client: Prisma.TransactionClient): Promise<FamilyMemberDto[]>;
}

import { PrismaService } from '@infrastructure/database';
import { CreateFamilyDto } from '../dto/create-family.dto';
import { UpdateFamilyDto } from '../dto/update-family.dto';
import { ListFamiliesQueryDto } from '../dto/list-families.query';
import { FamilyDetailDto, FamilyDto, FamilyMemberDto, FamilyEvolutionDto, FamilyAttachmentDto, FamilyAppointmentDto, FamilyStudyDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyMembersService } from './family-members.service';
import { FamilyEvolutionsService } from './family-evolutions.service';
import { FamilyAttachmentsService } from './family-attachments.service';
export declare class FamiliesService {
    private readonly prisma;
    private readonly mapper;
    private readonly membersService;
    private readonly evolutionsService;
    private readonly attachmentsService;
    constructor(prisma: PrismaService, mapper: FamilyMapper, membersService: FamilyMembersService, evolutionsService: FamilyEvolutionsService, attachmentsService: FamilyAttachmentsService);
    listFamilies(query: ListFamiliesQueryDto): Promise<{
        data: FamilyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createFamily(input: CreateFamilyDto): Promise<FamilyDetailDto>;
    getFamilyOrThrow(familyId: string): Promise<FamilyDetailDto>;
    updateFamily(familyId: string, input: UpdateFamilyDto): Promise<FamilyDetailDto>;
    private loadFamilyOrThrow;
    private buildFamilyDetail;
    private composeMetadata;
    private handlePrismaError;
    private prismaErrorTargets;
}
export type { FamilyDto, FamilyDetailDto, FamilyMemberDto, FamilyEvolutionDto, FamilyAttachmentDto, FamilyAppointmentDto, FamilyStudyDto, };

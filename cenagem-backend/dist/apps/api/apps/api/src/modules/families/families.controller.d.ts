import { FamiliesService } from './services/families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { ListFamiliesQueryDto } from './dto/list-families.query';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateEvolutionDto } from './dto/create-evolution.dto';
import { ListEvolutionsQueryDto } from './dto/list-evolutions.query';
import { FamilyMembersService } from './services/family-members.service';
import { FamilyEvolutionsService } from './services/family-evolutions.service';
export declare class FamiliesController {
    private readonly families;
    private readonly members;
    private readonly evolutions;
    constructor(families: FamiliesService, members: FamilyMembersService, evolutions: FamilyEvolutionsService);
    listFamilies(query: ListFamiliesQueryDto): Promise<{
        data: import("./families.types").FamilyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createFamily(body: CreateFamilyDto): Promise<import("./families.types").FamilyDetailDto>;
    getFamily(familyId: string): Promise<import("./families.types").FamilyDetailDto>;
    updateFamily(familyId: string, body: UpdateFamilyDto): Promise<import("./families.types").FamilyDetailDto>;
    listMembers(familyId: string): Promise<import("./families.types").FamilyMemberDto[]>;
    createMember(familyId: string, body: CreateMemberDto): Promise<import("./families.types").FamilyMemberDto>;
    getMember(familyId: string, memberId: string): Promise<import("./families.types").FamilyMemberDto>;
    updateMember(familyId: string, memberId: string, body: UpdateMemberDto): Promise<import("./families.types").FamilyMemberDto>;
    deleteMember(familyId: string, memberId: string): Promise<{
        success: boolean;
    }>;
    listEvolutions(familyId: string, query: ListEvolutionsQueryDto): Promise<{
        data: import("./families.types").FamilyEvolutionDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createEvolution(familyId: string, memberId: string, body: CreateEvolutionDto): Promise<import("./families.types").FamilyEvolutionDto>;
}

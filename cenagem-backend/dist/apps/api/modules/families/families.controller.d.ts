import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { ListFamiliesQueryDto } from './dto/list-families.query';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateEvolutionDto } from './dto/create-evolution.dto';
import { ListEvolutionsQueryDto } from './dto/list-evolutions.query';
export declare class FamiliesController {
    private readonly families;
    constructor(families: FamiliesService);
    listFamilies(query: ListFamiliesQueryDto): Promise<{
        data: import("./families.service").FamilyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createFamily(body: CreateFamilyDto): Promise<import("./families.service").FamilyDetailDto>;
    getFamily(familyId: string): Promise<import("./families.service").FamilyDetailDto>;
    updateFamily(familyId: string, body: UpdateFamilyDto): Promise<import("./families.service").FamilyDetailDto>;
    listMembers(familyId: string): Promise<import("./families.service").FamilyMemberDto[]>;
    createMember(familyId: string, body: CreateMemberDto): Promise<import("./families.service").FamilyMemberDto>;
    getMember(familyId: string, memberId: string): Promise<import("./families.service").FamilyMemberDto>;
    updateMember(familyId: string, memberId: string, body: UpdateMemberDto): Promise<import("./families.service").FamilyMemberDto>;
    deleteMember(familyId: string, memberId: string): Promise<{
        success: boolean;
    }>;
    listEvolutions(familyId: string, query: ListEvolutionsQueryDto): Promise<{
        data: import("./families.service").FamilyEvolutionDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createEvolution(familyId: string, memberId: string, body: CreateEvolutionDto): Promise<import("./families.service").FamilyEvolutionDto>;
}

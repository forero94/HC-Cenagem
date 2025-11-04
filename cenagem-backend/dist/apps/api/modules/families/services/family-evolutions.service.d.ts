import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateEvolutionDto } from '../dto/create-evolution.dto';
import { ListEvolutionsQueryDto } from '../dto/list-evolutions.query';
import { FamilyEvolutionDto } from '../families.types';
import { FamilyMapper } from './family-mapper.service';
import { FamilyBaseService } from './family-base.service';
export declare class FamilyEvolutionsService extends FamilyBaseService {
    private readonly mapper;
    constructor(prisma: PrismaService, mapper: FamilyMapper);
    listEvolutions(familyId: string, query: ListEvolutionsQueryDto): Promise<{
        data: FamilyEvolutionDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    createEvolution(familyId: string, memberId: string, input: CreateEvolutionDto): Promise<FamilyEvolutionDto>;
    getEvolutionsForFamily(familyId: string, client: Prisma.TransactionClient): Promise<FamilyEvolutionDto[]>;
}

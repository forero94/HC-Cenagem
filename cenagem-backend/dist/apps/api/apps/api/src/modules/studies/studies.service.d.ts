import { StudyStatus, StudyType } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { ListStudiesQueryDto } from './dto/list-studies.query';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
export interface StudyDto {
    id: string;
    familyId: string;
    memberId?: string | null;
    type: StudyType;
    status: StudyStatus;
    name: string;
    description?: string | null;
    requestedAt?: Date | null;
    resultAt?: Date | null;
    notes?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class StudiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listStudies(query: ListStudiesQueryDto): Promise<{
        data: StudyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    listForFamily(familyId: string, query: ListStudiesQueryDto): Promise<{
        data: StudyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    getById(studyId: string): Promise<StudyDto>;
    createForFamily(familyId: string, input: CreateStudyDto): Promise<StudyDto>;
    create(input: CreateStudyDto): Promise<StudyDto>;
    update(studyId: string, input: UpdateStudyDto): Promise<StudyDto>;
    remove(studyId: string): Promise<void>;
    private mapStudy;
    private buildWhere;
    private jsonFromDb;
    private jsonInput;
    private currentJson;
    private assertFamilyExists;
}

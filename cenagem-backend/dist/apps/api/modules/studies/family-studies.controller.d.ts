import { StudiesService } from './studies.service';
import { ListStudiesQueryDto } from './dto/list-studies.query';
import { CreateStudyDto } from './dto/create-study.dto';
export declare class FamilyStudiesController {
    private readonly studies;
    constructor(studies: StudiesService);
    list(familyId: string, query: ListStudiesQueryDto): Promise<{
        data: import("./studies.service").StudyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    create(familyId: string, body: CreateStudyDto): Promise<import("./studies.service").StudyDto>;
}

import { StudiesService } from './studies.service';
import { ListStudiesQueryDto } from './dto/list-studies.query';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
export declare class StudiesController {
    private readonly studies;
    constructor(studies: StudiesService);
    list(query: ListStudiesQueryDto): Promise<{
        data: import("./studies.service").StudyDto[];
        meta: {
            nextCursor?: string;
        };
    }>;
    create(body: CreateStudyDto): Promise<import("./studies.service").StudyDto>;
    getById(studyId: string): Promise<import("./studies.service").StudyDto>;
    update(studyId: string, body: UpdateStudyDto): Promise<import("./studies.service").StudyDto>;
    delete(studyId: string): Promise<{
        success: boolean;
    }>;
}

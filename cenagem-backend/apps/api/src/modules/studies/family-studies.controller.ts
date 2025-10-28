import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StudiesService } from './studies.service';
import { ListStudiesQueryDto } from './dto/list-studies.query';
import { CreateStudyDto } from './dto/create-study.dto';

@ApiTags('studies')
@Controller({
  path: 'families/:familyId/studies',
  version: '1',
})
export class FamilyStudiesController {
  constructor(private readonly studies: StudiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar estudios de una familia' })
  @ApiOkResponse({ description: 'Estudios listados' })
  list(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Query() query: ListStudiesQueryDto,
  ) {
    return this.studies.listForFamily(familyId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un estudio para una familia' })
  @ApiCreatedResponse({ description: 'Estudio creado' })
  create(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateStudyDto,
  ) {
    return this.studies.createForFamily(familyId, body);
  }
}

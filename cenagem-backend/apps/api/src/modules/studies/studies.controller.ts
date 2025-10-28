import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateStudyDto } from './dto/update-study.dto';

@ApiTags('studies')
@Controller({
  path: 'studies',
  version: '1',
})
export class StudiesController {
  constructor(private readonly studies: StudiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar estudios' })
  @ApiOkResponse({ description: 'Listado de estudios' })
  list(@Query() query: ListStudiesQueryDto) {
    return this.studies.listStudies(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un estudio' })
  @ApiCreatedResponse({ description: 'Estudio creado' })
  create(@Body() body: CreateStudyDto) {
    return this.studies.create(body);
  }

  @Get(':studyId')
  @ApiOperation({ summary: 'Obtener detalle de un estudio' })
  @ApiOkResponse({ description: 'Estudio encontrado' })
  getById(@Param('studyId', ParseUUIDPipe) studyId: string) {
    return this.studies.getById(studyId);
  }

  @Patch(':studyId')
  @ApiOperation({ summary: 'Actualizar un estudio' })
  @ApiOkResponse({ description: 'Estudio actualizado' })
  update(
    @Param('studyId', ParseUUIDPipe) studyId: string,
    @Body() body: UpdateStudyDto,
  ) {
    return this.studies.update(studyId, body);
  }

  @Delete(':studyId')
  @ApiOperation({ summary: 'Eliminar un estudio' })
  @ApiOkResponse({ description: 'Estudio eliminado' })
  async delete(@Param('studyId', ParseUUIDPipe) studyId: string) {
    await this.studies.remove(studyId);
    return { success: true };
  }
}

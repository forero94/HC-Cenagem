import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('families')
@Controller({
  path: 'families',
  version: '1',
})
export class FamiliesController {
  constructor(
    private readonly families: FamiliesService,
    private readonly members: FamilyMembersService,
    private readonly evolutions: FamilyEvolutionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar familias' })
  @ApiOkResponse({ description: 'Listado paginado de familias' })
  listFamilies(@Query() query: ListFamiliesQueryDto) {
    return this.families.listFamilies(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva familia' })
  @ApiCreatedResponse({ description: 'Familia creada' })
  createFamily(@Body() body: CreateFamilyDto) {
    return this.families.createFamily(body);
  }

  @Get(':familyId')
  @ApiOperation({ summary: 'Obtener detalle de una familia' })
  @ApiOkResponse({ description: 'Familia encontrada' })
  getFamily(@Param('familyId', ParseUUIDPipe) familyId: string) {
    return this.families.getFamilyOrThrow(familyId);
  }

  @Patch(':familyId')
  @ApiOperation({ summary: 'Actualizar datos de una familia' })
  @ApiOkResponse({ description: 'Familia actualizada' })
  updateFamily(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: UpdateFamilyDto,
  ) {
    return this.families.updateFamily(familyId, body);
  }

  @Get(':familyId/members')
  @ApiOperation({ summary: 'Listar miembros de una familia' })
  @ApiOkResponse({ description: 'Miembros listados' })
  listMembers(@Param('familyId', ParseUUIDPipe) familyId: string) {
    return this.members.listMembers(familyId);
  }

  @Post(':familyId/members')
  @ApiOperation({ summary: 'Crear un miembro dentro de una familia' })
  @ApiCreatedResponse({ description: 'Miembro creado' })
  createMember(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateMemberDto,
  ) {
    return this.members.createMember(familyId, body);
  }

  @Get(':familyId/members/:memberId')
  @ApiOperation({ summary: 'Obtener un miembro específico de una familia' })
  @ApiOkResponse({ description: 'Miembro encontrado' })
  getMember(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.members.getMemberOrThrow(familyId, memberId);
  }

  @Patch(':familyId/members/:memberId')
  @ApiOperation({ summary: 'Actualizar un miembro dentro de una familia' })
  @ApiOkResponse({ description: 'Miembro actualizado' })
  updateMember(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.members.updateMember(familyId, memberId, body);
  }

  @Delete(':familyId/members/:memberId')
  @ApiOperation({ summary: 'Eliminar un miembro de una familia' })
  @ApiOkResponse({ description: 'Miembro eliminado' })
  async deleteMember(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.members.deleteMember(familyId, memberId);
    return { success: true };
  }

  @Get(':familyId/evolutions')
  @ApiOperation({
    summary: 'Listar evoluciones clínicas asociadas a la familia',
  })
  @ApiOkResponse({ description: 'Evoluciones listadas' })
  listEvolutions(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Query() query: ListEvolutionsQueryDto,
  ) {
    return this.evolutions.listEvolutions(familyId, query);
  }

  @Post(':familyId/members/:memberId/evolutions')
  @ApiOperation({ summary: 'Registrar una evolución clínica para un miembro' })
  @ApiCreatedResponse({ description: 'Evolución creada' })
  createEvolution(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: CreateEvolutionDto,
  ) {
    return this.evolutions.createEvolution(familyId, memberId, body);
  }
}

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
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@ApiTags('attachments')
@Controller({
  path: 'families/:familyId/attachments',
  version: '1',
})
export class FamilyAttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar adjuntos de una familia' })
  @ApiOkResponse({ description: 'Adjuntos listados' })
  list(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Query() query: ListAttachmentsQueryDto,
  ) {
    return this.attachments.listForFamily(familyId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un adjunto para una familia' })
  @ApiCreatedResponse({ description: 'Adjunto creado' })
  create(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateAttachmentDto,
  ) {
    return this.attachments.createForFamily(familyId, body);
  }
}

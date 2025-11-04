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
import { ActiveUserData, CurrentUser, UploadTicketAllowed } from '@common';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadTicketsService } from './upload-tickets.service';
import { CreateUploadTicketDto } from './dto/create-upload-ticket.dto';

@ApiTags('attachments')
@Controller({
  path: 'families/:familyId/attachments',
  version: '1',
})
export class FamilyAttachmentsController {
  constructor(
    private readonly attachments: AttachmentsService,
    private readonly uploadTickets: UploadTicketsService,
  ) {}

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
  @UploadTicketAllowed()
  @ApiOperation({ summary: 'Crear un adjunto para una familia' })
  @ApiCreatedResponse({ description: 'Adjunto creado' })
  create(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateAttachmentDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    return this.attachments.createForFamily(familyId, body, actor);
  }

  @Post('upload-ticket')
  @ApiOperation({ summary: 'Generar un ticket temporal para subir fotos' })
  @ApiCreatedResponse({ description: 'Ticket generado' })
  createUploadTicket(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() body: CreateUploadTicketDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    return this.uploadTickets.createForFamily({
      familyId,
      memberId: body.memberId,
      createdById: actor.userId,
      expiresInMinutes: body.expiresInMinutes,
    });
  }
}

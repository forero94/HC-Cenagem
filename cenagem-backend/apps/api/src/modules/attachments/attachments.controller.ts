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
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

@ApiTags('attachments')
@Controller({
  path: 'attachments',
  version: '1',
})
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar adjuntos' })
  @ApiOkResponse({ description: 'Adjuntos listados' })
  list(@Query() query: ListAttachmentsQueryDto) {
    return this.attachments.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un adjunto' })
  @ApiCreatedResponse({ description: 'Adjunto creado' })
  create(@Body() body: CreateAttachmentDto) {
    return this.attachments.create(body);
  }

  @Get(':attachmentId')
  @ApiOperation({ summary: 'Obtener detalle de un adjunto' })
  @ApiOkResponse({ description: 'Adjunto encontrado' })
  getById(@Param('attachmentId', ParseUUIDPipe) attachmentId: string) {
    return this.attachments.getById(attachmentId);
  }

  @Get(':attachmentId/download')
  @ApiOperation({ summary: 'Descargar un adjunto en binario' })
  async download(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const content = await this.attachments.getContent(attachmentId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(content.fileName)}"`,
    );
    if (content.contentType) {
      res.setHeader('Content-Type', content.contentType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    res.setHeader(
      'Content-Length',
      String(content.size ?? content.buffer.length),
    );
    res.send(content.buffer);
  }

  @Patch(':attachmentId')
  @ApiOperation({ summary: 'Actualizar un adjunto' })
  @ApiOkResponse({ description: 'Adjunto actualizado' })
  update(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Body() body: UpdateAttachmentDto,
  ) {
    return this.attachments.update(attachmentId, body);
  }

  @Delete(':attachmentId')
  @ApiOperation({ summary: 'Eliminar un adjunto' })
  @ApiOkResponse({ description: 'Adjunto eliminado' })
  async delete(@Param('attachmentId', ParseUUIDPipe) attachmentId: string) {
    await this.attachments.remove(attachmentId);
    return { success: true };
  }
}

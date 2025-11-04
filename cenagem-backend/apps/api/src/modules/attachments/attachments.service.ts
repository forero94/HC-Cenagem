import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Attachment, AttachmentCategory, Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { ActiveUserData } from '@common';
import { ListAttachmentsQueryDto } from './dto/list-attachments.query';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

export interface AttachmentDto {
  id: string;
  familyId: string;
  memberId?: string | null;
  studyId?: string | null;
  fileName: string;
  contentType?: string | null;
  size?: number | null;
  category: AttachmentCategory;
  description?: string | null;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentDetailDto extends AttachmentDto {
  base64Data?: string;
}

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListAttachmentsQueryDto,
  ): Promise<{ data: AttachmentDto[]; meta: { nextCursor?: string } }> {
    const where = this.buildWhere(query);
    const take = query.limit ?? 50;

    const attachments = await this.prisma.attachment.findMany({
      where,
      take: take + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined;
    if (attachments.length > take) {
      const next = attachments.pop();
      nextCursor = next?.id;
    }

    return {
      data: attachments.map((attachment: Attachment) =>
        this.mapAttachment(attachment),
      ),
      meta: { nextCursor },
    };
  }

  async listForFamily(
    familyId: string,
    query: ListAttachmentsQueryDto,
  ): Promise<{ data: AttachmentDto[]; meta: { nextCursor?: string } }> {
    return this.list({ ...query, familyId });
  }

  async getById(attachmentId: string): Promise<AttachmentDetailDto> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    return this.mapAttachmentDetail(attachment);
  }

  async getContent(attachmentId: string): Promise<{
    fileName: string;
    contentType?: string | null;
    size?: number | null;
    buffer: Buffer;
  }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        fileName: true,
        contentType: true,
        size: true,
        content: true,
      },
    });

    if (!attachment || !attachment.content) {
      throw new NotFoundException('Contenido no disponible');
    }

    return {
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      buffer: Buffer.from(attachment.content),
    };
  }

  async createForFamily(
    familyId: string,
    input: CreateAttachmentDto,
    actor?: ActiveUserData,
  ): Promise<AttachmentDetailDto> {
    await this.assertFamilyExists(familyId);

    if (actor?.scope === 'upload-ticket') {
      if (actor.uploadTicketFamilyId !== familyId) {
        throw new UnauthorizedException(
          'El ticket no autoriza subir archivos en esta familia.',
        );
      }
      if (
        actor.uploadTicketMemberId &&
        actor.uploadTicketMemberId !== input.memberId
      ) {
        throw new UnauthorizedException(
          'El ticket sólo permite subir archivos para el integrante seleccionado.',
        );
      }
    }

    const buffer = this.decodeBase64(input.base64Data);

    let memberId: string | null = null;
    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });
      if (!member || member.familyId !== familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
      }
      memberId = member.id;
    }

    let studyId: string | null = null;
    if (input.studyId) {
      const study = await this.prisma.study.findUnique({
        where: { id: input.studyId },
        select: { id: true, familyId: true },
      });
      if (!study || study.familyId !== familyId) {
        throw new NotFoundException(
          'El estudio indicado no pertenece a la familia',
        );
      }
      studyId = study.id;
    }

    const created = await this.prisma.attachment.create({
      data: {
        familyId,
        memberId,
        studyId,
        fileName: input.fileName.trim(),
        contentType: input.contentType?.trim() || null,
        size: buffer.length,
        category: input.category ?? AttachmentCategory.OTHER,
        description: input.description?.trim() || null,
        tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
        metadata: this.composeMetadata(input.metadata, actor),
        content: buffer,
        uploadedById: actor?.userId ?? null,
      },
    });

    return this.mapAttachmentDetail(created);
  }

  async create(
    input: CreateAttachmentDto,
    actor?: ActiveUserData,
  ): Promise<AttachmentDetailDto> {
    if (!input.familyId) {
      throw new NotFoundException(
        'Debe especificarse la familia para subir un adjunto',
      );
    }
    return this.createForFamily(input.familyId, input, actor);
  }

  async update(
    attachmentId: string,
    input: UpdateAttachmentDto,
  ): Promise<AttachmentDetailDto> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    if (input.memberId) {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: { id: true, familyId: true },
      });
      if (!member || member.familyId !== attachment.familyId) {
        throw new NotFoundException(
          'El miembro indicado no pertenece a la familia',
        );
      }
    }

    if (input.studyId) {
      const study = await this.prisma.study.findUnique({
        where: { id: input.studyId },
        select: { id: true, familyId: true },
      });
      if (!study || study.familyId !== attachment.familyId) {
        throw new NotFoundException(
          'El estudio indicado no pertenece a la familia',
        );
      }
    }

    let contentBuffer: Buffer | undefined;
    if (input.base64Data) {
      contentBuffer = this.decodeBase64(input.base64Data);
    }

    const updated = await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        memberId:
          input.memberId !== undefined
            ? (input.memberId ?? null)
            : attachment.memberId,
        studyId:
          input.studyId !== undefined
            ? (input.studyId ?? null)
            : attachment.studyId,
        fileName:
          input.fileName !== undefined
            ? input.fileName.trim()
            : attachment.fileName,
        contentType:
          input.contentType !== undefined
            ? input.contentType?.trim() || null
            : attachment.contentType,
        category: input.category ?? attachment.category,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : attachment.description,
        tags:
          input.tags !== undefined
            ? input.tags.map((tag) => tag.trim()).filter(Boolean)
            : attachment.tags,
        metadata:
          input.metadata !== undefined
            ? this.jsonInput(input.metadata)
            : this.currentJson(attachment.metadata),
        content: contentBuffer ?? undefined,
        size:
          contentBuffer !== undefined ? contentBuffer.length : attachment.size,
      },
    });

    return this.mapAttachmentDetail(updated);
  }

  async remove(attachmentId: string): Promise<void> {
    const exists = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }

  private mapAttachment(attachment: Attachment): AttachmentDto {
    return {
      id: attachment.id,
      familyId: attachment.familyId,
      memberId: attachment.memberId,
      studyId: attachment.studyId,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      category: attachment.category,
      description: attachment.description,
      tags: attachment.tags ?? [],
      metadata: this.jsonFromDb(attachment.metadata),
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }

  private mapAttachmentDetail(attachment: Attachment): AttachmentDetailDto {
    const base = this.mapAttachment(attachment);
    return {
      ...base,
      base64Data: attachment.content
        ? Buffer.from(attachment.content).toString('base64')
        : undefined,
    };
  }

  private buildWhere(
    query: ListAttachmentsQueryDto,
  ): Prisma.AttachmentWhereInput {
    const where: Prisma.AttachmentWhereInput = {};

    if (query.familyId) {
      where.familyId = query.familyId;
    }

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.studyId) {
      where.studyId = query.studyId;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = {
        hasEvery: query.tags.map((tag) => tag.trim()).filter(Boolean),
      };
    }

    return where;
  }

  private decodeBase64(base64: string): Buffer {
    try {
      return Buffer.from(base64, 'base64');
    } catch (error) {
      throw new BadRequestException('Contenido base64 inválido');
    }
  }

  private jsonFromDb(
    value: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private composeMetadata(
    metadata: Record<string, unknown> | null | undefined,
    actor?: ActiveUserData,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    let normalized: Record<string, unknown> | null = null;
    if (metadata && typeof metadata === 'object') {
      normalized = { ...metadata };
    }

    if (actor?.scope === 'upload-ticket') {
      normalized = {
        ...(normalized ?? {}),
        uploadTicketId: actor.uploadTicketId,
      };
    }

    return this.jsonInput(normalized);
  }

  private jsonInput(
    value?: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private currentJson(
    value: Prisma.JsonValue | null | undefined,
  ): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private async assertFamilyExists(familyId: string): Promise<void> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true },
    });
    if (!family) {
      throw new NotFoundException('Familia no encontrada');
    }
  }
}

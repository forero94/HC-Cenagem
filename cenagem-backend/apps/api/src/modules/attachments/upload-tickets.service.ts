import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const SECRET_BYTES = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

@Injectable()
export class UploadTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createForFamily(input: {
    familyId: string;
    memberId?: string | null;
    createdById: string;
    expiresInMinutes?: number | null;
  }) {
    const family = await this.prisma.family.findUnique({
      where: { id: input.familyId },
      select: { id: true, code: true, displayName: true },
    });

    if (!family) {
      throw new NotFoundException('Familia no encontrada');
    }

    let member: {
      id: string;
      familyId: string;
      filiatorios: Prisma.JsonValue | null;
      role: string | null;
      givenName: string | null;
      lastName: string | null;
    } | null = null;

    if (input.memberId) {
      member = await this.prisma.familyMember.findUnique({
        where: { id: input.memberId },
        select: {
          id: true,
          familyId: true,
          filiatorios: true,
          role: true,
          givenName: true,
          lastName: true,
        },
      });

      if (!member || member.familyId !== family.id) {
        throw new NotFoundException(
          'El integrante indicado no pertenece a la familia.',
        );
      }
    }

    const ttlMinutes = this.resolveTtlMinutes(input.expiresInMinutes);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const secret = randomBytes(SECRET_BYTES).toString('hex');
    const secretHash = await argon2.hash(secret);

    const created = await this.prisma.uploadTicket.create({
      data: {
        familyId: family.id,
        memberId: member?.id ?? null,
        createdById: input.createdById,
        secretHash,
        expiresAt,
        metadata: member ? this.buildTicketMetadata(member) : Prisma.JsonNull,
      },
      include: {
        family: { select: { id: true, code: true, displayName: true } },
        member: {
          select: {
            id: true,
            familyId: true,
            filiatorios: true,
            role: true,
            givenName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      ticket: `${created.id}.${secret}`,
      expiresAt: created.expiresAt,
      familyId: created.familyId,
      memberId: created.memberId,
      familyCode: created.family.code,
      familyDisplayName: created.family.displayName,
      memberLabel: this.buildMemberLabel(created.member),
    };
  }

  async consume(ticketValue: string) {
    const { id, secret } = this.parseTicketValue(ticketValue);

    const ticket = await this.prisma.uploadTicket.findUnique({
      where: { id },
      include: {
        family: { select: { id: true, code: true, displayName: true } },
        member: {
          select: {
            id: true,
            filiatorios: true,
            role: true,
            givenName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket || ticket.revokedAt) {
      throw new UnauthorizedException('El ticket no es válido.');
    }

    if (ticket.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('El ticket expiró.');
    }

    const matches = await argon2.verify(ticket.secretHash, secret);
    if (!matches) {
      throw new UnauthorizedException('El ticket no es válido.');
    }

    const familyMembers = await this.prisma.familyMember.findMany({
      where: { familyId: ticket.familyId },
      select: {
        id: true,
        role: true,
        givenName: true,
        middleName: true,
        lastName: true,
        filiatorios: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    const members = familyMembers.map((member) => {
      const metadataLabel = this.getMemberMetadataLabel(member.metadata);
      const fallbackFullName = [
        member.givenName,
        member.middleName,
        member.lastName,
      ]
        .filter((part) => typeof part === 'string' && part.trim())
        .join(' ');
      const label =
        metadataLabel ||
        this.buildMemberLabel(member) ||
        fallbackFullName ||
        member.id;

      return {
        id: member.id,
        label,
        role: member.role,
        initials: this.getMemberInitials(member.filiatorios),
      };
    });

    await this.prisma.uploadTicket.update({
      where: { id: ticket.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return {
      ticket,
      familyCode: ticket.family.code,
      familyDisplayName: ticket.family.displayName,
      memberLabel: this.buildMemberLabel(ticket.member),
      members,
    };
  }

  private parseTicketValue(ticket: string) {
    if (!ticket || typeof ticket !== 'string') {
      throw new BadRequestException('Ticket inválido.');
    }
    const [id, secret] = ticket.split('.');
    if (!id || !secret) {
      throw new BadRequestException('Ticket inválido.');
    }
    return { id, secret };
  }

  private resolveTtlMinutes(requested?: number | null) {
    const fallback = Number(
      this.config.get<number>('attachments.uploadTicket.ttlMinutes') ?? 10,
    );
    if (!requested || Number.isNaN(requested)) {
      return clamp(fallback, 1, 180);
    }
    return clamp(requested, 1, 180);
  }

  private getMemberInitials(
    filiatorios: Prisma.JsonValue | null,
  ): string | null {
    if (!filiatorios || typeof filiatorios !== 'object') {
      return null;
    }
    const record = filiatorios as Record<string, unknown>;
    return typeof record.iniciales === 'string' ? record.iniciales : null;
  }

  private buildTicketMetadata(member: {
    role: string | null;
    filiatorios: Prisma.JsonValue | null;
  }): Prisma.JsonObject {
    const metadata: Prisma.JsonObject = {};
    if (member.role) {
      metadata.memberRole = member.role;
    }
    const initials = this.getMemberInitials(member.filiatorios);
    if (initials) {
      metadata.memberInitials = initials;
    }
    return metadata;
  }

  private getMemberMetadataLabel(
    metadata: Prisma.JsonValue | null,
  ): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }

    const record = metadata as Record<string, unknown>;
    const label = record.nombreCompleto ?? record.displayName ?? null;

    if (typeof label === 'string' && label.trim()) {
      return label.trim();
    }

    return null;
  }

  private buildMemberLabel(
    member?: {
      role: string | null;
      filiatorios: Prisma.JsonValue | null;
      givenName: string | null;
      lastName: string | null;
    } | null,
  ) {
    if (!member) {
      return null;
    }

    const initials = this.getMemberInitials(member.filiatorios);

    if (initials) {
      return initials;
    }

    if (member.role) {
      return member.role;
    }

    const fullName = [member.givenName, member.lastName]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' ');

    return fullName || null;
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamiliesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_1 = require("../../../../../dist/libs/infrastructure/database");
const library_1 = require("@prisma/client/runtime/library");
let FamiliesService = class FamiliesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listFamilies(query) {
        const take = query.limit ?? 25;
        const where = {};
        const includeMembers = Boolean(query.withMembers);
        if (query.status) {
            where.status = query.status;
        }
        if (query.province) {
            where.province = { equals: query.province, mode: 'insensitive' };
        }
        if (query.search) {
            const searchTerm = query.search.trim();
            const memberConditions = [
                { givenName: { contains: searchTerm, mode: 'insensitive' } },
                { middleName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { initials: { contains: searchTerm, mode: 'insensitive' } },
                { relationship: { contains: searchTerm, mode: 'insensitive' } },
            ];
            const digitCandidates = Array.from(new Set([searchTerm, searchTerm.replace(/\D+/g, '')]
                .map((candidate) => candidate.trim())
                .filter(Boolean)));
            if (digitCandidates.length > 0) {
                digitCandidates.forEach((candidate) => {
                    memberConditions.push({
                        metadata: {
                            path: ['dni'],
                            string_contains: candidate,
                        },
                    }, {
                        metadata: {
                            path: ['documentNumber'],
                            string_contains: candidate,
                        },
                    }, {
                        filiatorios: {
                            path: ['dni'],
                            string_contains: candidate,
                        },
                    }, {
                        filiatorios: {
                            path: ['documento'],
                            string_contains: candidate,
                        },
                    });
                });
            }
            where.OR = [
                { code: { contains: searchTerm, mode: 'insensitive' } },
                { displayName: { contains: searchTerm, mode: 'insensitive' } },
                { members: { some: { OR: memberConditions } } },
            ];
        }
        const families = (await this.prisma.family.findMany({
            where,
            take: take + 1,
            skip: query.cursor ? 1 : 0,
            cursor: query.cursor ? { id: query.cursor } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        members: true,
                        appointments: true,
                        studies: true,
                        attachments: true,
                        evolutions: true,
                    },
                },
                ...(includeMembers
                    ? {
                        members: {
                            orderBy: { createdAt: 'asc' },
                        },
                    }
                    : {}),
            },
        }));
        let nextCursor;
        if (families.length > take) {
            const next = families.pop();
            nextCursor = next?.id;
        }
        const data = families.map((family) => this.mapFamily(family, family._count));
        return { data, meta: { nextCursor } };
    }
    async createFamily(input) {
        const tags = input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
        const metadata = this.composeMetadata(input);
        try {
            const created = await this.prisma.family.create({
                data: {
                    code: input.code.trim().toUpperCase(),
                    displayName: input.displayName?.trim() || null,
                    status: input.status ?? client_1.FamilyStatus.ACTIVE,
                    province: input.province?.trim() || null,
                    city: input.city?.trim() || null,
                    address: input.address?.trim() || null,
                    tags,
                    motiveGroup: input.motive?.groupId?.trim() || null,
                    motiveDetail: input.motive?.detailId?.trim() || null,
                    motiveNotes: input.motive?.motiveNotes?.trim() || null,
                    motiveNarrative: input.motiveNarrative?.trim() || null,
                    motivePatient: input.motivePatient?.trim() || null,
                    motiveDerivation: input.motiveDerivation?.trim() || null,
                    contactInfo: this.jsonInput(input.contactInfo),
                    consanguinity: this.jsonInput(input.consanguinity),
                    obstetricHistory: this.jsonInput(input.obstetricHistory),
                    grandparents: this.jsonInput(input.grandparents),
                    intake: this.jsonInput(input.intake),
                    metadata,
                },
            });
            return this.getFamilyOrThrow(created.id);
        }
        catch (error) {
            this.handlePrismaError(error, input.code);
        }
    }
    async getFamilyOrThrow(familyId) {
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
            include: {
                members: {
                    orderBy: [{ role: 'asc' }, { initials: 'asc' }, { createdAt: 'asc' }],
                },
                appointments: {
                    orderBy: { scheduledFor: 'desc' },
                },
                studies: {
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                },
                evolutions: {
                    orderBy: { recordedAt: 'desc' },
                },
                _count: {
                    select: {
                        members: true,
                        appointments: true,
                        studies: true,
                        attachments: true,
                        evolutions: true,
                    },
                },
            },
        });
        if (!family) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
        return this.mapFamilyDetail(family, family._count);
    }
    async updateFamily(familyId, input) {
        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
        });
        if (!family) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
        const tags = input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? family.tags;
        const metadata = this.composeMetadata(input, this.jsonFromDb(family.metadata));
        try {
            await this.prisma.family.update({
                where: { id: familyId },
                data: {
                    code: input.code
                        ? input.code.trim().toUpperCase()
                        : family.code.toUpperCase(),
                    displayName: input.displayName !== undefined
                        ? input.displayName?.trim() || null
                        : family.displayName,
                    status: input.status ?? family.status,
                    province: input.province !== undefined
                        ? input.province?.trim() || null
                        : family.province,
                    city: input.city !== undefined ? input.city?.trim() || null : family.city,
                    address: input.address !== undefined
                        ? input.address?.trim() || null
                        : family.address,
                    tags,
                    motiveGroup: input.motive?.groupId !== undefined
                        ? input.motive?.groupId?.trim() || null
                        : family.motiveGroup,
                    motiveDetail: input.motive?.detailId !== undefined
                        ? input.motive?.detailId?.trim() || null
                        : family.motiveDetail,
                    motiveNotes: input.motive?.motiveNotes !== undefined
                        ? input.motive?.motiveNotes?.trim() || null
                        : family.motiveNotes,
                    motiveNarrative: input.motiveNarrative !== undefined
                        ? input.motiveNarrative?.trim() || null
                        : family.motiveNarrative,
                    motivePatient: input.motivePatient !== undefined
                        ? input.motivePatient?.trim() || null
                        : family.motivePatient,
                    motiveDerivation: input.motiveDerivation !== undefined
                        ? input.motiveDerivation?.trim() || null
                        : family.motiveDerivation,
                    contactInfo: input.contactInfo !== undefined
                        ? this.jsonInput(input.contactInfo)
                        : this.currentJson(family.contactInfo),
                    consanguinity: input.consanguinity !== undefined
                        ? this.jsonInput(input.consanguinity)
                        : this.currentJson(family.consanguinity),
                    obstetricHistory: input.obstetricHistory !== undefined
                        ? this.jsonInput(input.obstetricHistory)
                        : this.currentJson(family.obstetricHistory),
                    grandparents: input.grandparents !== undefined
                        ? this.jsonInput(input.grandparents)
                        : this.currentJson(family.grandparents),
                    intake: input.intake !== undefined
                        ? this.jsonInput(input.intake)
                        : this.currentJson(family.intake),
                    metadata,
                },
            });
        }
        catch (error) {
            this.handlePrismaError(error, input.code);
        }
        return this.getFamilyOrThrow(familyId);
    }
    async listMembers(familyId) {
        await this.assertFamilyExists(familyId);
        const members = await this.prisma.familyMember.findMany({
            where: { familyId },
            orderBy: [{ role: 'asc' }, { initials: 'asc' }, { createdAt: 'asc' }],
        });
        return members.map((member) => this.mapMember(member));
    }
    async getMemberOrThrow(familyId, memberId) {
        const member = await this.prisma.familyMember.findUnique({
            where: { id: memberId },
        });
        if (!member || member.familyId !== familyId) {
            throw new common_1.NotFoundException('Miembro no encontrado en la familia');
        }
        return this.mapMember(member);
    }
    async createMember(familyId, input) {
        await this.assertFamilyExists(familyId);
        const created = await this.prisma.familyMember.create({
            data: {
                familyId,
                role: input.role.trim(),
                initials: input.initials?.trim() || null,
                relationship: input.relationship ?? null,
                givenName: input.givenName?.trim() || null,
                middleName: input.middleName?.trim() || null,
                lastName: input.lastName?.trim() || null,
                birthDate: input.birthDate ? new Date(input.birthDate) : null,
                sex: input.sex ?? null,
                occupation: input.occupation?.trim() || null,
                schoolingLevel: input.schoolingLevel?.trim() || null,
                diagnosis: input.diagnosis?.trim() || null,
                summary: input.summary?.trim() || null,
                contacto: this.jsonInput(input.contacto),
                filiatorios: this.jsonInput(input.filiatorios),
                antecedentes: this.jsonInput(input.antecedentes),
                notes: this.jsonInput(input.notes),
                metadata: this.jsonInput(input.metadata),
            },
        });
        return this.mapMember(created);
    }
    async updateMember(familyId, memberId, input) {
        const member = await this.prisma.familyMember.findUnique({
            where: { id: memberId },
        });
        if (!member || member.familyId !== familyId) {
            throw new common_1.NotFoundException('Miembro no encontrado en la familia');
        }
        const updated = await this.prisma.familyMember.update({
            where: { id: memberId },
            data: {
                role: input.role !== undefined ? input.role?.trim() || null : member.role,
                initials: input.initials !== undefined
                    ? input.initials?.trim() || null
                    : member.initials,
                relationship: input.relationship !== undefined
                    ? (input.relationship ?? null)
                    : member.relationship,
                givenName: input.givenName !== undefined
                    ? input.givenName?.trim() || null
                    : member.givenName,
                middleName: input.middleName !== undefined
                    ? input.middleName?.trim() || null
                    : member.middleName,
                lastName: input.lastName !== undefined
                    ? input.lastName?.trim() || null
                    : member.lastName,
                birthDate: input.birthDate !== undefined
                    ? input.birthDate
                        ? new Date(input.birthDate)
                        : null
                    : member.birthDate,
                sex: input.sex ?? member.sex,
                occupation: input.occupation !== undefined
                    ? input.occupation?.trim() || null
                    : member.occupation,
                schoolingLevel: input.schoolingLevel !== undefined
                    ? input.schoolingLevel?.trim() || null
                    : member.schoolingLevel,
                diagnosis: input.diagnosis !== undefined
                    ? input.diagnosis?.trim() || null
                    : member.diagnosis,
                summary: input.summary !== undefined
                    ? input.summary?.trim() || null
                    : member.summary,
                contacto: input.contacto !== undefined
                    ? this.jsonInput(input.contacto)
                    : this.currentJson(member.contacto),
                filiatorios: input.filiatorios !== undefined
                    ? this.jsonInput(input.filiatorios)
                    : this.currentJson(member.filiatorios),
                antecedentes: input.antecedentes !== undefined
                    ? this.jsonInput(input.antecedentes)
                    : this.currentJson(member.antecedentes),
                notes: input.notes !== undefined
                    ? this.jsonInput(input.notes)
                    : this.currentJson(member.notes),
                metadata: input.metadata !== undefined
                    ? this.jsonInput(input.metadata)
                    : this.currentJson(member.metadata),
            },
        });
        return this.mapMember(updated);
    }
    async deleteMember(familyId, memberId) {
        const member = await this.prisma.familyMember.findUnique({
            where: { id: memberId },
            select: { id: true, familyId: true },
        });
        if (!member || member.familyId !== familyId) {
            throw new common_1.NotFoundException('Miembro no encontrado en la familia');
        }
        await this.prisma.familyMember.delete({
            where: { id: memberId },
        });
    }
    async listEvolutions(familyId, query) {
        await this.assertFamilyExists(familyId);
        const take = query.limit ?? 50;
        const where = {
            familyId,
        };
        if (query.memberId) {
            where.memberId = query.memberId;
        }
        const evolutions = await this.prisma.memberEvolution.findMany({
            where,
            take: take + 1,
            skip: query.cursor ? 1 : 0,
            cursor: query.cursor ? { id: query.cursor } : undefined,
            orderBy: { recordedAt: 'desc' },
        });
        let nextCursor;
        if (evolutions.length > take) {
            const next = evolutions.pop();
            nextCursor = next?.id;
        }
        return {
            data: evolutions.map((evolution) => this.mapEvolution(evolution)),
            meta: { nextCursor },
        };
    }
    async createEvolution(familyId, memberId, input) {
        const member = await this.prisma.familyMember.findUnique({
            where: { id: memberId },
        });
        if (!member || member.familyId !== familyId) {
            throw new common_1.NotFoundException('Miembro no encontrado en la familia');
        }
        const recordedAt = input.recordedAt
            ? new Date(input.recordedAt)
            : new Date();
        const created = await this.prisma.memberEvolution.create({
            data: {
                familyId,
                memberId,
                authorName: input.authorName?.trim() || null,
                authorEmail: input.authorEmail?.trim().toLowerCase() || null,
                note: input.note.trim(),
                recordedAt,
            },
        });
        return this.mapEvolution(created);
    }
    mapFamily(family, counts) {
        const metadata = this.jsonFromDb(family.metadata);
        const intake = this.jsonFromDb(family.intake);
        const familyMembers = Array.isArray(family.members)
            ? family.members
            : undefined;
        const membersPreview = familyMembers && familyMembers.length > 0
            ? familyMembers
                .map((member) => this.mapMemberPreview(member, intake))
                .filter((member) => Boolean(member))
            : undefined;
        const motive = family.motiveGroup ||
            family.motiveDetail ||
            family.motiveNotes ||
            metadata?.motiveGroupLabel ||
            metadata?.motiveDetailLabel
            ? {
                groupId: family.motiveGroup,
                groupLabel: typeof metadata?.motiveGroupLabel === 'string'
                    ? metadata.motiveGroupLabel
                    : null,
                detailId: family.motiveDetail,
                detailLabel: typeof metadata?.motiveDetailLabel === 'string'
                    ? metadata.motiveDetailLabel
                    : null,
                notes: family.motiveNotes,
            }
            : undefined;
        return {
            id: family.id,
            code: family.code,
            status: family.status,
            displayName: family.displayName,
            province: family.province,
            city: family.city,
            address: family.address,
            tags: family.tags ?? [],
            motive,
            motiveNarrative: family.motiveNarrative,
            motivePatient: family.motivePatient,
            motiveDerivation: family.motiveDerivation,
            contactInfo: this.jsonFromDb(family.contactInfo),
            consanguinity: this.jsonFromDb(family.consanguinity),
            obstetricHistory: this.jsonFromDb(family.obstetricHistory),
            grandparents: this.jsonFromDb(family.grandparents),
            intake,
            metadata,
            createdAt: family.createdAt,
            updatedAt: family.updatedAt,
            counts: counts
                ? {
                    members: counts.members,
                    appointments: counts.appointments,
                    studies: counts.studies,
                    attachments: counts.attachments,
                    evolutions: counts.evolutions,
                }
                : undefined,
            membersPreview,
        };
    }
    mapFamilyDetail(family, counts) {
        const base = this.mapFamily(family, counts);
        return {
            ...base,
            members: family.members.map((member) => this.mapMember(member)),
            evolutions: family.evolutions.map((item) => this.mapEvolution(item)),
            appointments: family.appointments.map((appointment) => ({
                id: appointment.id,
                familyId: appointment.familyId ?? null,
                memberId: appointment.memberId,
                scheduledFor: appointment.scheduledFor,
                durationMins: appointment.durationMins,
                seatNumber: appointment.seatNumber,
                motive: appointment.motive,
                notes: appointment.notes,
                status: appointment.status,
                metadata: this.jsonFromDb(appointment.metadata),
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            })),
            studies: family.studies.map((study) => ({
                id: study.id,
                familyId: study.familyId,
                memberId: study.memberId,
                type: study.type,
                status: study.status,
                name: study.name,
                description: study.description,
                requestedAt: study.requestedAt ?? undefined,
                resultAt: study.resultAt ?? undefined,
                notes: study.notes,
                metadata: this.jsonFromDb(study.metadata),
                createdAt: study.createdAt,
                updatedAt: study.updatedAt,
            })),
            attachments: family.attachments.map((attachment) => ({
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
            })),
        };
    }
    mapMemberPreview(member, intake) {
        const filiatorios = this.jsonFromDb(member.filiatorios);
        const contacto = this.jsonFromDb(member.contacto);
        const metadata = this.jsonFromDb(member.metadata);
        const nameParts = [member.givenName, member.middleName, member.lastName]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);
        const filiatoriosNombreCompleto = typeof filiatorios?.['nombreCompleto'] === 'string'
            ? filiatorios['nombreCompleto'].trim()
            : '';
        const displayName = (nameParts.join(' ') ||
            filiatoriosNombreCompleto ||
            '').trim();
        const initialsFromFiliatorios = typeof filiatorios?.['iniciales'] === 'string'
            ? filiatorios['iniciales'].trim()
            : '';
        const initials = typeof member.initials === 'string' && member.initials.trim()
            ? member.initials.trim()
            : initialsFromFiliatorios || null;
        const documentNumber = this.extractDocumentNumber([metadata, filiatorios, contacto]) ??
            this.extractDocumentFromIntake(member, intake);
        return {
            id: member.id,
            role: member.role ?? member.relationship ?? null,
            initials,
            displayName: displayName || null,
            documentNumber: documentNumber ?? null,
        };
    }
    extractDocumentNumber(sources) {
        const keys = [
            'dni',
            'documento',
            'documentNumber',
            'docNumber',
            'numeroDocumento',
            'numero',
            'nroDocumento',
            'nro',
            'documentoNumero',
            'documentoIdentidad',
        ];
        for (const source of sources) {
            if (!source)
                continue;
            for (const key of keys) {
                const candidate = this.normalizeDocumentValue(source[key]);
                if (candidate) {
                    return candidate;
                }
            }
        }
        return null;
    }
    extractDocumentFromIntake(member, intake) {
        if (!intake)
            return null;
        const administrativoRaw = intake['administrativo'];
        if (!administrativoRaw ||
            typeof administrativoRaw !== 'object' ||
            Array.isArray(administrativoRaw)) {
            return null;
        }
        const administrativo = administrativoRaw;
        const documentNumber = this.extractDocumentNumber([administrativo]);
        if (!documentNumber) {
            return null;
        }
        const role = typeof member.role === 'string' ? member.role.toLowerCase() : '';
        const initials = typeof member.initials === 'string'
            ? member.initials.trim().toUpperCase()
            : '';
        if (role === 'proband' || initials === 'A1') {
            return documentNumber;
        }
        return null;
    }
    normalizeDocumentValue(value) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed || null;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
        return null;
    }
    mapMember(member) {
        return {
            id: member.id,
            familyId: member.familyId,
            role: member.role,
            initials: member.initials,
            relationship: member.relationship,
            givenName: member.givenName,
            middleName: member.middleName,
            lastName: member.lastName,
            birthDate: member.birthDate ?? undefined,
            sex: member.sex ?? undefined,
            occupation: member.occupation,
            schoolingLevel: member.schoolingLevel,
            diagnosis: member.diagnosis,
            summary: member.summary,
            contacto: this.jsonFromDb(member.contacto),
            filiatorios: this.jsonFromDb(member.filiatorios),
            antecedentes: this.jsonFromDb(member.antecedentes),
            notes: this.jsonFromDb(member.notes),
            metadata: this.jsonFromDb(member.metadata),
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
        };
    }
    mapEvolution(evolution) {
        return {
            id: evolution.id,
            familyId: evolution.familyId,
            memberId: evolution.memberId,
            authorName: evolution.authorName,
            authorEmail: evolution.authorEmail,
            note: evolution.note,
            recordedAt: evolution.recordedAt,
            metadata: this.jsonFromDb(evolution.metadata),
        };
    }
    composeMetadata(input, existing) {
        const metadata = { ...(existing ?? {}) };
        if (input.metadata) {
            Object.assign(metadata, input.metadata);
        }
        if (input.motive?.groupLabel !== undefined) {
            metadata.motiveGroupLabel = input.motive.groupLabel ?? null;
        }
        if (input.motive?.detailLabel !== undefined) {
            metadata.motiveDetailLabel = input.motive.detailLabel ?? null;
        }
        return Object.keys(metadata).length > 0
            ? metadata
            : client_1.Prisma.JsonNull;
    }
    jsonFromDb(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        return value;
    }
    jsonInput(value) {
        if (value === undefined || value === null) {
            return client_1.Prisma.JsonNull;
        }
        return value;
    }
    currentJson(value) {
        if (value === null || value === undefined) {
            return client_1.Prisma.JsonNull;
        }
        return value;
    }
    async assertFamilyExists(familyId) {
        const exists = await this.prisma.family.findUnique({
            where: { id: familyId },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('Familia no encontrada');
        }
    }
    handlePrismaError(error, code) {
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' &&
                this.prismaErrorTargets(error).some((target) => String(target).toLowerCase().includes('code'))) {
                const formattedCode = code ? `'${code}'` : 'indicado';
                throw new common_1.ConflictException(`Ya existe una historia clínica con el código ${formattedCode}.`);
            }
        }
        throw error;
    }
    prismaErrorTargets(error) {
        const target = error.meta?.target;
        if (!target) {
            return [];
        }
        if (Array.isArray(target)) {
            return target.filter((item) => typeof item === 'string');
        }
        if (typeof target === 'string') {
            return [target];
        }
        if (typeof target === 'number' || typeof target === 'boolean') {
            return [String(target)];
        }
        return [];
    }
};
exports.FamiliesService = FamiliesService;
exports.FamiliesService = FamiliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], FamiliesService);
//# sourceMappingURL=families.service.js.map
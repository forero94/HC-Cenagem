import { PrismaClient, Permission, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

type RoleSpec = {
  name: string;
  description: string;
  permissions: Permission[];
  requiresLicense?: boolean;
};

const roleSpecs: RoleSpec[] = [
  {
    name: 'admin',
    description: 'Acceso completo a la plataforma.',
    permissions: [
      Permission.CASES_VIEW,
      Permission.CASES_MANAGE,
      Permission.USERS_VIEW,
      Permission.USERS_MANAGE,
      Permission.CATALOGUE_MANAGE,
      Permission.AUDIT_VIEW,
    ],
  },
  {
    name: 'admision',
    description: 'Gestión de admisiones y carga de casos.',
    permissions: [Permission.CASES_VIEW, Permission.CASES_MANAGE],
  },
  {
    name: 'citogenetica',
    description: 'Equipo de citogenética. Matrícula profesional obligatoria.',
    permissions: [
      Permission.CASES_VIEW,
      Permission.CASES_MANAGE,
      Permission.CATALOGUE_MANAGE,
    ],
    requiresLicense: true,
  },
  {
    name: 'molecular',
    description: 'Equipo de genética molecular. Matrícula profesional obligatoria.',
    permissions: [
      Permission.CASES_VIEW,
      Permission.CASES_MANAGE,
      Permission.CATALOGUE_MANAGE,
    ],
    requiresLicense: true,
  },
  {
    name: 'medicos',
    description: 'Equipo médico con control pleno de casos y catálogos.',
    permissions: [
      Permission.CASES_VIEW,
      Permission.CASES_MANAGE,
      Permission.CATALOGUE_MANAGE,
    ],
    requiresLicense: true,
  },
] ;

type UserSpec = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  roles: string[];
  licenseNumber?: string;
};

const sharedPassword = '12345678';

const userSpecs: UserSpec[] = [
  {
    email: 'admin@cenagem.gob.ar',
    password: sharedPassword,
    firstName: 'Admin',
    lastName: 'Demo',
    documentNumber: '20000000',
    roles: ['admin'],
    licenseNumber: 'MN-0001',
  },
  {
    email: 'admision@cenagem.gob.ar',
    password: sharedPassword,
    firstName: 'Equipo',
    lastName: 'Admision',
    documentNumber: '21000000',
    roles: ['admision'],
  },
  {
    email: 'citogenetica@cenagem.gob.ar',
    password: sharedPassword,
    firstName: 'Equipo',
    lastName: 'Citogenetica',
    documentNumber: '22000000',
    roles: ['citogenetica'],
    licenseNumber: 'MN-0203',
  },
  {
    email: 'molecular@cenagem.gob.ar',
    password: sharedPassword,
    firstName: 'Equipo',
    lastName: 'Molecular',
    documentNumber: '23000000',
    roles: ['molecular'],
    licenseNumber: 'MN-0304',
  },
  {
    email: 'medico@cenagem.gob.ar',
    password: sharedPassword,
    firstName: 'Equipo',
    lastName: 'Medicos',
    documentNumber: '24000000',
    roles: ['medicos'],
    licenseNumber: 'MN-0102',
  },
];

async function upsertRoles() {
  for (const roleSpec of roleSpecs) {
    await prisma.role.upsert({
      where: { name: roleSpec.name },
      update: {
        description: roleSpec.description,
        permissions: roleSpec.permissions,
        requiresLicense: roleSpec.requiresLicense ?? false,
      },
      create: {
        name: roleSpec.name,
        description: roleSpec.description,
        permissions: roleSpec.permissions,
        requiresLicense: roleSpec.requiresLicense ?? false,
      },
    });
  }
}

async function upsertUsers() {
  for (const userSpec of userSpecs) {
    const passwordHash = await argon2.hash(userSpec.password);
    const email = userSpec.email.toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        passwordHash,
        status: UserStatus.ACTIVE,
        documentNumber: userSpec.documentNumber,
        licenseNumber: userSpec.licenseNumber ?? null,
      },
      create: {
        email,
        passwordHash,
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        status: UserStatus.ACTIVE,
        documentNumber: userSpec.documentNumber,
        licenseNumber: userSpec.licenseNumber ?? null,
      },
    });

    await prisma.userRole.deleteMany({ where: { userId: user.id } });

    if (userSpec.roles.length) {
      const roles = await prisma.role.findMany({
        where: { name: { in: userSpec.roles } },
      });

      if (roles.length !== userSpec.roles.length) {
        const found = new Set(roles.map((role) => role.name));
        const missing = userSpec.roles.filter((role) => !found.has(role));
        throw new Error(
          `No se encontraron los roles requeridos para ${userSpec.email}: ${missing.join(', ')}`,
        );
      }

      await prisma.userRole.createMany({
        data: roles.map((role) => ({
          userId: user.id,
          roleId: role.id,
        })),
      });
    }
  }
}

async function main() {
  await upsertRoles();
  await upsertUsers();
}

main()
  .then(() => {
    console.info('Seed de usuarios y roles completado.');
  })
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

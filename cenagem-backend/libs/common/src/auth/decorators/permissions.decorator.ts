import { SetMetadata } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PERMISSIONS_KEY } from '../auth.constants';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

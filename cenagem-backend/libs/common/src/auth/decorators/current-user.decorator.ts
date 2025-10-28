import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

export const CurrentUser = createParamDecorator(
  (property?: keyof ActiveUserData, context?: ExecutionContext) => {
    const request = context
      ?.switchToHttp()
      .getRequest<{ user?: ActiveUserData }>();

    const user = request?.user;

    if (!property) {
      return user;
    }

    return user?.[property];
  },
);

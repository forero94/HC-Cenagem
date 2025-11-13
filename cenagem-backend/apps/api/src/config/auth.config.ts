import { requireEnv } from './env.utils';

export default () => {
  const accessSecret = requireEnv('JWT_ACCESS_SECRET');
  const refreshSecret = requireEnv('JWT_REFRESH_SECRET');

  return {
    auth: {
      access: {
        secret: accessSecret,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      },
      refresh: {
        secret: refreshSecret,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      },
    },
  };
};

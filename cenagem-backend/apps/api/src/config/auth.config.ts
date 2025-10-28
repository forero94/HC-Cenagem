export default () => ({
  auth: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
  },
});

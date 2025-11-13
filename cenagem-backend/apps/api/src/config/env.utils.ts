export const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Inject JWT secrets via your KeyVault/KMS pipeline before starting the API.`,
    );
  }

  return value;
};

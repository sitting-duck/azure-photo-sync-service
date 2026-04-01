function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getStorageConnectionString(): string {
  return requireEnv("AZURE_STORAGE_CONNECTION_STRING");
}

export function getContainerName(): string {
  return process.env.PHOTO_CONTAINER_NAME || "photos";
}

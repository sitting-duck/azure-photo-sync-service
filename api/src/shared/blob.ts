import { BlobSASPermissions, BlobServiceClient, SASProtocol, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";
import { randomUUID } from "node:crypto";
import { getContainerName, getStorageConnectionString } from "./env.js";

function getBlobServiceClient(): BlobServiceClient {
  const connectionString = getStorageConnectionString();
  return BlobServiceClient.fromConnectionString(connectionString);
}

export async function ensureContainerExists(): Promise<void> {
  const service = getBlobServiceClient();
  const container = service.getContainerClient(getContainerName());
  await container.createIfNotExists();
}

export function makeBlobName(originalFilename: string): string {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}/${randomUUID()}-${safeName}`;
}

export async function createUploadUrl(blobName: string, contentType: string): Promise<string> {
  const connectionString = getStorageConnectionString();
  const containerName = getContainerName();

  const service = BlobServiceClient.fromConnectionString(connectionString);
  const container = service.getContainerClient(containerName);
  const blob = container.getBlockBlobClient(blobName);

  const accountName = service.accountName;

  let accountKey: string | undefined;

  if (connectionString === "UseDevelopmentStorage=true") {
    accountKey =
      "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==";
  } else {
    const match = connectionString.match(/AccountKey=([^;]+)/);
    if (match) {
      accountKey = match[1];
    }
  }

  if (!accountKey) {
    throw new Error("Could not determine AccountKey for AZURE_STORAGE_CONNECTION_STRING");
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);

  const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn: new Date(Date.now() - 60 * 1000),
      expiresOn,
      protocol: SASProtocol.HttpsAndHttp,
      contentType
    },
    credential
  ).toString();

  let baseUrl = blob.url;

  if (connectionString === "UseDevelopmentStorage=true") {
    baseUrl = `http://localhost:10000/devstoreaccount1/${containerName}/${blobName}`;
  }

  return `${baseUrl}?${sas}`;
}

export async function listPhotos(): Promise<Array<{
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  lastModified?: string;
}>> {
  const service = getBlobServiceClient();
  const container = service.getContainerClient(getContainerName());

  const items: Array<{
    name: string;
    url: string;
    contentType?: string;
    size?: number;
    lastModified?: string;
  }> = [];

  for await (const blob of container.listBlobsFlat()) {
    const blobClient = container.getBlobClient(blob.name);
    items.push({
      name: blob.name,
      url: blobClient.url,
      contentType: blob.properties.contentType,
      size: blob.properties.contentLength,
      lastModified: blob.properties.lastModified?.toISOString()
    });
  }

  items.sort((a, b) => {
    const aTime = a.lastModified ? Date.parse(a.lastModified) : 0;
    const bTime = b.lastModified ? Date.parse(b.lastModified) : 0;
    return bTime - aTime;
  });

  return items;
}
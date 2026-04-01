import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { getContainerName, getStorageConnectionString } from "../shared/env.js";

function normalizeBlobName(blobName: string): string {
  return blobName.replace(/^\/+/, "");
}

export async function deletePhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const rawBlobName = request.params.blobName;

    if (!rawBlobName) {
      return {
        status: 400,
        jsonBody: { error: "blobName is required" }
      };
    }

    const blobName = normalizeBlobName(rawBlobName);
    const service = BlobServiceClient.fromConnectionString(getStorageConnectionString());
    const container = service.getContainerClient(getContainerName());
    const blob = container.getBlobClient(blobName);

    const result = await blob.deleteIfExists();

    if (!result.succeeded) {
      return {
        status: 404,
        jsonBody: { error: "Photo not found" }
      };
    }

    return {
      status: 200,
      jsonBody: {
        ok: true,
        deleted: blobName
      }
    };
  } catch (error) {
    context.error("delete-photo failed", error);
    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}

app.http("delete-photo", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "photos/{*blobName}",
  handler: deletePhoto
});
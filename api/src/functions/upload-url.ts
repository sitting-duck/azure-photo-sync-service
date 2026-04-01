import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createUploadUrl, ensureContainerExists, makeBlobName } from "../shared/blob.js";

type UploadUrlRequest = {
  filename?: string;
  contentType?: string;
};

export async function uploadUrl(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as UploadUrlRequest;

    const filename = body.filename?.trim();
    const contentType = body.contentType?.trim();

    if (!filename) {
      return {
        status: 400,
        jsonBody: { error: "filename is required" }
      };
    }

    if (!contentType) {
      return {
        status: 400,
        jsonBody: { error: "contentType is required" }
      };
    }

    await ensureContainerExists();

    const blobName = makeBlobName(filename);
    const uploadUrl = await createUploadUrl(blobName, contentType);

    return {
      status: 200,
      jsonBody: {
        blobName,
        uploadUrl
      }
    };
  } catch (error) {
    context.error("upload-url failed", error);
    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}

app.http("upload-url", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "upload-url",
  handler: uploadUrl
});
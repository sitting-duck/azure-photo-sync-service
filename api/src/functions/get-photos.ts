import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ensureContainerExists, listPhotos } from "../shared/blob.js";

export async function getPhotos(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    await ensureContainerExists();
    const photos = await listPhotos();

    return {
      status: 200,
      jsonBody: {
        photos
      }
    };
  } catch (error) {
    context.error("get-photos failed", error);
    return {
      status: 500,
      jsonBody: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}

app.http("get-photos", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "photos",
  handler: getPhotos
});
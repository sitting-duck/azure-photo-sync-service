import { BlobServiceClient } from "@azure/storage-blob";

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";

async function main() {
  const service = BlobServiceClient.fromConnectionString(connectionString);

  await service.setProperties({
    cors: [
      {
        allowedOrigins: "http://localhost:5173",
        allowedMethods: "GET,PUT,HEAD,OPTIONS",
        allowedHeaders: "*",
        exposedHeaders: "*",
        maxAgeInSeconds: 3600
      }
    ]
  });

  const props = await service.getProperties();
  console.log("Blob CORS rules set:", props.cors ?? []);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
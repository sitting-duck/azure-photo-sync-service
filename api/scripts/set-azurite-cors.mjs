import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = "UseDevelopmentStorage=true";

const client = BlobServiceClient.fromConnectionString(connectionString);

await client.setProperties({
  cors: [
    {
      allowedOrigins: "http://localhost:5173",
      allowedMethods: "DELETE,GET,HEAD,OPTIONS,POST,PUT",
      allowedHeaders: "*",
      exposedHeaders: "*",
      maxAgeInSeconds: 3600,
    },
  ],
});

console.log("Azurite blob CORS rule applied.");
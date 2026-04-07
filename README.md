# azure-photo-sync-service

# Azure Photo Sync Service

A simple Azure-backed photo sync service for sharing a lightweight photo gallery across devices.

This project provides a small HTTP API using **Azure Functions** and **Azure Blob Storage**.  
It is designed to support:
- a simple web frontend
- a simple Android app
- direct image uploads with SAS URLs
- no user accounts or authentication (for now)

---

## Features

- List uploaded photos
- Generate secure upload URLs
- Delete photos
- Health check endpoint
- Azure Blob Storage-backed gallery
- Works with both:
  - local development using **Azurite**
  - deployed Azure cloud storage

---

## Tech Stack

- **Azure Functions v4**
- **TypeScript**
- **Azure Blob Storage**
- **Azurite** for local storage emulation
- **Node.js**
- **Azure CLI**
- **Azure Functions Core Tools**

---

## Project Structure

```text
azure-photo-sync-service/
├── api/
│   ├── src/
│   │   ├── functions/
│   │   │   ├── delete-photo.ts
│   │   │   ├── get-photos.ts
│   │   │   ├── health.ts
│   │   │   └── upload-url.ts
│   │   └── shared/
│   │       ├── blob.ts
│   │       └── env.ts
│   ├── host.json
│   ├── local.settings.json
│   └── package.json
├── frontend/
└── README.md
```

API Endpoints
Health Check
GET /api/health

Example response:

{
  "ok": true,
  "service": "azure-photo-sync-service"
}
List Photos
GET /api/photos

Example response:

{
  "photos": [
    {
      "name": "2026/04/07/example.jpg",
      "url": "https://...blob.core.windows.net/photos/...",
      "contentType": "image/jpeg",
      "size": 123456,
      "lastModified": "2026-04-07T03:00:00.000Z"
    }
  ]
}
Create Upload URL
POST /api/upload-url
Content-Type: application/json

Example request body:

{
  "filename": "myphoto.jpg",
  "contentType": "image/jpeg"
}

Example response:

{
  "blobName": "2026/04/07/uuid-myphoto.jpg",
  "uploadUrl": "https://...sas..."
}
Delete Photo
DELETE /api/photos/{blobName}

Example:

DELETE /api/photos/2026/04/07/example.jpg
What is a SAS URL?

A SAS URL (Shared Access Signature URL) is a temporary, signed upload/download link for Azure Blob Storage.

Instead of uploading files through your backend, the backend generates a short-lived secure URL, and the client uploads the file directly to Azure Storage.

Why this is useful
less load on your backend
faster uploads
simple architecture
secure temporary access
Local Development
Prerequisites

Install:

Node.js
Azure CLI
Azure Functions Core Tools v4
Azurite
1) Install dependencies

From the api folder:

npm install
2) Start Azurite

From the api folder:

azurite --location . --debug azurite-debug.log --skipApiVersionCheck

This runs local Azure Storage on:

Blob: http://127.0.0.1:10000
Queue: http://127.0.0.1:10001
Table: http://127.0.0.1:10002
3) Configure local settings

Create or edit:

api/local.settings.json

Example:

{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
    "PHOTO_CONTAINER_NAME": "photos"
  },
  "Host": {
    "CORS": "*"
  }
}
4) Start the Functions API

From the api folder:

npm run build
func start

You should see routes like:

health:       [GET]    http://localhost:7071/api/health
get-photos:   [GET]    http://localhost:7071/api/photos
upload-url:   [POST]   http://localhost:7071/api/upload-url
delete-photo: [DELETE] http://localhost:7071/api/photos/{*blobName}
5) Test locally
Health
curl http://localhost:7071/api/health
List photos
curl http://localhost:7071/api/photos

Expected empty response initially:

{"photos":[]}
Azurite CORS for local browser uploads

If using a local web frontend, Azurite needs CORS enabled for browser uploads.

You can configure Azurite Blob CORS to allow your frontend origin (for example http://localhost:5173).

Typical allowed values:

Allowed origins: http://localhost:5173
Allowed methods: GET,PUT,POST,DELETE,OPTIONS
Allowed headers: *
Exposed headers: *
Deployment to Azure
1) Log in
az login
2) Publish the Functions app

From the api folder:

func azure functionapp publish ashley-photo-sync-api-on1

Example deployed endpoints:

https://ashley-photo-sync-api-on1.azurewebsites.net/api/health
https://ashley-photo-sync-api-on1.azurewebsites.net/api/photos
https://ashley-photo-sync-api-on1.azurewebsites.net/api/upload-url
3) Required Azure App Settings

Your Function App should have these settings:

AZURE_STORAGE_CONNECTION_STRING
PHOTO_CONTAINER_NAME

Example:

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
PHOTO_CONTAINER_NAME=photos
4) Blob container access

If you want image URLs to display directly in browsers or mobile apps, the Blob container should allow blob read access.

Example Azure CLI command:

az storage container set-permission \
  --name photos \
  --connection-string "YOUR_FULL_CONNECTION_STRING" \
  --public-access blob

This allows:

direct thumbnail loading
browser image display
Android image loading libraries to fetch images
Frontend / Android Clients

This backend is intended to support:

a lightweight web gallery frontend
a simple Android gallery app

Typical flow:

Client calls POST /api/upload-url
Backend returns a SAS upload URL
Client uploads image directly to Azure Blob Storage
Client refreshes GET /api/photos
Security Notes

This project is intentionally simple and currently has:

no login
no user accounts
anonymous API access
public blob read access (if enabled)

That makes it convenient for personal use and prototyping, but not production-hardened.

If you wanted to improve security later, good next steps would be:

add authentication
restrict uploads
use private blobs + signed read URLs
add rate limiting
add per-user galleries
Future Improvements

Possible next steps:

image thumbnails
metadata storage
albums / folders
camera uploads
drag-and-drop web uploads
better delete confirmation
auth / private galleries


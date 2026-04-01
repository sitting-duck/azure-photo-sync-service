import { useEffect, useState } from "react";

type Photo = {
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  lastModified?: string;
};

type UploadUrlResponse = {
  blobName: string;
  uploadUrl: string;
};

const API_BASE_URL = "http://localhost:7071/api";

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function loadPhotos() {
    setIsLoadingPhotos(true);
    setStatus("");

    try {
      const response = await fetch(`${API_BASE_URL}/photos`);
      if (!response.ok) {
        throw new Error(`Failed to load photos: ${response.status}`);
      }

      const data = (await response.json()) as { photos: Photo[] };
      setPhotos(data.photos);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load photos");
    } finally {
      setIsLoadingPhotos(false);
    }
  }

  useEffect(() => {
    void loadPhotos();
  }, []);

  async function handleUpload() {
    if (!selectedFile) {
      setStatus("Please choose a file first.");
      return;
    }

    setIsUploading(true);
    setStatus("");

    try {
      const uploadUrlResponse = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream"
        })
      });

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${errorText}`);
      }

      const { uploadUrl } = (await uploadUrlResponse.json()) as UploadUrlResponse;

      const blobUploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": selectedFile.type || "application/octet-stream"
        },
        body: selectedFile
      });

      if (!blobUploadResponse.ok) {
        const errorText = await blobUploadResponse.text();
        throw new Error(`Blob upload failed: ${blobUploadResponse.status} ${errorText}`);
      }

      setSelectedFile(null);
      setStatus("Upload successful.");
      await loadPhotos();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1>Azure Photo Sync</h1>

      <section style={{ marginBottom: "2rem" }}>
        <input
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
        />
        <button
          onClick={() => void handleUpload()}
          disabled={!selectedFile || isUploading}
          style={{ marginLeft: "1rem" }}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        <button
          onClick={() => void loadPhotos()}
          disabled={isLoadingPhotos}
          style={{ marginLeft: "1rem" }}
        >
          {isLoadingPhotos ? "Refreshing..." : "Refresh"}
        </button>

        {selectedFile && (
          <p style={{ marginTop: "0.75rem" }}>
            Selected: {selectedFile.name} ({selectedFile.size} bytes)
          </p>
        )}

        {status && <p style={{ marginTop: "0.75rem" }}>{status}</p>}
      </section>

      <section>
        <h2>Photos</h2>

        {photos.length === 0 ? (
          <p>No photos uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {photos.map((photo) => (
              <li
                key={photo.name}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1rem"
                }}
              >
                <p><strong>Name:</strong> {photo.name}</p>
                <p><strong>Type:</strong> {photo.contentType ?? "unknown"}</p>
                <p><strong>Size:</strong> {photo.size ?? "unknown"} bytes</p>
                <p><strong>Last modified:</strong> {photo.lastModified ?? "unknown"}</p>
                <p>
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    Open blob URL
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
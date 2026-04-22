import { apiRequest } from "@/lib/api";

type MediaFolder = "pets" | "community" | "qr" | "misc";
type MediaType = "image" | "video";

type UploadSignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
};

type UploadMediaResponse = {
  asset: {
    url: string;
  };
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (!result) {
        reject(new Error("Failed to read file"));
        return;
      }

      resolve(result);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToCloudinary(file: File, folder: MediaFolder) {
  return uploadFileToCloudinary(file, folder, "image");
}

export async function uploadVideoToCloudinary(file: File, folder: MediaFolder) {
  return uploadFileToCloudinary(file, folder, "video");
}

export async function uploadMediaViaBackend(file: File, folder: MediaFolder) {
  const fileData = await fileToDataUrl(file);
  const response = await apiRequest<{ asset: UploadMediaResponse["asset"] }>("/media/upload", {
    method: "POST",
    auth: true,
    body: { folder, fileData },
  });

  const url = response.data?.asset?.url;
  if (!url) {
    throw new Error("Media upload failed");
  }

  return url;
}

export async function uploadFileToCloudinary(
  file: File,
  folder: MediaFolder,
  mediaType: MediaType = "image"
) {
  let signatureRes;
  try {
    signatureRes = await apiRequest<UploadSignatureResponse>("/media/signature", {
      method: "POST",
      auth: true,
      body: { folder },
    });
  } catch (error) {
    // Development-safe fallback when Cloudinary service is not configured.
    return fileToDataUrl(file);
  }

  if (!signatureRes?.data?.cloudName) {
    return fileToDataUrl(file);
  }

  const sig = signatureRes.data;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);
  formData.append("public_id", sig.publicId);

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${mediaType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = (await cloudinaryRes.json()) as { secure_url?: string; error?: { message?: string } };

  if (!cloudinaryRes.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary upload failed");
  }

  return payload.secure_url;
}

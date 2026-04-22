const { z } = require("zod");
const fs = require("fs/promises");
const path = require("path");
const {
  buildUploadSignature,
  uploadImageFile,
  isCloudinaryConfigured,
} = require("../services/cloudinary.service");

const allowedFolderMap = {
  pets: "pet-care/pets",
  community: "pet-care/community",
  qr: "pet-care/qr",
  misc: "pet-care/misc",
};

const signatureSchema = z.object({
  folder: z.enum(["pets", "community", "qr", "misc"]).default("misc"),
});

const uploadSchema = z.object({
  folder: z.enum(["pets", "community", "qr", "misc"]).default("misc"),
  fileData: z.string().min(20),
});

function parseDataUrl(fileData) {
  const match = fileData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function extensionFromMimeType(mimeType) {
  const type = mimeType.split("/")[1] || "png";
  return type === "jpeg" ? "jpg" : type;
}

async function storeLocalImage(fileData, folder, req) {
  const parsed = parseDataUrl(fileData);
  if (!parsed) {
    throw new Error("Invalid image data");
  }

  const uploadDir = path.join(process.cwd(), "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = extensionFromMimeType(parsed.mimeType);
  const fileName = `${folder}-${req.authUser._id}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extension}`;
  const absolutePath = path.join(uploadDir, fileName);

  await fs.writeFile(absolutePath, Buffer.from(parsed.base64Data, "base64"));

  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${fileName}`;
}

async function createUploadSignature(req, res) {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      success: false,
      message: "Media service is not configured",
      code: 503,
    });
  }

  const parsed = signatureSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = allowedFolderMap[parsed.data.folder];
  const publicId = `${parsed.data.folder}-${req.authUser._id}-${timestamp}`;

  const { signature } = buildUploadSignature({
    timestamp,
    folder,
    publicId,
  });

  return res.status(200).json({
    success: true,
    data: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      timestamp,
      signature,
      folder,
      publicId,
    },
  });
}

async function uploadMedia(req, res) {
  const parsed = uploadSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  if (parsed.data.fileData.length > 15_000_000) {
    return res.status(413).json({
      success: false,
      message: "Media payload is too large",
      code: 413,
    });
  }

  let asset;

  if (isCloudinaryConfigured) {
    const uploaded = await uploadImageFile(parsed.data.fileData, {
      folder: allowedFolderMap[parsed.data.folder],
    });

    asset = {
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  } else {
    const localUrl = await storeLocalImage(
      parsed.data.fileData,
      parsed.data.folder,
      req
    );

    asset = {
      publicId: `${parsed.data.folder}-${req.authUser._id}-${Date.now()}`,
      url: localUrl,
      width: null,
      height: null,
      format: "local",
    };
  }

  return res.status(201).json({
    success: true,
    message: "Media uploaded successfully",
    data: {
      asset,
    },
  });
}

module.exports = {
  createUploadSignature,
  uploadMedia,
};

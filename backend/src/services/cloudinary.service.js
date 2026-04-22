const { v2: cloudinary } = require("cloudinary");
const crypto = require("crypto");
const env = require("../config/env");

const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function ensureConfigured() {
  if (!isCloudinaryConfigured) {
    const error = new Error("Cloudinary is not configured");
    error.status = 503;
    throw error;
  }
}

function buildUploadSignature({ timestamp, folder, publicId, eager = [] }) {
  ensureConfigured();

  const payload = {
    timestamp,
    folder,
  };

  if (publicId) {
    payload.public_id = publicId;
  }

  if (eager.length) {
    payload.eager = eager.join("|");
  }

  const signature = cloudinary.utils.api_sign_request(
    payload,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    payload,
  };
}

async function uploadImageFile(filePathOrDataUri, options = {}) {
  ensureConfigured();

  return cloudinary.uploader.upload(filePathOrDataUri, {
    folder: options.folder || "pet-care/misc",
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      ...(options.transformation || []),
    ],
  });
}

function getPublicIdFromCloudinaryUrl(url) {
  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) {
      return "";
    }

    let remainder = parsed.pathname.slice(index + marker.length);
    remainder = remainder.replace(/^v\d+\//, "");
    remainder = remainder.replace(/\.[^/.]+$/, "");

    return remainder;
  } catch {
    return "";
  }
}

function transformImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") {
    return "";
  }

  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  const transformations = {
    quality: "auto",
    fetch_format: "auto",
    crop: options.crop || "fill",
    gravity: options.gravity || "auto",
    width: options.width || 1000,
    height: options.height || 750,
  };

  const publicId = getPublicIdFromCloudinaryUrl(url);
  if (!publicId) {
    return url;
  }

  try {
    return cloudinary.url(publicId, {
      type: "upload",
      secure: true,
      transformation: [transformations],
    });
  } catch {
    return url;
  }
}

function transformVideoUrl(url, options = {}) {
  if (!url || typeof url !== "string") {
    return "";
  }

  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  const publicId = getPublicIdFromCloudinaryUrl(url);
  if (!publicId) {
    return url;
  }

  try {
    return cloudinary.url(publicId, {
      resource_type: "video",
      type: "upload",
      secure: true,
      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
          width: options.width || 1280,
          crop: "limit",
        },
      ],
    });
  } catch {
    return url;
  }
}

module.exports = {
  isCloudinaryConfigured,
  ensureConfigured,
  buildUploadSignature,
  uploadImageFile,
  transformImageUrl,
  transformVideoUrl,
};

const QRCode = require("qrcode");

/**
 * Generate QR code for a pet
 * Returns a data URL (base64 encoded PNG)
 * @param {string} petId - Pet ID
 * @param {object} options - Optional QR code options
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
async function generateQRCode(petId, options = {}) {
  try {
    const qrOptions = {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      ...options,
    };

    // QR code data: includes both pet ID and a public profile URL path
    const qrData = `${process.env.FRONTEND_URL || "http://localhost:3000"}/qr/${petId}`;

    const qrCodeUrl = await QRCode.toDataURL(qrData, qrOptions);
    return qrCodeUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code and return as Buffer (for file download)
 * @param {string} petId - Pet ID
 * @param {object} options - Optional QR code options
 * @returns {Promise<Buffer>} - QR code as PNG buffer
 */
async function generateQRCodeBuffer(petId, options = {}) {
  try {
    const qrOptions = {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      ...options,
    };

    const qrData = `${process.env.FRONTEND_URL || "http://localhost:3000"}/qr/${petId}`;
    const buffer = await QRCode.toBuffer(qrData, qrOptions);
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify QR code by extracting and validating pet ID
 * @param {string} petId - Pet ID to verify
 * @returns {boolean} - True if valid pet ID format
 */
function validateQRPetId(petId) {
  // Simple validation: should be valid MongoDB ObjectId
  return /^[0-9a-fA-F]{24}$/.test(petId);
}

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  validateQRPetId,
};

const {
  generateQRCode,
  generateQRCodeBuffer,
  validateQRPetId,
} = require("../src/utils/qr");

describe("qr utils", () => {
  const validId = "507f1f77bcf86cd799439011";

  test("generates QR code data URL", async () => {
    const result = await generateQRCode(validId);

    expect(typeof result).toBe("string");
    expect(result.startsWith("data:image/png;base64,")).toBe(true);
  });

  test("generates QR code buffer", async () => {
    const buffer = await generateQRCodeBuffer(validId);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(50);
  });

  test("validates pet id for qr flow", () => {
    expect(validateQRPetId(validId)).toBe(true);
    expect(validateQRPetId("not-object-id")).toBe(false);
    expect(validateQRPetId("507f1f77bcf86cd79943901")).toBe(false);
  });
});

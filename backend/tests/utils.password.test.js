const {
  isValidPassword,
  hashPassword,
  comparePassword,
} = require("../src/utils/password");

describe("password utils", () => {
  test("validates strong passwords", () => {
    expect(isValidPassword("Abcdef!1")).toBe(true);
    expect(isValidPassword("weakpass")).toBe(false);
    expect(isValidPassword("NoSpecial1")).toBe(false);
    expect(isValidPassword("Short1!")).toBe(false);
  });

  test("hashes and compares password correctly", async () => {
    const raw = "S3cure!Pass";
    const hash = await hashPassword(raw);

    expect(hash).not.toEqual(raw);
    await expect(comparePassword(raw, hash)).resolves.toBe(true);
    await expect(comparePassword("Wrong!1", hash)).resolves.toBe(false);
  });
});

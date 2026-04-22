const { signAccessToken, verifyAccessToken } = require("../src/utils/jwt");

describe("jwt utils", () => {
  test("signs and verifies access token", () => {
    const fakeUser = {
      _id: "507f1f77bcf86cd799439011",
      role: "adopter",
      tokenVersion: 2,
    };

    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe(fakeUser._id);
    expect(payload.role).toBe(fakeUser.role);
    expect(payload.tokenVersion).toBe(fakeUser.tokenVersion);
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/models/User");

describe("auth integration", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test("registers and logs in a user", async () => {
    const registerPayload = {
      fullName: "Test User",
      email: "test@example.com",
      password: "Strong!123",
      phone: "+15555555555",
    };

    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send(registerPayload);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.email).toBe("test@example.com");
    expect(registerRes.body.data.token).toBeTruthy();

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.fullName).toBe(registerPayload.fullName);
    expect(loginRes.body.data.token).toBeTruthy();
  });

  test("rejects weak password on register", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Weak User",
      email: "weak@example.com",
      password: "password",
      phone: "+15555555556",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Password must be at least 8 characters/i);
  });
});

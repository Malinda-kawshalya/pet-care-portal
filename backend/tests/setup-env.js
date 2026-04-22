process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pet-care-test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test_jwt_secret_minimum_length_1234567890";
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

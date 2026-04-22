const { Router } = require("express");
const swaggerUi = require("swagger-ui-express");
const { openApiSpec } = require("../../docs/openapi.v1");

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});

router.use("/swagger", swaggerUi.serve, swaggerUi.setup(openApiSpec));

module.exports = router;

function deepSanitizeKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => deepSanitizeKeys(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const safeKey = rawKey.replace(/\$/g, "").replace(/\./g, "_");
    output[safeKey] = deepSanitizeKeys(rawValue);
  }

  return output;
}

function requestSanitizer(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitizeKeys(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = deepSanitizeKeys(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = deepSanitizeKeys(req.params);
  }

  next();
}

module.exports = {
  requestSanitizer,
};

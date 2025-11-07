// src/error.js
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Unexpected error occurred";
  res.status(status).json({ error: code, msg: message });
}

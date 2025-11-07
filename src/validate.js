// src/validate.js
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    let errorCode = "INVALID_PARAMETER";
    let msg = "Invalid request body";
    const raw = parsed.error.issues?.[0]?.message;
    try {
      const obj = JSON.parse(raw);
      errorCode = obj.error || errorCode;
      msg = obj.msg || msg;
    } catch { msg = raw || msg; }
    return res.status(400).json({ error: errorCode, msg });
  }
  req.valid = parsed.data;
  next();
};

export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors,
    });
  }

  req.validatedData = parsed.data;
  next();
};

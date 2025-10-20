export const success = (
  res,
  { message = "OK", data = null, status = 200 } = {}
) => res.status(status).json({ message, data, error: null });

export const fail = (
  res,
  { message = "Error", error = null, status = 500 } = {}
) => res.status(status).json({ message, data: null, error });

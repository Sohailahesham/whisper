export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const body = { error: { message: err.message || 'Internal server error' } };
  if (err.details) body.error.details = err.details;
  if (status >= 500) console.error(err);
  res.status(status).json(body);
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
}

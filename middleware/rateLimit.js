import { RateLimitHit } from '../models/RateLimitHit.js';
import { HttpError } from './errorHandler.js';

export function rateLimit({ max, windowMs, keyFn }) {
  return async function rateLimitMiddleware(req, _res, next) {
    // TODO:
    // Hint: compute windowStart = floor(now / windowMs) * windowMs.
    // Use findOneAndUpdate with { upsert: true, new: true } and $inc: { count: 1 } on { key, windowStart }.
    // If returned count > max, throw HttpError(429). Otherwise next().
    // See: docs/API.md "Rate limiting", tester/tests/bonus-rate-limit.test.js
    throw new Error('not implemented');
  };
}

export function clientIp(req) {
  // TODO:
  // Hint: prefer x-forwarded-for (first IP before comma) — required behind proxies/serverless.
  // Fall back to req.socket.remoteAddress, then 'unknown'.
  throw new Error('not implemented');
}

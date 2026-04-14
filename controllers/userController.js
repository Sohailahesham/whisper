import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function getPublicProfile(req, res, next) {
  // TODO:
  // Hint: User.findOne({ username }). 404 if missing. Exclude email + passwordHash from response.
  // See: docs/API.md "GET /api/users/:username", tester/tests/profile.test.js
  throw new Error('not implemented');
}

export async function updateMe(req, res, next) {
  // TODO:
  // Hint: whitelist fields a user may update: displayName, bio, avatarUrl, acceptingQuestions, tags.
  // Silently IGNORE username / email even if sent — they are immutable here.
  // Use findByIdAndUpdate with { new: true, runValidators: true }.
  // See: docs/API.md "PATCH /api/users/me", tester/tests/profile.test.js
  throw new Error('not implemented');
}

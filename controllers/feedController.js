import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

export async function listGlobalFeed(req, res, next) {
  // TODO:
  // Hint: filter status='answered', visibility='public'.
  // Optional ?tag=xxx: first find user ids with that tag (User.find({tags: xxx}).distinct('_id')),
  //   then add recipient: { $in: ids } to the filter. If no users match, return empty page.
  // Populate recipient with: username displayName avatarUrl tags.
  // Sort answeredAt desc. Pagination envelope { data, page, limit, total, totalPages }.
  // See: docs/API.md "GET /api/feed", tester/tests/global-feed.test.js
  throw new Error('not implemented');
}

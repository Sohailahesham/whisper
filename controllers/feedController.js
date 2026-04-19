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
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tag = req.query.tag;

    const skip = (page - 1) * limit;

    // base filter
    const filter = {
      status: 'answered',
      visibility: 'public',
    };

    // optional tag filter
    if (tag) {
      const usersWithTag = await User.find({ tags: tag }).distinct('_id');

      // no users match → empty response
      if (!usersWithTag.length) {
        return res.json({
          data: [],
          page,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      filter.recipient = { $in: usersWithTag };
    }

    // total count for pagination
    const total = await Question.countDocuments(filter);

    // main query
    const data = await Question.find(filter)
      .populate('recipient', 'username displayName avatarUrl tags')
      .sort({ answeredAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
  
}


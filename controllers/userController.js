import { User } from "../models/User.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function getPublicProfile(req, res, next) {
  // TODO:
  // Hint: User.findOne({ username }). 404 if missing. Exclude email + passwordHash from response.
  // See: docs/API.md "GET /api/users/:username", tester/tests/profile.test.js
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
      throw new HttpError(404, "User not found");
    }
    user.passwordHash = undefined;
    user.email = undefined;
    return res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  // TODO:
  // Hint: whitelist fields a user may update: displayName, bio, avatarUrl, acceptingQuestions, tags.
  // Silently IGNORE username / email even if sent — they are immutable here.
  // Use findByIdAndUpdate with { new: true, runValidators: true }.
  // See: docs/API.md "PATCH /api/users/me", tester/tests/profile.test.js
  try {
    const allowedFields = [
      "displayName",
      "bio",
      "avatarUrl",
      "acceptingQuestions",
      "tags",
    ];

    const update = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    })
      .select("-passwordHash")
      .lean();

    return res.json(user);
  } catch (error) {
    next(error);
  }
}

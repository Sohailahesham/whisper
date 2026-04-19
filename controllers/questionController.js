import { Question } from "../models/Question.js";
import { User } from "../models/User.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function sendQuestion(req, res, next) {
  // TODO:
  // Hint: find recipient by :username. 404 if missing, 403 if acceptingQuestions === false.
  // Create Question { recipient: recipient._id, body }. Respond 201 WITHOUT recipient field
  // (anonymous send — do not leak sender OR recipient id in the echo).
  // See: docs/API.md "POST /api/users/:username/questions", tester/tests/send-question.test.js
  try {
    const { username } = req.params;
    const { body } = req.body;

    const recipient = await User.findOne({ username });

    if (!recipient) {
      throw new HttpError(404, "User not found");
    }

    if (recipient.acceptingQuestions === false) {
      throw new HttpError(403, "User is not accepting questions");
    }

    const question = await Question.create({
      recipient: recipient._id,
      body,
    });

    return res.status(201).json({
      _id: question._id,
      body: question.body,
      status: question.status,
      answer: question.answer,
      createdAt: question.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function listInbox(req, res, next) {
  // TODO:
  // Hint: filter { recipient: req.user._id }. Optional ?status=pending|answered|ignored (else 400).
  // Pagination: page (default 1, min 1), limit (default 20, min 1, max 50).
  // Sort createdAt desc. Envelope: { data, page, limit, total, totalPages }.
  // See: docs/API.md "GET /api/questions/inbox", tester/tests/inbox.test.js
  try {
    const { status } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    let limit = parseInt(req.query.limit) || 20;

    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const allowed = ["pending", "answered", "ignored"];

    const filter = {
      recipient: req.user._id,
    };

    if (status) {
      if (!allowed.includes(status)) {
        throw new HttpError(400, "Invalid status");
      }
      filter.status = status;
    }

    const total = await Question.countDocuments(filter);

    const data = await Question.find(filter)
      .sort({ createdAt: -1 })
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

async function getOwnedQuestion(id, userId) {
  // TODO:
  // Hint: load by id -> 404 if missing -> 403 if recipient !== userId.
  // Compare as strings (ObjectId). Returns the question doc.
  const question = await Question.findById(id);

  if (!question) {
    throw new HttpError(404, "Question not found");
  }

  if (question.recipient.toString() !== userId.toString()) {
    throw new HttpError(403, "Forbidden");
  }

  return question;
}

export async function answerQuestion(req, res, next) {
  // TODO:
  // Hint: use getOwnedQuestion for 404/403. Set answer, answeredAt=now, status='answered'.
  // If body has visibility, apply it. Save + return the question.
  // See: docs/API.md "POST /api/questions/:id/answer", tester/tests/answer.test.js
  try {
    const { id } = req.params;
    const { answer, visibility } = req.body;

    const question = await getOwnedQuestion(id, req.user._id);

    if (answer !== undefined) {
      question.answer = answer;
      question.answeredAt = new Date();
      question.status = "answered";
    }

    if (visibility) {
      question.visibility = visibility;
    }

    await question.save();

    return res.json(question);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  // TODO:
  // Hint: ownership check. Accept any of answer / status / visibility. If answer provided,
  // also set answeredAt + status='answered'. Save + return.
  // See: docs/API.md "PATCH /api/questions/:id", tester/tests/answer.test.js
  try {
    const { id } = req.params;

    const question = await getOwnedQuestion(id, req.user._id);

    const { answer, status, visibility } = req.body;

    if (answer !== undefined) {
      question.answer = answer;
      question.answeredAt = new Date();
      question.status = "answered";
    }

    if (status) {
      question.status = status;
    }

    if (visibility) {
      question.visibility = visibility;
    }

    await question.save();

    return res.json(question);
  } catch (error) {
    next(error);
  }
}

export async function removeQuestion(req, res, next) {
  // TODO:
  // Hint: ownership check, deleteOne, 204 no content.
  // See: docs/API.md "DELETE /api/questions/:id", tester/tests/answer.test.js
  try {
    const { id } = req.params;

    const question = await getOwnedQuestion(id, req.user._id);

    await question.deleteOne();

    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function listPublicFeed(req, res, next) {
  // TODO:
  // Hint: find user by :username (404 if missing). Filter questions:
  //   recipient=user._id, status='answered', visibility='public'.
  // Exclude recipient field from response. Sort answeredAt desc. Same pagination envelope as inbox.
  // See: docs/API.md "GET /api/users/:username/questions", tester/tests/public-feed.test.js
  try {
    const { username } = req.params;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const filter = {
      recipient: user._id,
      status: "answered",
      visibility: "public",
    };

    const total = await Question.countDocuments(filter);

    const data = await Question.find(filter)
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

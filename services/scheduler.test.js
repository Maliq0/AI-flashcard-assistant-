const test = require('node:test');
const assert = require('node:assert/strict');
const { scheduleReview } = require('./scheduler');

const reviewedAt = new Date('2026-10-05T12:00:00.000Z');

function makeCard(overrides = {}) {
  return {
    id: 'card-1',
    difficulty: 2,
    reviewCount: 3,
    nextReviewDate: '2026-10-08T12:00:00.000Z',
    lastReviewedAt: '2026-10-05T12:00:00.000Z',
    ...overrides,
  };
}

test('again schedules a short retry and raises difficulty', () => {
  const result = scheduleReview(makeCard(), 'again', reviewedAt);

  assert.equal(result.difficulty, 4);
  assert.equal(result.reviewCount, 4);
  assert.equal(result.nextReviewDate, '2026-10-05T12:10:00.000Z');
  assert.equal(result.lastReviewedAt, reviewedAt.toISOString());
});

test('easy schedules four days for a card without review history', () => {
  const result = scheduleReview(makeCard({ lastReviewedAt: null }), 'easy', reviewedAt);

  assert.equal(result.difficulty, 0);
  assert.equal(result.nextReviewDate, '2026-10-09T12:00:00.000Z');
});

test('difficulty stays within its 0-to-5 range', () => {
  assert.equal(scheduleReview(makeCard({ difficulty: 5 }), 'again', reviewedAt).difficulty, 5);
  assert.equal(scheduleReview(makeCard({ difficulty: 0 }), 'easy', reviewedAt).difficulty, 0);
});

test('unsupported ratings are rejected', () => {
  assert.throws(() => scheduleReview(makeCard(), 'maybe', reviewedAt), RangeError);
});
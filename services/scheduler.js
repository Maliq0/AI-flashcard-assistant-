const RATINGS = ['again', 'hard', 'good', 'easy'];
const MAX_INTERVAL_HOURS = 24 * 365;

function scheduleReview(card, rating, reviewedAt = new Date()) {
	if (!RATINGS.includes(rating)) {
		throw new RangeError(`Rating must be one of: ${RATINGS.join(', ')}.`);
	}

	const reviewTime = new Date(reviewedAt);
	if (Number.isNaN(reviewTime.getTime())) {
		throw new TypeError('reviewedAt must be a valid date.');
	}

	const previousReviewTime = card.lastReviewedAt
		? new Date(card.lastReviewedAt).getTime()
		: NaN;
	const previousDueTime = new Date(card.nextReviewDate).getTime();
	const previousIntervalHours = Number.isNaN(previousReviewTime)
		? 0
		: Math.max(0, (previousDueTime - previousReviewTime) / (60 * 60 * 1000));

	const intervalHours = getIntervalHours(rating, previousIntervalHours);
	const difficultyChange = {
		again: 2,
		hard: 1,
		good: -1,
		easy: -2,
	}[rating];
	const currentDifficulty = Number.isFinite(card.difficulty) ? card.difficulty : 0;

	return {
		...card,
		difficulty: Math.min(5, Math.max(0, currentDifficulty + difficultyChange)),
		reviewCount: (Number.isInteger(card.reviewCount) ? card.reviewCount : 0) + 1,
		lastReviewedAt: reviewTime.toISOString(),
		nextReviewDate: new Date(
			reviewTime.getTime() + intervalHours * 60 * 60 * 1000
		).toISOString(),
	};
}

function getIntervalHours(rating, previousIntervalHours) {
	if (rating === 'again') return 10 / 60;

	const interval = {
		hard: previousIntervalHours ? Math.max(24, previousIntervalHours * 1.2) : 24,
		good: previousIntervalHours ? Math.max(24, previousIntervalHours * 2.5) : 24,
		easy: previousIntervalHours ? Math.max(96, previousIntervalHours * 3.5) : 96,
	}[rating];

	return Math.min(MAX_INTERVAL_HOURS, interval);
}

module.exports = { RATINGS, scheduleReview };

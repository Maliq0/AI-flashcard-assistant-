const express = require('express');
const crypto = require('crypto');
const { generateFlashcardsFromNotes } = require('../services/openaiService');
const { RATINGS, scheduleReview } = require('../services/scheduler');
const { readCards, writeCards } = require('../utils/fileStorage');

const router = express.Router();

router.post('/generate', async (req, res) => {
	const { notes, topic } = req.body || {};

	if (typeof notes !== 'string' || notes.trim().length === 0) {
		return res.status(400).json({ error: 'Notes text is required.' });
	}

	if (topic !== undefined && typeof topic !== 'string') {
		return res.status(400).json({ error: 'Topic must be text.' });
	}

	if (!process.env.OPENAI_API_KEY) {
		return res.status(503).json({ error: 'Flashcard generation is not configured.' });
	}

	let generatedCards;
	try {
		generatedCards = await generateFlashcardsFromNotes(
			notes.trim(),
			topic?.trim() || 'General'
		);
	} catch (error) {
		console.error('Flashcard generation failed:', error.message);
		return res.status(502).json({ error: 'Failed to generate flashcards.' });
	}

	try {
		const existingCards = await readCards();
		const now = new Date().toISOString();
		const newCards = generatedCards.map((card) => ({
			id: crypto.randomUUID(),
			question: card.question,
			answer: card.answer,
			topic: card.topic,
			createdAt: now,
			difficulty: 0,
			reviewCount: 0,
			nextReviewDate: now,
			lastReviewedAt: null,
		}));

		await writeCards([...existingCards, ...newCards]);
		return res.status(201).json(newCards);
	} catch (error) {
		console.error('Could not save generated flashcards:', error.message);
		return res.status(500).json({ error: 'Could not save flashcards.' });
	}
});

router.get('/', async (req, res) => {
	try {
		return res.json(await readCards());
	} catch (error) {
		console.error('Could not read flashcards:', error.message);
		return res.status(500).json({ error: 'Could not load flashcards.' });
	}
});

router.post('/:id/review', async (req, res) => {
	const { rating } = req.body || {};
	if (!RATINGS.includes(rating)) {
		return res.status(400).json({
			error: `Rating must be one of: ${RATINGS.join(', ')}.`,
		});
	}

	try {
		const cards = await readCards();
		const cardIndex = cards.findIndex((card) => card.id === req.params.id);
		if (cardIndex === -1) {
			return res.status(404).json({ error: 'Flashcard not found.' });
		}

		const updatedCard = scheduleReview(cards[cardIndex], rating);
		cards[cardIndex] = updatedCard;
		await writeCards(cards);
		return res.json(updatedCard);
	} catch (error) {
		console.error('Could not save flashcard review:', error.message);
		return res.status(500).json({ error: 'Could not save flashcard review.' });
	}
});

module.exports = router;

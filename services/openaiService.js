const OpenAI = require('openai');

async function generateFlashcardsFromNotes(notesText, topic = 'General') {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured.');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
You are a study assistant. Generate 5 to 8 flashcards that test understanding
of the key concepts in the notes. Each card must have a clear question and a
concise, accurate answer.

Return only valid JSON in this exact format, with no extra commentary:
[
    { "question": "...", "answer": "..." }
]

Notes:
"""
${notesText}
"""`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
    });

    const raw = response.choices[0].message.content;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error('OpenAI did not return valid JSON.');
    }

    if (!Array.isArray(parsed) || parsed.some((card) =>
        !card || typeof card.question !== 'string' || typeof card.answer !== 'string'
    )) {
        throw new Error('OpenAI returned flashcards in an unexpected format.');
    }

    return parsed.map((card) => ({ ...card, topic }));
}

module.exports = { generateFlashcardsFromNotes };

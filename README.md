# AI Flashcard Assistant

An AI-powered study tool that turns raw notes into flashcards and schedules
reviews using a custom-built spaced-repetition algorithm — not a library.

Built as a personal project to practice full-stack development, API design,
and algorithmic thinking, while studying Web Application Development,
Artificial Intelligence, and Data Structures & Algorithms.

## Why I built this

Revising from scratch is slow, and most flashcard tools either require manual
card creation or don't adapt to how well you actually know something. I
wanted a tool that could turn notes I'd already written into testable
questions automatically, and prioritize what I'm weakest on — so I built one.

## Features

- **AI-generated flashcards** — paste in notes, get back 5–8 structured
  question/answer pairs via the OpenAI API
- **Custom spaced-repetition scheduler** — a self-built algorithm (inspired
  by SM-2/Anki) that adjusts each card's difficulty and next review date
  based on how well you recalled it
- **Review flow** — a flip-card interface that shows due cards, reveals the
  answer on demand, and reschedules based on a 4-point rating
- **Single-page frontend** — generate and review flows in one page, built in
  vanilla JavaScript with manual DOM state management (no framework)

## Tech stack

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Backend   | Node.js, Express                     |
| Frontend  | HTML, CSS, vanilla JavaScript        |
| Data      | JSON file storage                    |
| AI        | OpenAI API (`gpt-4o-mini`)           |
| Testing   | Node's built-in test runner          |

## Screenshot

*(Add a screenshot or short GIF here showing the generate and review flow —
this is one of the first things people look at.)*

## Getting started

### Prerequisites
- Node.js (v18+ recommended)
- An OpenAI API key — [platform.openai.com](https://platform.openai.com)

### Installation

```bash
git clone https://github.com/<your-username>/ai-flashcard-assistant.git
cd ai-flashcard-assistant
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

### Running locally

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Running tests

```bash
npm test
```

## API reference

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| POST   | `/api/cards/generate`      | Generate flashcards from notes            |
| GET    | `/api/cards`                | Get all stored flashcards                 |
| POST   | `/api/cards/:id/review`     | Submit a review rating and reschedule a card |

**Example — generate flashcards:**
```bash
curl -X POST http://localhost:3000/api/cards/generate \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Your notes here", "topic": "Your Topic" }'
```

**Example — review a card:**
```bash
curl -X POST http://localhost:3000/api/cards/<card-id>/review \
  -H "Content-Type: application/json" \
  -d '{ "rating": "good" }'
```
`rating` must be one of: `again`, `hard`, `good`, `easy`.

## Design decisions

**Why I wrote the scheduler myself instead of using a library.**
The spaced-repetition logic is the algorithmic core of this project. Each
review adjusts a card's `difficulty` (clamped 0–5) and calculates its next
`nextReviewDate` by growing the previous interval: `again` resets to 10
minutes, `hard` multiplies the interval by 1.2×, `good` by 2.5×, and `easy`
by 3.5×, with a 24-hour minimum (96 hours for `easy`). The previous interval
is reconstructed from the gap between `lastReviewedAt` and `nextReviewDate`
rather than stored separately, keeping the data model smaller. This is
covered by unit tests in `services/scheduler.test.js`.

**Why the prompt enforces strict JSON output.**
`services/openaiService.js` explicitly instructs the model to return *only*
valid JSON in a fixed shape, with no commentary. Treating an LLM as part of
a data pipeline — rather than a chatbot — requires predictable, parseable
output, and the response is wrapped in a `try/catch` in case the model
doesn't comply.

**Why JSON file storage instead of a database.**
This was a deliberate scope decision. A database would add real value at
scale, but for a personal study tool with a single user, a JSON file keeps
the project focused on the parts that matter most (the AI pipeline and the
scheduling algorithm) without unnecessary infrastructure.

**Why the frontend has no framework.**
I wanted to understand DOM manipulation, state handling, and view-switching
manually before relying on a framework to do it for me. View toggling
(`showView()`), rendering, and event handling are all done with plain
JavaScript in `public/script.js`.

## Project structure

```
ai-flashcard-assistant/
├── data/            # JSON flashcard storage
├── public/          # Frontend (HTML/CSS/JS)
├── routes/          # Express route handlers
├── services/        # OpenAI integration + scheduler (+ tests)
├── utils/           # File storage helpers
└── server.js        # App entry point
```

## Possible future improvements

- Topic-based filtering and a stats dashboard (accuracy over time, streaks)
- Swap JSON storage for a lightweight database (e.g. SQLite) if usage grows
- Export/import to Anki's format
- User accounts, if used beyond a single person

## License

MIT
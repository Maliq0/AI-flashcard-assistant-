const state = {
  dueCards: [],
  currentIndex: 0,
};

const elements = {
  navButtons: document.querySelectorAll('.nav-btn'),
  generateView: document.getElementById('generate-view'),
  reviewView: document.getElementById('review-view'),
  generateForm: document.getElementById('generate-form'),
  topicInput: document.getElementById('topic'),
  notesInput: document.getElementById('notes'),
  generateButton: document.getElementById('generate-btn'),
  generateStatus: document.getElementById('generate-status'),
  generatedList: document.getElementById('generated-list'),
  reviewStatus: document.getElementById('review-status'),
  noCardsMessage: document.getElementById('no-cards-message'),
  flashcard: document.getElementById('flashcard'),
  flashcardQuestion: document.getElementById('flashcard-question'),
  flashcardAnswer: document.getElementById('flashcard-answer'),
  revealButton: document.getElementById('reveal-btn'),
  ratingButtons: document.querySelectorAll('[data-rating]'),
};

function setStatus(element, message, type = '') {
  const validTypes = ['error', 'success'];
  element.textContent = message;
  element.classList.remove('hidden', ...validTypes.map((item) => item));

  if (message) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }

  if (validTypes.includes(type)) {
    element.classList.add(type);
  }
}

function showView(viewName) {
  const isGenerate = viewName === 'generate';

  elements.generateView.classList.toggle('hidden', !isGenerate);
  elements.reviewView.classList.toggle('hidden', isGenerate);

  elements.navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle('active', isActive);
  });

  if (!isGenerate) {
    loadDueCards();
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

function renderGeneratedCards(cards) {
  if (!cards.length) {
    elements.generatedList.innerHTML = '<p class="empty-state">No flashcards generated yet.</p>';
    return;
  }

  elements.generatedList.innerHTML = cards
    .map(
      (card) => `
        <article class="generated-card">
          <h3>${card.topic || 'General'}</h3>
          <p><strong>Q:</strong> ${card.question}</p>
          <p><strong>A:</strong> ${card.answer}</p>
        </article>
      `
    )
    .join('');
}

async function handleGenerateSubmit(event) {
  event.preventDefault();

  const notes = elements.notesInput.value.trim();
  const topic = elements.topicInput.value.trim();

  if (!notes) {
    setStatus(elements.generateStatus, 'Please add some notes before generating flashcards.', 'error');
    return;
  }

  elements.generateButton.disabled = true;
  setStatus(elements.generateStatus, 'Generating flashcards...', '');

  try {
    const cards = await fetchJson('/api/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ notes, topic: topic || 'General' }),
    });

    renderGeneratedCards(cards);
    setStatus(elements.generateStatus, `Created ${cards.length} flashcard(s).`, 'success');
    elements.generateForm.reset();
  } catch (error) {
    setStatus(elements.generateStatus, error.message, 'error');
  } finally {
    elements.generateButton.disabled = false;
  }
}

function renderCurrentCard() {
  if (!state.dueCards.length) {
    elements.flashcard.classList.add('hidden');
    elements.noCardsMessage.classList.remove('hidden');
    elements.flashcardAnswer.classList.add('hidden');
    elements.ratingButtons.forEach((button) => button.parentElement.classList.add('hidden'));
    return;
  }

  const card = state.dueCards[state.currentIndex];
  elements.noCardsMessage.classList.add('hidden');
  elements.flashcard.classList.remove('hidden');
  elements.flashcardQuestion.textContent = card.question;
  elements.flashcardAnswer.textContent = card.answer;
  elements.flashcardAnswer.classList.add('hidden');
  elements.ratingButtons.forEach((button) => button.parentElement.classList.add('hidden'));
  elements.revealButton.disabled = false;
  elements.ratingButtons.forEach((button) => (button.disabled = false));
}

async function loadDueCards() {
  try {
    setStatus(elements.reviewStatus, 'Loading due cards...', '');
    const cards = await fetchJson('/api/cards');
    state.dueCards = cards.filter((card) => new Date(card.nextReviewDate) <= new Date());
    state.currentIndex = 0;

    if (!state.dueCards.length) {
      setStatus(elements.reviewStatus, 'No cards are due right now.', 'success');
      elements.flashcard.classList.add('hidden');
      elements.noCardsMessage.classList.remove('hidden');
      return;
    }

    elements.noCardsMessage.classList.add('hidden');
    setStatus(elements.reviewStatus, `${state.dueCards.length} card(s) due for review.`, 'success');
    renderCurrentCard();
  } catch (error) {
    setStatus(elements.reviewStatus, error.message, 'error');
    elements.flashcard.classList.add('hidden');
    elements.noCardsMessage.classList.remove('hidden');
  }
}

async function handleRatingClick(event) {
  const button = event.target.closest('[data-rating]');
  if (!button) return;

  const rating = button.dataset.rating;
  const card = state.dueCards[state.currentIndex];

  if (!card) {
    return;
  }

  elements.ratingButtons.forEach((button) => (button.disabled = true));

  try {
    setStatus(elements.reviewStatus, `Saving ${rating} response...`, '');
    await fetchJson(`/api/cards/${card.id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });

    state.dueCards.splice(state.currentIndex, 1);
    state.currentIndex = Math.min(state.currentIndex, state.dueCards.length - 1);

    if (!state.dueCards.length) {
      setStatus(elements.reviewStatus, 'All due cards reviewed. Great work!', 'success');
      elements.flashcard.classList.add('hidden');
      elements.noCardsMessage.classList.remove('hidden');
      return;
    }

    renderCurrentCard();
    setStatus(elements.reviewStatus, `${state.dueCards.length} card(s) left to review.`, 'success');
  } catch (error) {
    setStatus(elements.reviewStatus, error.message, 'error');
  }
}

elements.navButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

elements.generateForm.addEventListener('submit', handleGenerateSubmit);

elements.revealButton.addEventListener('click', () => {
  const answer = elements.flashcardAnswer;
  answer.classList.toggle('hidden');
  elements.ratingButtons.forEach((button) => button.parentElement.classList.toggle('hidden', answer.classList.contains('hidden')));
});

elements.ratingButtons.forEach((button) => {
  button.addEventListener('click', handleRatingClick);
});

renderGeneratedCards([]);
showView('generate');
loadDueCards();

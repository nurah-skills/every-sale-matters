// Shared by every signed-in page: the menu, the signed-in person and small formatting helpers.

function create(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const formatNumber = (value) =>
  Number(value).toLocaleString('en-ZA', { maximumFractionDigits: 1 }).replace('-', '−');

const formatMoney = (value) =>
  `R${Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercent = (part, whole) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

const initials = (name) => name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

// "+1,2 · 18% more" or "−0,8 · 29% less", the same comparison the current scoreboard shows
function describeChange(now, before) {
  const difference = now - before;
  if (!before) return now > 0 ? `+${formatNumber(difference)}` : 'No August figure';
  const percent = Math.round((Math.abs(difference) / before) * 100);
  if (difference === 0) return 'Same as August';
  return difference > 0
    ? `+${formatNumber(difference)} · ${percent}% more`
    : `${formatNumber(difference)} · ${percent}% less`;
}

// Page choices live in this tab only, so names never end up in the address bar
function remember(key, value) {
  try {
    sessionStorage.setItem(`esm-${key}`, value);
  } catch {
    // The page still works, it just won't remember the choice.
  }
}

function recall(key) {
  try {
    return sessionStorage.getItem(`esm-${key}`);
  } catch {
    return null;
  }
}

// Card statuses are kept in this browser until there's a shared database
const CARD_STATUS_KEY = 'esm-card-status';

function savedCardStatuses() {
  try {
    return JSON.parse(localStorage.getItem(CARD_STATUS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCardStatus(id, status) {
  const statuses = savedCardStatuses();
  statuses[id] = status;
  try {
    localStorage.setItem(CARD_STATUS_KEY, JSON.stringify(statuses));
  } catch {
    // Without storage the change lasts until the page is reloaded.
  }
}

// Thank-you cards for assists an admin has approved
const ASSIST_CARDS_KEY = 'esm-assist-cards';

function savedAssistCards() {
  try {
    return JSON.parse(localStorage.getItem(ASSIST_CARDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAssistCard(card) {
  try {
    localStorage.setItem(ASSIST_CARDS_KEY, JSON.stringify([...savedAssistCards(), card]));
  } catch {
    // Without storage the approval still shows until the page reloads.
  }
}

function cardsWithStatus() {
  const statuses = savedCardStatuses();
  return [...savedAssistCards(), ...buildCards()].map((card) => ({ ...card, status: statuses[card.id] || card.startingStatus }));
}

function showInboxCount() {
  const badge = document.getElementById('inbox-count');
  if (!badge) return;
  const waiting = savedFeedback().filter((item) => item.status === 'Submitted').length;
  badge.textContent = String(waiting);
  badge.hidden = waiting === 0;
}

function showReadyCount() {
  const badge = document.getElementById('cards-ready-count');
  if (!badge) return;
  const ready = cardsWithStatus().filter((card) => card.status === 'ready').length;
  badge.textContent = String(ready);
  badge.hidden = ready === 0;
}

// Feedback is also kept in this browser until there's a shared database
const FEEDBACK_KEY = 'esm-feedback';

function savedFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFeedback(items) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function buildSegmented(container, options, current, onChange) {
  container.replaceChildren();
  options.forEach(([value, label]) => {
    const button = create('button', '', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(value === current));
    button.addEventListener('click', () => onChange(value));
    container.append(button);
  });
}

function statusChip(pace) {
  return create('span', `status status-${pace.tone}`, pace.text);
}

function setUpShell() {
  const user = readSession();
  const avatar = document.getElementById('user-initials');
  if (user.photo) {
    avatar.style.backgroundImage = 'url("' + user.photo + '")';
    avatar.classList.add('has-photo');
  } else {
    avatar.textContent = initials(user.name);
  }
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = `${user.role} · ${user.college}`;

  const app = document.getElementById('app');
  const menuButton = document.getElementById('menu-button');
  const setMenuOpen = (open) => {
    app.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  };

  menuButton.addEventListener('click', () => setMenuOpen(!app.classList.contains('menu-open')));
  document.getElementById('scrim').addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  document.getElementById('sign-out').addEventListener('click', () => {
    endSession();
    location.href = 'index.html';
  });

  showReadyCount();
  showInboxCount();
  return user;
}

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
  const ready = cardsWithStatus().filter((card) => card.status === 'ready').length;
  document.querySelectorAll('#cards-ready-count, #tab-cards-count').forEach((badge) => {
    badge.textContent = String(ready);
    badge.hidden = ready === 0;
  });
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

// Redrawing a list replaces its buttons, which would drop keyboard focus back to the top of the page.
// Buttons carry a data-focus key so focus can land on the matching one again.
function keepFocus(redraw, fallback) {
  const key = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.focus : null;
  redraw();
  if (!key) return;
  const match = [...document.querySelectorAll('[data-focus]')].find((node) => node.dataset.focus === key);
  const target = match || (fallback && document.querySelector(fallback));
  if (target) target.focus();
}

function buildSegmented(container, options, current, onChange) {
  container.replaceChildren();
  options.forEach(([value, label]) => {
    const button = create('button', '', label);
    button.type = 'button';
    button.dataset.focus = `${container.id}:${value}`;
    button.setAttribute('aria-pressed', String(value === current));
    button.addEventListener('click', () => keepFocus(() => onChange(value)));
    container.append(button);
  });
}

function icon(paths, size = 18) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  paths.forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  });
  return svg;
}

const ICONS = {
  check: ['M4 12.5l5 5L20 6.5'],
  up: ['M12 19V5', 'M6 11l6-6 6 6'],
  down: ['M12 5v14', 'M6 13l6 6 6-6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16']
};

// One message area per page. An action like Undo keeps the message up a little longer.
let toastTimer;
function showToast(message, action) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.hidden = false;
  toast.replaceChildren(create('span', '', message));
  if (action) {
    const button = create('button', 'toast-action', action.label);
    button.type = 'button';
    button.addEventListener('click', () => {
      toast.hidden = true;
      action.onClick();
    });
    toast.append(button);
  }
  toastTimer = setTimeout(() => { toast.hidden = true; }, action ? 7000 : 4000);
}

// Phones get the most used pages along the bottom, within reach of a thumb
function buildTabBar(sidebar) {
  const nav = create('nav', 'tabbar');
  nav.setAttribute('aria-label', 'Quick menu');
  const current = location.pathname.split('/').pop() || 'home.html';
  const pages = [['home.html', 'Home'], ['team.html', 'Team'], ['cards.html', 'Cards']];

  pages.forEach(([href, label]) => {
    const link = create('a', 'tab');
    link.href = href;
    if (href === current) link.setAttribute('aria-current', 'page');
    link.append(sidebar.querySelector(`.menu-item[href="${href}"] svg`).cloneNode(true), create('span', '', label));
    if (href === 'cards.html') {
      const count = create('em', 'count');
      count.id = 'tab-cards-count';
      count.hidden = true;
      link.append(count);
    }
    nav.append(link);
  });

  const more = create('button', 'tab');
  more.type = 'button';
  more.setAttribute('aria-controls', 'sidebar');
  more.setAttribute('aria-expanded', 'false');
  if (!pages.some(([href]) => href === current)) more.classList.add('is-current');
  more.append(icon(ICONS.menu, 20), create('span', '', 'More'));
  nav.append(more);

  document.getElementById('app').append(nav);
  return more;
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
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menu-button');
  const moreButton = buildTabBar(sidebar);
  const smallScreen = window.matchMedia('(max-width: 900px)');
  let opener = menuButton;

  // On small screens the closed menu sits off to the side, so keyboards and screen readers must skip it
  const setMenuOpen = (open) => {
    app.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    moreButton.setAttribute('aria-expanded', String(open));
    sidebar.inert = smallScreen.matches && !open;
    if (smallScreen.matches) (open ? sidebar.querySelector('.menu-item') : opener).focus({ preventScroll: true });
  };
  sidebar.inert = smallScreen.matches;
  smallScreen.addEventListener('change', () => {
    app.classList.remove('menu-open');
    sidebar.inert = smallScreen.matches;
  });

  const openFrom = (button) => {
    opener = button;
    setMenuOpen(!app.classList.contains('menu-open'));
  };
  menuButton.addEventListener('click', () => openFrom(menuButton));
  moreButton.addEventListener('click', () => openFrom(moreButton));
  document.getElementById('scrim').addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && app.classList.contains('menu-open')) setMenuOpen(false);
  });

  document.getElementById('sign-out').addEventListener('click', () => {
    endSession();
    location.href = 'index.html';
  });

  showReadyCount();
  showInboxCount();
  return user;
}

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
  document.getElementById('user-initials').textContent = initials(user.name);
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

  return user;
}

setUpShell();

const ADMINS_KEY = 'esm-admins';
const TYPE_LABELS = { problem: 'Something is wrong', idea: 'Idea', assist: 'Assist nomination' };
const STATUS_TONES = { Submitted: 'info', 'In review': 'changed', Resolved: 'good', Approved: 'good', Declined: 'waiting' };
const FILTERS = [['open', 'Open'], ['done', 'Closed'], ['all', 'All']];
const OPEN = ['Submitted', 'In review'];

const state = { filter: 'open' };

function readAdmins() {
  try {
    return JSON.parse(localStorage.getItem(ADMINS_KEY)) || ['owner@example.com'];
  } catch {
    return ['owner@example.com'];
  }
}

function saveAdmins(list) {
  try {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(list));
  } catch {
    // The list still updates on screen until the page reloads.
  }
}

let toastTimer;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

function updateFeedback(reference, changes) {
  const items = savedFeedback().map((item) => (item.reference === reference ? { ...item, ...changes } : item));
  saveFeedback(items);
  showInboxCount();
  render();
}

function shorten(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}

function approveAssist(item) {
  const helper = findPerson(item.helper);
  const sent = new Date(item.createdAt);
  saveAssistCard({
    id: `assist-${item.reference.toLowerCase()}`,
    person: helper.name,
    college: helper.college,
    date: `${WEEKDAY_NAMES[sent.getDay()]} ${sent.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    read: 'approved by an admin',
    lead: {
      kind: 'assist',
      title: 'Thank you for an assist',
      value: 'Assist',
      unit: `for helping ${item.name.split(' ')[0]}`,
      helped: item.name.split(' ')[0],
      detail: shorten(item.message, 70)
    },
    also: [],
    startingStatus: 'ready'
  });
  updateFeedback(item.reference, { status: 'Approved' });
  showReadyCount();
  showToast(`Thank-you card for ${helper.name} is in Cards ready`);
}

function actionButton(label, className, onClick) {
  const button = create('button', `button button-inline ${className}`, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function inboxItem(item) {
  const entry = create('li', 'inbox-item');
  const top = create('div', 'submission-top');
  const heading = create('div');
  heading.append(
    create('b', '', `${item.reference} · ${TYPE_LABELS[item.type]}`),
    create('p', 'panel-note', `${item.name} · ${item.college} · ${new Date(item.createdAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
  );
  top.append(heading, statusChip({ tone: STATUS_TONES[item.status] || 'info', text: item.status }));
  entry.append(top);

  if (item.helper) entry.append(create('p', 'submission-helper', `Nominating ${item.helper}`));
  entry.append(create('p', 'submission-message', item.message));

  const extra = [item.date && `Date: ${item.date}`, item.saleReference && `Sale reference: ${item.saleReference}`].filter(Boolean);
  if (extra.length) entry.append(create('p', 'panel-note', extra.join(' · ')));

  const replyId = `reply-${item.reference}`;
  const label = create('label', 'sr-only', `Reply to ${item.name}`);
  label.htmlFor = replyId;
  const reply = create('textarea', 'input reply-box');
  reply.id = replyId;
  reply.rows = 2;
  reply.maxLength = 500;
  reply.placeholder = `Reply to ${item.name.split(' ')[0]}`;
  reply.value = item.reply || '';
  entry.append(label, reply);

  const actions = create('div', 'card-actions');
  actions.append(actionButton('Save reply', 'button-secondary', () => {
    updateFeedback(item.reference, { reply: reply.value.trim(), status: item.status === 'Submitted' ? 'In review' : item.status });
    showToast('Reply saved');
  }));

  if (OPEN.includes(item.status)) {
    if (item.type === 'assist') {
      actions.append(
        actionButton('Approve and make a card', '', () => approveAssist(item)),
        actionButton('Decline', 'button-quiet', () => updateFeedback(item.reference, { status: 'Declined' }))
      );
    } else {
      actions.append(actionButton('Mark as resolved', '', () => updateFeedback(item.reference, { status: 'Resolved' })));
    }
    if (item.status === 'Submitted') {
      actions.append(actionButton('Mark in review', 'button-quiet', () => updateFeedback(item.reference, { status: 'In review' })));
    }
  } else {
    actions.append(actionButton('Reopen', 'button-quiet', () => updateFeedback(item.reference, { status: 'In review' })));
  }

  entry.append(actions);
  return entry;
}

function showTiles() {
  const cards = cardsWithStatus();
  const feedback = savedFeedback();
  const review = (() => {
    try {
      return JSON.parse(localStorage.getItem('esm-review'));
    } catch {
      return null;
    }
  })();

  const tiles = [
    ['Cards ready', String(cards.filter((card) => card.status === 'ready').length), 'cards.html', 'Open cards ready'],
    ['New feedback', String(feedback.filter((item) => item.status === 'Submitted').length), '#inbox-title', `${feedback.length} in total`],
    ['Assists to review', String(feedback.filter((item) => item.type === 'assist' && OPEN.includes(item.status)).length), '#inbox-title', 'Approving makes a thank-you card'],
    ['Four-week check', review && review.start ? 'Running' : 'Not started', 'progress.html', review && review.start ? `Started Monday ${review.start} September` : 'Set a start date']
  ];

  const holder = document.getElementById('admin-tiles');
  holder.replaceChildren();
  tiles.forEach(([label, value, href, note]) => {
    const tile = create('a', 'tile tile-link');
    tile.href = href;
    tile.append(create('span', '', label), create('b', '', value), create('small', '', note));
    holder.append(tile);
  });
}

function showInbox() {
  const all = savedFeedback().slice().reverse();
  const counts = {
    open: all.filter((item) => OPEN.includes(item.status)).length,
    done: all.filter((item) => !OPEN.includes(item.status)).length,
    all: all.length
  };

  buildSegmented(document.getElementById('inbox-filter'), FILTERS.map(([key, label]) => [key, `${label} ${counts[key]}`]), state.filter, (filter) => {
    state.filter = filter;
    render();
  });

  const shown = all.filter((item) => state.filter === 'all' || (state.filter === 'open') === OPEN.includes(item.status));
  const list = document.getElementById('inbox');
  list.replaceChildren();

  if (!shown.length) {
    const empty = create('li', 'empty');
    if (!all.length) {
      empty.append(document.createTextNode('No feedback yet. '));
      const link = create('a', '', 'Send some from the Feedback page');
      link.href = 'feedback.html';
      empty.append(link, document.createTextNode(' to see how the inbox works.'));
    } else {
      empty.textContent = state.filter === 'open' ? 'Nothing waiting. Everything has been answered.' : 'Nothing here yet.';
    }
    list.append(empty);
    return;
  }
  shown.forEach((item) => list.append(inboxItem(item)));
}

function showAccess() {
  const list = document.getElementById('access-list');
  list.replaceChildren();
  const admins = readAdmins();
  admins.forEach((email, index) => {
    const item = create('li');
    item.append(create('span', 'avatar avatar-soft', email[0].toUpperCase()), create('span', 'access-email', email));
    if (index === 0) {
      item.append(create('span', 'status status-info', 'Owner'));
    } else {
      item.append(actionButton('Remove', 'button-quiet', () => {
        saveAdmins(readAdmins().filter((entry) => entry !== email));
        showAccess();
        showToast('Admin removed');
      }));
    }
    list.append(item);
  });
}

function render() {
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  showTiles();
  showInbox();
  showAccess();
}

document.getElementById('access-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('access-email');
  const error = document.getElementById('access-error');
  const email = input.value.trim().toLowerCase();
  error.hidden = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.textContent = 'Please enter a work email address, like name@college.co.za.';
    error.hidden = false;
    input.focus();
    return;
  }
  const admins = readAdmins();
  if (admins.includes(email)) {
    error.textContent = 'That person is already an admin.';
    error.hidden = false;
    return;
  }
  saveAdmins([...admins, email]);
  input.value = '';
  showAccess();
  showToast('Admin added');
});

document.getElementById('reset-demo').addEventListener('click', () => {
  if (!window.confirm('Reset the demo data saved in this browser? This clears card statuses, feedback, approved assists and the four-week check.')) return;
  ['esm-card-status', 'esm-feedback', 'esm-assist-cards', 'esm-review', ADMINS_KEY].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing saved to clear.
    }
  });
  showReadyCount();
  showInboxCount();
  render();
  showToast('Demo data reset');
});

render();

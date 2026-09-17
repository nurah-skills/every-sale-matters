const user = setUpShell();

const state = { college: recall('shout-college') || 'All' };

const form = document.getElementById('shout-form');
const toSelect = document.getElementById('shout-to');
const message = document.getElementById('shout-message');
const errorBox = document.getElementById('shout-error');

const shortDate = (iso) => new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' });

// Shout-outs share the admin inbox with feedback, so admins approve them in one place
const myShoutouts = () => savedFeedback().filter((item) => item.type === 'shoutout');

function boardItems() {
  const approved = myShoutouts()
    .filter((item) => item.status === 'Approved')
    .reverse()
    .map((item) => ({ from: item.name, to: item.to, message: item.message, when: shortDate(item.createdAt) }));
  const samples = SAMPLE_SHOUTOUTS.map((item) => ({ ...item, when: `${WORKDAYS[item.day]} September` }));
  return [...approved, ...samples].filter((item) => state.college === 'All' || findPerson(item.to).college === state.college);
}

function showBoard() {
  const board = document.getElementById('shout-board');
  board.replaceChildren();
  const items = boardItems();

  if (!items.length) {
    board.append(create('li', 'empty', 'No shout-outs for this college yet. Be the first to say well done.'));
    return;
  }

  items.forEach((item) => {
    const entry = create('li', 'shout');
    const top = create('div', 'shout-top');
    top.append(create('span', 'avatar', initials(item.to)));
    const who = create('div');
    who.append(create('small', '', 'Shout-out to'), create('b', '', item.to));
    top.append(who);
    const quote = create('blockquote', 'shout-message', `“${item.message}”`);
    const foot = create('p', 'shout-from');
    foot.append(create('b', '', item.from), document.createTextNode(` · ${item.when}`));
    entry.append(top, quote, foot);
    board.append(entry);
  });
}

function showPending() {
  const list = document.getElementById('shout-pending');
  list.replaceChildren();
  const mine = myShoutouts().filter((item) => item.submittedBy === user.name && item.status !== 'Approved').reverse();

  if (!mine.length) {
    list.append(create('li', 'empty', 'Nothing waiting. Shout-outs you send show here until they’re approved.'));
    return;
  }

  mine.forEach((item) => {
    const entry = create('li');
    const top = create('div', 'submission-top');
    top.append(create('b', '', `To ${item.to}`), statusChip({ tone: item.status === 'Declined' ? 'waiting' : 'info', text: item.status === 'Submitted' ? 'Waiting' : item.status }));
    entry.append(top, create('p', 'submission-message', item.message));
    if (item.reply) entry.append(create('p', 'submission-reply', `Reply: ${item.reply}`));
    list.append(entry);
  });
}

function showError(text, field) {
  errorBox.textContent = text;
  errorBox.hidden = false;
  field.setAttribute('aria-invalid', 'true');
  field.focus();
}

toSelect.append(new Option('Choose a colleague', ''));
COLLEGES.forEach((college) => {
  const group = create('optgroup');
  group.label = college;
  PEOPLE.filter((person) => person.college === college && person.name !== (user.person || user.name))
    .forEach((person) => group.append(new Option(person.name, person.name)));
  toSelect.append(group);
});

message.addEventListener('input', () => {
  document.getElementById('shout-count').textContent = `${message.value.length} of 140 characters`;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));

  if (!toSelect.value) return showError('Please choose who the shout-out is for.', toSelect);
  if (message.value.trim().length < 5) return showError('Please write a short message, at least a few words.', message);

  const items = savedFeedback();
  const reference = `FB-${String(1001 + items.length)}`;
  items.push({
    reference,
    type: 'shoutout',
    name: user.name,
    submittedBy: user.name,
    college: user.college,
    to: toSelect.value,
    helper: '',
    message: message.value.trim(),
    status: 'Submitted',
    reply: '',
    createdAt: new Date().toISOString()
  });

  if (!saveFeedback(items)) {
    errorBox.textContent = 'Your browser is blocking storage, so this couldn’t be saved. Try a normal (not private) window.';
    errorBox.hidden = false;
    errorBox.focus();
    return;
  }

  const firstName = toSelect.value.split(' ')[0];
  toSelect.value = '';
  message.value = '';
  document.getElementById('shout-count').textContent = '0 of 140 characters';
  showPending();
  showInboxCount();
  showToast(`Sent. Your shout-out for ${firstName} shows on the board once it’s approved.`);
});

// On phones the form folds away so the board comes first
const toggle = document.getElementById('shout-toggle');
const formPanel = document.getElementById('shout-form-panel');
toggle.addEventListener('click', () => {
  const open = !formPanel.classList.contains('is-open');
  formPanel.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close the form' : 'Give a shout-out';
  if (open) toSelect.focus();
});

document.getElementById('shout-college').value = state.college;
document.getElementById('shout-college').addEventListener('change', (event) => {
  state.college = event.target.value;
  remember('shout-college', state.college);
  showBoard();
});

showBoard();
showPending();

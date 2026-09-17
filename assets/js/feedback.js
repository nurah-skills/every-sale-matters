const user = setUpShell();

const TYPES = {
  problem: { label: 'Something is wrong', prompt: 'What happened, and what should it show?' },
  idea: { label: 'Idea', prompt: 'What would you like to change, and why?' },
  assist: { label: 'Assist nomination', prompt: 'What did they do to help?' }
};

const STATUS_TONES = { Submitted: 'info', 'In review': 'changed', Resolved: 'good', Approved: 'good', Declined: 'waiting' };

const form = document.getElementById('feedback-form');
const errorBox = document.getElementById('feedback-error');

const chosenType = () => form.querySelector('input[name="type"]:checked').value;

function showType() {
  const type = chosenType();
  document.getElementById('helper-field').hidden = type !== 'assist';
  document.getElementById('feedback-message-label').textContent = TYPES[type].prompt;
}

function showSubmissions() {
  const list = document.getElementById('submissions');
  list.replaceChildren();
  const mine = savedFeedback().filter((item) => item.name === user.name || item.submittedBy === user.name).reverse();

  if (!mine.length) {
    list.append(create('li', 'empty', 'No submissions yet. Your first message will show here.'));
    return;
  }

  mine.forEach((item) => {
    const entry = create('li');
    const top = create('div', 'submission-top');
    top.append(create('b', '', `${item.reference} · ${TYPES[item.type].label}`), statusChip({ tone: STATUS_TONES[item.status] || 'info', text: item.status }));
    entry.append(top);
    if (item.helper) entry.append(create('p', 'submission-helper', `Helped by ${item.helper}`));
    entry.append(create('p', 'submission-message', item.message));
    entry.append(create('p', 'panel-note', `Sent ${new Date(item.createdAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`));
    if (item.reply) entry.append(create('p', 'submission-reply', `Reply: ${item.reply}`));
    list.append(entry);
  });
}

function showError(message, field) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'type') showType();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));

  const type = chosenType();
  const name = document.getElementById('feedback-name');
  const message = document.getElementById('feedback-message');
  const helper = document.getElementById('feedback-helper');

  if (!name.value.trim()) return showError('Please add your name.', name);
  if (type === 'assist' && !helper.value) return showError('Please choose who helped you.', helper);
  if (message.value.trim().length < 5) return showError('Please tell us a little more.', message);

  const items = savedFeedback();
  const reference = `FB-${String(1001 + items.length)}`;
  items.push({
    reference,
    type,
    name: name.value.trim(),
    submittedBy: user.name,
    college: document.getElementById('feedback-college').value,
    helper: type === 'assist' ? helper.value : '',
    message: message.value.trim(),
    date: document.getElementById('feedback-date').value,
    saleReference: document.getElementById('feedback-reference').value.trim(),
    status: 'Submitted',
    reply: '',
    createdAt: new Date().toISOString()
  });

  if (!saveFeedback(items)) return showError('Your browser is blocking storage, so this couldn\'t be saved. Try a normal (not private) window.');

  message.value = '';
  document.getElementById('feedback-date').value = '';
  document.getElementById('feedback-reference').value = '';
  helper.value = '';
  showSubmissions();
  showInboxCount();
  showToast(`Thanks. Your reference is ${reference}.`);
});

document.getElementById('feedback-name').value = user.name;
document.getElementById('feedback-college').value = user.college;
document.getElementById('feedback-date').max = '2026-09-17';

const helperSelect = document.getElementById('feedback-helper');
helperSelect.append(new Option('Choose a colleague', ''));
PEOPLE.filter((person) => person.name !== (user.person || user.name))
  .sort((a, b) => a.name.localeCompare(b.name))
  .forEach((person) => helperSelect.append(new Option(person.name, person.name)));

// Coming from 'Say thank you for an assist' on the team page
if (recall('feedback-type') === 'assist') {
  form.querySelector('input[value="assist"]').checked = true;
  remember('feedback-type', '');
}

showType();
showSubmissions();

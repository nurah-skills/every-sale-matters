setUpShell();

const STATUSES = [
  ['ready', 'Ready'],
  ['changed', 'Figures changed'],
  ['sent', 'Sent'],
  ['skipped', 'Skipped'],
  ['all', 'All']
];

const STATUS_CHIPS = {
  ready: { tone: 'info', text: 'Ready' },
  changed: { tone: 'changed', text: 'Figures changed' },
  sent: { tone: 'good', text: 'Sent' },
  skipped: { tone: 'waiting', text: 'Skipped' }
};

const PILL_COLOURS = {
  best: '#F2DC8C',
  cash: '#8FB39A',
  Bronze: '#E3C19F',
  Silver: '#CBD3DC',
  Gold: '#F2DC8C',
  Diamond: '#B9D3EA'
};

const state = {
  status: STATUSES.some(([key]) => key === recall('cards-status')) ? recall('cards-status') : 'ready',
  person: recall('cards-person') || 'all',
  previewing: null
};

const valueText = (win) => (win.money ? formatMoney(win.value) : String(win.value));
const pillText = (card) => (card.lead.kind === 'best' ? 'Personal best' : card.lead.kind === 'cash' ? 'Cash' : card.lead.tier);
const pillColour = (card) => PILL_COLOURS[card.lead.kind === 'sales' ? card.lead.tier : card.lead.kind];

function captionFor(card) {
  const firstName = card.person.split(' ')[0];
  const also = card.also.length ? ` Also: ${card.also.join(', ')}.` : '';
  return `Well done, ${firstName}! ${card.lead.title}: ${valueText(card.lead)} ${card.lead.unit}. ${card.lead.detail}.${also} ${card.college} · ${card.date}`;
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

async function copyCaption(card) {
  const text = captionFor(card);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Caption copied');
  } catch {
    const field = document.getElementById('preview-caption');
    field.value = text;
    if (!document.getElementById('card-preview').open) openPreview(card);
    field.select();
    showToast('Copying was blocked. The caption is selected so you can copy it yourself.');
  }
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function fitText(context, text, x, y, maxWidth, size, weight, family) {
  let fontSize = size;
  context.font = `${weight} ${fontSize}px ${family}`;
  while (context.measureText(text).width > maxWidth && fontSize > 28) {
    fontSize -= 4;
    context.font = `${weight} ${fontSize}px ${family}`;
  }
  context.fillText(text, x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const attempt = line ? `${line} ${word}` : word;
    if (context.measureText(attempt).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((lineText, index) => context.fillText(lineText, x, y + index * lineHeight));
}

// The image people send in WhatsApp: portrait, 1080 × 1350
async function drawCard(card) {
  try {
    await Promise.all([document.fonts.load('600 80px Lexend'), document.fonts.load('700 36px Nunito')]);
  } catch {
    // The card still draws with fallback fonts.
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const heading = 'Lexend, "Segoe UI", sans-serif';
  const body = 'Nunito, "Segoe UI", sans-serif';

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, '#243B5A');
  background.addColorStop(1, '#1A2C45');
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1350);

  const glow = context.createRadialGradient(980, 1260, 0, 980, 1260, 620);
  glow.addColorStop(0, 'rgba(143, 179, 154, .32)');
  glow.addColorStop(1, 'rgba(143, 179, 154, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1080, 1350);

  roundedRect(context, 48, 48, 984, 1254, 40);
  context.strokeStyle = 'rgba(255, 255, 255, .18)';
  context.lineWidth = 3;
  context.stroke();

  roundedRect(context, 110, 110, 72, 72, 20);
  context.fillStyle = '#8FB39A';
  context.fill();
  context.fillStyle = '#243B5A';
  [[128, 146, 18], [141.5, 134, 30], [155, 122, 42]].forEach(([x, y, height]) => {
    roundedRect(context, x, y, 10, height, 3);
    context.fill();
  });

  context.fillStyle = '#FFFFFF';
  context.font = `600 36px ${heading}`;
  context.fillText('Every Sale Matters', 208, 160);

  const label = pillText(card).toUpperCase();
  context.font = `700 28px ${body}`;
  const pillWidth = context.measureText(label).width + 56;
  roundedRect(context, 110, 260, pillWidth, 58, 29);
  context.fillStyle = pillColour(card);
  context.fill();
  context.fillStyle = '#1E1E1E';
  context.fillText(label, 138, 299);

  context.fillStyle = '#FFFFFF';
  fitText(context, card.lead.title, 110, 430, 860, 66, 600, heading);

  context.fillStyle = 'rgba(255, 255, 255, .78)';
  fitText(context, `${card.person} · ${card.college}`, 110, 500, 860, 40, 700, body);

  context.fillStyle = '#FFFFFF';
  fitText(context, valueText(card.lead), 110, 790, 860, 230, 600, heading);

  context.fillStyle = '#DCE6D8';
  context.font = `700 46px ${body}`;
  wrapText(context, card.lead.unit, 110, 870, 860, 56, 1);

  context.fillStyle = 'rgba(255, 255, 255, .2)';
  context.fillRect(110, 930, 860, 2);

  context.fillStyle = 'rgba(255, 255, 255, .9)';
  context.font = `600 40px ${body}`;
  wrapText(context, card.lead.detail, 110, 1005, 860, 52, 2);

  if (card.also.length) {
    context.fillStyle = '#F2DC8C';
    context.font = `700 36px ${body}`;
    wrapText(context, `Also: ${card.also.join(' · ')}`, 110, 1115, 860, 48, 2);
  }

  context.fillStyle = 'rgba(255, 255, 255, .72)';
  context.font = `700 30px ${body}`;
  context.fillText(card.date, 110, 1212);
  context.fillStyle = 'rgba(255, 255, 255, .55)';
  context.font = `600 26px ${body}`;
  context.fillText(`Figures read ${card.read}`, 110, 1254);

  return canvas;
}

async function downloadCard(card) {
  const canvas = await drawCard(card);
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${card.id}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast('Card downloaded');
  }, 'image/png');
}

async function openPreview(card) {
  state.previewing = card;
  const dialog = document.getElementById('card-preview');
  const image = document.getElementById('preview-image');
  document.getElementById('preview-title').textContent = `${card.person} · ${card.lead.title}`;
  document.getElementById('preview-caption').value = captionFor(card);
  image.alt = `${card.lead.title} card for ${card.person}`;
  image.removeAttribute('src');
  if (!dialog.open) dialog.showModal();
  image.src = (await drawCard(card)).toDataURL('image/png');
}

function setStatus(card, status) {
  saveCardStatus(card.id, status);
  showReadyCount();
  render();
  const messages = { sent: 'Marked as sent', skipped: 'Skipped', ready: 'Moved back to ready' };
  showToast(messages[status]);
}

function actionButton(label, className, onClick) {
  const button = create('button', `button button-inline ${className}`, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function cardTile(card) {
  const tile = create('article', 'card-tile');

  const art = create('div', `card-art kind-${card.lead.kind}`);
  const pill = create('span', 'card-pill', pillText(card));
  pill.style.background = pillColour(card);
  const shortValue = card.lead.money ? `R${Math.round(card.lead.value).toLocaleString('en-ZA')}` : String(card.lead.value);
  art.append(pill, create('b', '', shortValue), create('span', '', card.lead.unit));

  const details = create('div', 'card-details');
  const top = create('div', 'card-top');
  top.append(create('h3', '', card.person), statusChip(STATUS_CHIPS[card.status]));
  details.append(
    top,
    create('p', 'card-title', card.lead.title),
    create('p', 'card-detail', card.lead.detail)
  );
  if (card.also.length) details.append(create('p', 'card-also', `Also: ${card.also.join(' · ')}`));
  details.append(create('p', 'card-meta', `${card.college} · ${card.date} · figures read ${card.read}`));

  const share = create('div', 'card-actions');
  share.append(
    actionButton('Download PNG', '', () => downloadCard(card)),
    actionButton('Preview', 'button-secondary', () => openPreview(card)),
    actionButton('Copy caption', 'button-secondary', () => copyCaption(card))
  );

  const manage = create('div', 'card-manage');
  if (card.status === 'ready' || card.status === 'changed') {
    manage.append(
      actionButton(card.status === 'changed' ? 'Checked, mark as sent' : 'Mark as sent', 'button-quiet', () => setStatus(card, 'sent')),
      actionButton('Skip', 'button-quiet', () => setStatus(card, 'skipped'))
    );
  } else {
    manage.append(actionButton('Move back to ready', 'button-quiet', () => setStatus(card, 'ready')));
  }

  details.append(share, manage);
  tile.append(art, details);
  return tile;
}

function render() {
  const cards = cardsWithStatus();
  const ready = cards.filter((card) => card.status === 'ready');
  const bests = ready.filter((card) => card.lead.kind === 'best').length;

  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('cards-note').textContent =
    `${ready.length} card${ready.length === 1 ? '' : 's'} ready${bests ? `, including ${bests} personal best${bests === 1 ? '' : 's'}` : ''}. Personal bests come first.`;

  const counts = (key) => (key === 'all' ? cards.length : cards.filter((card) => card.status === key).length);
  buildSegmented(
    document.getElementById('status-picker'),
    STATUSES.map(([key, label]) => [key, `${label} ${counts(key)}`]),
    state.status,
    (status) => {
      state.status = status;
      remember('cards-status', status);
      render();
    }
  );

  const people = [...new Set(cards.map((card) => card.person))].sort();
  if (state.person !== 'all' && !people.includes(state.person)) state.person = 'all';
  const filter = document.getElementById('person-filter');
  filter.replaceChildren(new Option('Everyone', 'all'), ...people.map((name) => new Option(name, name)));
  filter.value = state.person;

  const shown = cards.filter((card) =>
    (state.status === 'all' || card.status === state.status) && (state.person === 'all' || card.person === state.person));

  const grid = document.getElementById('card-grid');
  grid.replaceChildren();
  if (!shown.length) {
    const label = STATUSES.find(([key]) => key === state.status)[1].toLowerCase();
    grid.append(create('p', 'empty', state.status === 'all' ? 'No cards for this person yet.' : `No ${label} cards here right now.`));
    return;
  }
  shown.forEach((card) => grid.append(cardTile(card)));
}

document.getElementById('person-filter').addEventListener('change', (event) => {
  state.person = event.target.value;
  remember('cards-person', state.person);
  render();
});

document.getElementById('check-cards').addEventListener('click', () => {
  showToast(`You're up to date. These cards use the ${SNAPSHOT.time} figures.`);
});

document.getElementById('close-preview').addEventListener('click', () => document.getElementById('card-preview').close());
document.getElementById('preview-download').addEventListener('click', () => state.previewing && downloadCard(state.previewing));
document.getElementById('preview-copy').addEventListener('click', () => state.previewing && copyCaption(state.previewing));
document.getElementById('card-preview').addEventListener('click', (event) => {
  if (event.target.id === 'card-preview') event.target.close();
});

render();

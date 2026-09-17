// The celebration card people send in WhatsApp, shared by Cards ready and Make a card.

const PILL_COLOURS = {
  best: '#F2DC8C',
  cash: '#8FB39A',
  assist: '#B9D3EA',
  Bronze: '#E3C19F',
  Silver: '#CBD3DC',
  Gold: '#F2DC8C',
  Diamond: '#B9D3EA',
  Total: '#DCE6D8'
};

const valueText = (win) => (win.money ? formatMoney(win.value) : String(win.value));
const shortValueText = (win) => (win.money ? `R${Math.round(win.value).toLocaleString('en-ZA')}` : String(win.value));

function pillText(card) {
  if (card.lead.kind === 'best') return 'Personal best';
  if (card.lead.kind === 'cash') return 'Cash';
  if (card.lead.kind === 'assist') return 'Thank you';
  return card.lead.tier === 'Total' ? 'Registrations' : card.lead.tier;
}

const pillColour = (card) => PILL_COLOURS[card.lead.kind === 'sales' ? card.lead.tier : card.lead.kind];

const readLine = (card) => (card.lead.kind === 'assist' ? 'Approved by an admin' : `Figures read ${card.read}`);

function captionFor(card, cheer = '') {
  const firstName = card.person.split(' ')[0];
  if (card.lead.kind === 'assist') {
    const extra = cheer.trim() ? ` ${cheer.trim()}` : '';
    return `Thank you, ${firstName}, for helping ${card.lead.helped}! ${card.lead.detail}${extra} ${card.college} · ${card.date}`;
  }
  const also = card.also.length ? ` Also: ${card.also.join(', ')}.` : '';
  const message = cheer.trim() ? ` ${cheer.trim()}` : '';
  return `Well done, ${firstName}! ${card.lead.title}: ${valueText(card.lead)} ${card.lead.unit}. ${card.lead.detail}.${also}${message} ${card.college} · ${card.date}`;
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

// Returns false when the browser blocks copying, so the page can offer the text another way
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
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

// Portrait, 1080 × 1350, so it fills a phone screen in WhatsApp
async function drawCard(card, cheer = '') {
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

  let y = 1005;
  context.fillStyle = 'rgba(255, 255, 255, .9)';
  context.font = `600 40px ${body}`;
  wrapText(context, card.lead.detail, 110, y, 860, 52, 1);
  y += 70;

  if (card.also.length) {
    context.fillStyle = '#F2DC8C';
    context.font = `700 36px ${body}`;
    wrapText(context, `Also: ${card.also.join(' · ')}`, 110, y, 860, 48, 1);
    y += 62;
  }

  if (cheer.trim()) {
    context.fillStyle = '#F2DC8C';
    context.font = `italic 700 40px ${body}`;
    wrapText(context, `“${cheer.trim()}”`, 110, y, 860, 50, 2);
  }

  context.fillStyle = 'rgba(255, 255, 255, .72)';
  context.font = `700 30px ${body}`;
  context.fillText(card.date, 110, 1212);
  context.fillStyle = 'rgba(255, 255, 255, .55)';
  context.font = `600 26px ${body}`;
  context.fillText(readLine(card), 110, 1254);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function downloadCard(card, cheer = '') {
  const blob = await canvasToBlob(await drawCard(card, cheer));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${card.id}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast('Card downloaded');
}

// The celebration card people send in WhatsApp, shared by Cards ready and Make a card.

const PILL_COLOURS = {
  best: '#F2DC8C',
  cash: '#8FB39A',
  assist: '#B9D3EA',
  incentive: '#F6C28B',
  steady: '#DCE6D8',
  streak: '#F7B267',
  Platinum: '#E4E1F0',
  Black: '#111418',
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
  if (card.lead.kind === 'incentive') return 'Staff incentive';
  if (card.lead.kind === 'steady') return 'Steady progress';
  if (card.lead.kind === 'streak') return 'Streak';
  return card.lead.tier === 'Total' ? 'Registrations' : card.lead.tier;
}

const pillColour = (card) => PILL_COLOURS[card.lead.kind === 'sales' ? card.lead.tier : card.lead.kind];
const pillTextColour = (card) => (card.lead.tier === 'Black' ? '#FFFFFF' : '#1E1E1E');

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

// Showing the canvas itself skips turning a large card into PNG data, which is slow on older phones
function showCanvas(placeholder, canvas, label) {
  canvas.id = placeholder.id;
  canvas.className = placeholder.className;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  placeholder.replaceWith(canvas);
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

const COLLEGE_LOGOS = {
  'Skills Academy': 'assets/img/colleges/skills-academy.webp',
  'Matric College': 'assets/img/colleges/matric-college.webp',
  Bellview: 'assets/img/colleges/bellview.webp'
};

const CARD_DESIGNS = [
  { id: 'navy', name: 'Navy classic', from: '#243B5A', to: '#1A2C45', glow: 'rgba(143, 179, 154, .32)', highlight: '#F2DC8C', decoration: 'none' },
  { id: 'gold', name: 'Gold record', from: '#3A2E12', to: '#1F1A0C', glow: 'rgba(242, 220, 140, .38)', highlight: '#F2DC8C', decoration: 'rays' },
  { id: 'bronze', name: 'Warm bronze', from: '#4A2E1C', to: '#2A1A10', glow: 'rgba(227, 193, 159, .35)', highlight: '#F3D2B0', decoration: 'dots' },
  { id: 'silver', name: 'Cool silver', from: '#2F3A46', to: '#1B232C', glow: 'rgba(203, 211, 220, .35)', highlight: '#E3E8EE', decoration: 'dots' },
  { id: 'diamond', name: 'Diamond ice', from: '#123A55', to: '#0B2233', glow: 'rgba(185, 211, 234, .4)', highlight: '#CFE4F5', decoration: 'rays' },
  { id: 'platinum', name: 'Platinum lavender', from: '#35305A', to: '#1F1C38', glow: 'rgba(228, 225, 240, .35)', highlight: '#E4E1F0', decoration: 'dots' },
  { id: 'midnight', name: 'Midnight black', from: '#15181D', to: '#050607', glow: 'rgba(242, 220, 140, .25)', highlight: '#F2DC8C', decoration: 'confetti' },
  { id: 'emerald', name: 'Emerald cash', from: '#1D4A38', to: '#0F2A20', glow: 'rgba(143, 179, 154, .45)', highlight: '#C9E6D2', decoration: 'dots' },
  { id: 'sunset', name: 'Sunset reward', from: '#5A2E2A', to: '#2E1716', glow: 'rgba(246, 194, 139, .45)', highlight: '#F6C28B', decoration: 'rays' },
  { id: 'sage', name: 'Sage steady', from: '#2F4A3C', to: '#1B2C23', glow: 'rgba(220, 230, 216, .35)', highlight: '#DCE6D8', decoration: 'none' },
  { id: 'sky', name: 'Sky thank-you', from: '#1F4466', to: '#12283C', glow: 'rgba(185, 211, 234, .4)', highlight: '#B9D3EA', decoration: 'confetti' }
];

const DECORATIONS = ['none', 'dots', 'rays', 'confetti'];

// "Match this achievement" picks colours that suit the win
function matchingDesign(card) {
  const byTier = { Bronze: 'bronze', Silver: 'silver', Gold: 'gold', Diamond: 'diamond', Platinum: 'platinum', Black: 'midnight' };
  const byKind = { best: 'gold', streak: 'sunset', cash: 'emerald', incentive: 'sunset', steady: 'sage', assist: 'sky' };
  const id = card.lead.kind === 'sales' ? byTier[card.lead.tier] || 'navy' : byKind[card.lead.kind] || 'navy';
  return CARD_DESIGNS.find((design) => design.id === id);
}

const imageCache = {};
function loadImage(source) {
  if (!imageCache[source]) {
    imageCache[source] = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }
  return imageCache[source];
}

// Picture fills the card without stretching, like a phone wallpaper
function drawCover(context, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawDecoration(context, kind, colour, seedText) {
  const random = seededRandom(seedText);
  context.save();
  if (kind === 'dots') {
    context.fillStyle = colour;
    for (let index = 0; index < 26; index += 1) {
      context.globalAlpha = 0.12 + random() * 0.25;
      context.beginPath();
      context.arc(560 + random() * 480, 80 + random() * 520, 4 + random() * 10, 0, Math.PI * 2);
      context.fill();
    }
  } else if (kind === 'rays') {
    context.strokeStyle = colour;
    context.lineWidth = 3;
    for (let index = 0; index < 14; index += 1) {
      context.globalAlpha = 0.08 + random() * 0.12;
      // Fan out from the top right corner, between straight down and straight left
      const angle = Math.PI / 2 + (index / 13) * (Math.PI / 2);
      context.beginPath();
      context.moveTo(1080, 0);
      context.lineTo(1080 + Math.cos(angle) * 1400, Math.sin(angle) * 1400);
      context.stroke();
    }
  } else if (kind === 'confetti') {
    const colours = [colour, '#F6C28B', '#B9D3EA', '#DCE6D8'];
    for (let index = 0; index < 40; index += 1) {
      context.globalAlpha = 0.35 + random() * 0.4;
      context.fillStyle = colours[index % colours.length];
      context.save();
      context.translate(80 + random() * 920, 60 + random() * 300);
      context.rotate(random() * Math.PI);
      context.fillRect(-9, -4, 18, 8);
      context.restore();
    }
  }
  context.restore();
}

// Portrait, 1080 × 1350, so it fills a phone screen in WhatsApp
async function drawCard(card, cheer = '', options = {}) {
  try {
    await Promise.all([document.fonts.load('600 80px Lexend'), document.fonts.load('700 36px Nunito')]);
  } catch {
    // The card still draws with fallback fonts.
  }

  const design = options.design || CARD_DESIGNS[0];
  const decoration = options.decoration || design.decoration;
  // Leaving the photo out uses the person's saved photo; null means no photo at all
  const savedPhoto = savedPhotos()[card.person];
  const [logo, photo] = await Promise.all([
    COLLEGE_LOGOS[card.college] ? loadImage(COLLEGE_LOGOS[card.college]) : null,
    options.photo === undefined ? (savedPhoto ? loadImage(savedPhoto) : null) : options.photo
  ]);
  const frame = { zoom: 1, x: 50, y: 50, ...options.photoFrame };

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const heading = 'Lexend, "Segoe UI", sans-serif';
  const body = 'Nunito, "Segoe UI", sans-serif';

  if (options.background) {
    drawCover(context, options.background, 1080, 1350);
    // Darken the photo so the writing stays easy to read
    const shade = context.createLinearGradient(0, 0, 0, 1350);
    shade.addColorStop(0, 'rgba(10, 16, 26, .55)');
    shade.addColorStop(1, 'rgba(10, 16, 26, .82)');
    context.fillStyle = shade;
    context.fillRect(0, 0, 1080, 1350);
  } else {
    const background = context.createLinearGradient(0, 0, 1080, 1350);
    background.addColorStop(0, design.from);
    background.addColorStop(1, design.to);
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1350);

    const glow = context.createRadialGradient(980, 1260, 0, 980, 1260, 620);
    glow.addColorStop(0, design.glow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, 1080, 1350);
    drawDecoration(context, decoration, design.highlight, card.id);
  }

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
  context.font = `600 34px ${heading}`;
  context.fillText('Sales Scoreboard', 204, 158);

  // College logo on a white badge, top right
  if (logo) {
    const logoHeight = 64;
    const logoWidth = Math.min(200, (logo.width / logo.height) * logoHeight);
    const drawHeight = (logo.height / logo.width) * logoWidth;
    roundedRect(context, 970 - logoWidth - 32, 102, logoWidth + 32, 88, 18);
    context.fillStyle = '#FFFFFF';
    context.fill();
    context.drawImage(logo, 970 - logoWidth - 16, 146 - drawHeight / 2, logoWidth, drawHeight);
  }

  const textWidth = photo ? 600 : 860;

  if (photo) {
    context.save();
    context.beginPath();
    context.arc(840, 420, 130, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    const size = Math.min(photo.width, photo.height) / frame.zoom;
    const left = (photo.width - size) * (frame.x / 100);
    const top = (photo.height - size) * (frame.y / 100);
    context.drawImage(photo, left, top, size, size, 710, 290, 260, 260);
    context.restore();
    context.beginPath();
    context.arc(840, 420, 132, 0, Math.PI * 2);
    context.strokeStyle = design.highlight;
    context.lineWidth = 8;
    context.stroke();
  }

  const label = pillText(card).toUpperCase();
  context.font = `700 28px ${body}`;
  const pillWidth = context.measureText(label).width + 56;
  roundedRect(context, 110, 260, pillWidth, 58, 29);
  context.fillStyle = pillColour(card);
  context.fill();
  context.fillStyle = pillTextColour(card);
  context.fillText(label, 138, 299);

  context.fillStyle = '#FFFFFF';
  fitText(context, card.lead.title, 110, 430, textWidth, 66, 600, heading);

  context.fillStyle = 'rgba(255, 255, 255, .8)';
  fitText(context, `${card.person} · ${card.college}`, 110, 500, textWidth, 40, 700, body);

  context.fillStyle = '#FFFFFF';
  fitText(context, valueText(card.lead), 110, 790, 860, 230, 600, heading);

  context.fillStyle = design.highlight;
  context.font = `700 46px ${body}`;
  wrapText(context, card.lead.unit, 110, 870, 860, 56, 1);

  context.fillStyle = 'rgba(255, 255, 255, .22)';
  context.fillRect(110, 930, 860, 2);

  let y = 1005;
  context.fillStyle = 'rgba(255, 255, 255, .92)';
  context.font = `600 40px ${body}`;
  wrapText(context, card.lead.detail, 110, y, 860, 52, 1);
  y += 70;

  if (card.also.length) {
    context.fillStyle = design.highlight;
    context.font = `700 36px ${body}`;
    wrapText(context, `Also: ${card.also.join(' · ')}`, 110, y, 860, 48, 1);
    y += 62;
  }

  if (cheer.trim()) {
    context.fillStyle = design.highlight;
    context.font = `italic 700 40px ${body}`;
    wrapText(context, `“${cheer.trim()}”`, 110, y, 860, 50, 2);
  }

  context.fillStyle = 'rgba(255, 255, 255, .75)';
  context.font = `700 30px ${body}`;
  context.fillText(card.date, 110, 1212);
  context.fillStyle = 'rgba(255, 255, 255, .58)';
  context.font = `600 26px ${body}`;
  context.fillText(readLine(card), 110, 1254);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function downloadCard(card, cheer = '', options = {}) {
  const blob = await canvasToBlob(await drawCard(card, cheer, options));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${card.id}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast('Card downloaded');
}

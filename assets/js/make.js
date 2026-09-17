const user = setUpShell();

const state = {
  person: findPerson(recall('make-person') || user.person || user.name).name,
  choice: 0,
  cheer: '',
  design: 'match',
  decoration: null,
  background: null,
  photo: null,
  photoFrame: { zoom: 1, x: 50, y: 50 }
};

const personSelect = document.getElementById('maker-person');
const achievementSelect = document.getElementById('maker-achievement');
const cheerInput = document.getElementById('maker-cheer');
const designSelect = document.getElementById('maker-design');
const captionBox = document.getElementById('maker-caption');
const image = document.getElementById('maker-image');
const photoSliders = { zoom: 'maker-photo-zoom', x: 'maker-photo-x', y: 'maker-photo-y' };

const MAX_UPLOAD = 8 * 1024 * 1024;

const currentCard = () => achievementsFor(findPerson(state.person))[state.choice];

function drawOptions() {
  const card = currentCard();
  const design = state.design === 'match' ? matchingDesign(card) : CARD_DESIGNS.find((item) => item.id === state.design);
  return { design, decoration: state.decoration, background: state.background, photo: state.photo, photoFrame: state.photoFrame };
}

function fillPeople() {
  COLLEGES.forEach((college) => {
    const group = create('optgroup');
    group.label = college;
    PEOPLE.filter((person) => person.college === college)
      .forEach((person) => group.append(new Option(person.name, person.name)));
    personSelect.append(group);
  });
  personSelect.value = state.person;
}

function fillAchievements() {
  const options = achievementsFor(findPerson(state.person));
  achievementSelect.replaceChildren(...options.map((card, index) =>
    new Option(`${card.lead.title} · ${shortValueText(card.lead)} · ${card.shortDate}`, String(index))));
  state.choice = 0;
  achievementSelect.value = '0';
}

function fillDesigns() {
  designSelect.append(new Option('Match this achievement', 'match'));
  CARD_DESIGNS.forEach((design) => designSelect.append(new Option(design.name, design.id)));
  designSelect.value = state.design;
}

// Drawing takes a moment, so ignore any drawing that finishes after a newer one started
let drawing = 0;
async function updatePreview() {
  const card = currentCard();
  captionBox.value = captionFor(card, state.cheer);
  const thisDrawing = ++drawing;
  const canvas = await drawCard(card, state.cheer, drawOptions());
  if (thisDrawing !== drawing) return;
  image.src = canvas.toDataURL('image/png');
  image.alt = `${card.lead.title} card for ${card.person}`;
}

// Pictures are read into the page as data, so nothing leaves the browser
function readPicture(input, onLoaded) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    showToast('Please choose a PNG, JPG or WebP picture.');
    return;
  }
  if (file.size > MAX_UPLOAD) {
    showToast('That picture is too big. Please choose one under 8 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const picture = new Image();
    picture.onload = () => onLoaded(picture, reader.result);
    picture.onerror = () => showToast('That picture couldn\'t be opened. Please try another one.');
    picture.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function showPhoto(picture, dataUrl, source) {
  state.photo = picture;
  state.photoFrame = { zoom: 1, x: 50, y: 50 };
  Object.entries(photoSliders).forEach(([key, id]) => { document.getElementById(id).value = String(state.photoFrame[key]); });
  document.getElementById('maker-photo-preview').style.backgroundImage = `url("${dataUrl}")`;
  document.getElementById('maker-photo-clear').hidden = false;
  document.getElementById('maker-photo-adjust').hidden = false;
  const note = document.getElementById('maker-photo-source');
  note.textContent = source;
  note.hidden = false;
}

function clearPhoto() {
  state.photo = null;
  document.getElementById('maker-photo-preview').style.backgroundImage = '';
  document.getElementById('maker-photo-clear').hidden = true;
  document.getElementById('maker-photo-adjust').hidden = true;
  document.getElementById('maker-photo-source').hidden = true;
}

async function loadSavedPhoto() {
  const person = state.person;
  const saved = savedPhotos()[person];
  clearPhoto();
  if (!saved) return;
  const picture = await loadImage(saved);
  if (!picture || person !== state.person) return;
  showPhoto(picture, saved, `Saved photo for ${person}`);
}

async function setUpSharing() {
  const button = document.getElementById('maker-share');
  if (!navigator.canShare) return;
  const test = new File([new Blob()], 'card.png', { type: 'image/png' });
  if (!navigator.canShare({ files: [test] })) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const card = currentCard();
    const blob = await canvasToBlob(await drawCard(card, state.cheer, drawOptions()));
    try {
      await navigator.share({
        files: [new File([blob], `${card.id}.png`, { type: 'image/png' })],
        text: captionFor(card, state.cheer)
      });
    } catch {
      // Closing the share menu without choosing an app isn't an error worth showing.
    }
  });
}

personSelect.addEventListener('change', () => {
  state.person = personSelect.value;
  remember('make-person', state.person);
  fillAchievements();
  loadSavedPhoto().then(updatePreview);
});

achievementSelect.addEventListener('change', () => {
  state.choice = Number(achievementSelect.value);
  updatePreview();
});

let typingTimer;
cheerInput.addEventListener('input', () => {
  state.cheer = cheerInput.value;
  document.getElementById('maker-cheer-count').textContent = `${cheerInput.value.length} of 80 characters`;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(updatePreview, 250);
});

designSelect.addEventListener('change', () => {
  state.design = designSelect.value;
  state.decoration = null;
  updatePreview();
});

document.getElementById('maker-shuffle').addEventListener('click', () => {
  const others = CARD_DESIGNS.filter((design) => design.id !== state.design);
  state.design = others[Math.floor(Math.random() * others.length)].id;
  state.decoration = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
  designSelect.value = state.design;
  updatePreview();
});

document.getElementById('maker-background').addEventListener('change', (event) => {
  readPicture(event.target, (picture) => {
    state.background = picture;
    document.getElementById('maker-background-clear').hidden = false;
    updatePreview();
  });
});

document.getElementById('maker-background-clear').addEventListener('click', (event) => {
  state.background = null;
  event.target.hidden = true;
  updatePreview();
});

document.getElementById('maker-photo').addEventListener('change', (event) => {
  readPicture(event.target, (picture, dataUrl) => {
    showPhoto(picture, dataUrl, 'Photo for this card only');
    updatePreview();
  });
});

document.getElementById('maker-photo-clear').addEventListener('click', () => {
  clearPhoto();
  updatePreview();
});

let sliderTimer;
Object.entries(photoSliders).forEach(([key, id]) => {
  document.getElementById(id).addEventListener('input', (event) => {
    state.photoFrame = { ...state.photoFrame, [key]: Number(event.target.value) };
    clearTimeout(sliderTimer);
    sliderTimer = setTimeout(updatePreview, 60);
  });
});

document.getElementById('maker-download').addEventListener('click', () => downloadCard(currentCard(), state.cheer, drawOptions()));

document.getElementById('maker-copy').addEventListener('click', async () => {
  if (await copyText(captionBox.value)) {
    showToast('Caption copied');
    return;
  }
  captionBox.focus();
  captionBox.select();
  showToast('Copying was blocked. The caption is selected so you can copy it yourself.');
});

fillPeople();
fillAchievements();
fillDesigns();
loadSavedPhoto().then(updatePreview);
setUpSharing();

const user = setUpShell();

const state = {
  person: findPerson(recall('make-person') || user.name).name,
  choice: 0,
  cheer: ''
};

const personSelect = document.getElementById('maker-person');
const achievementSelect = document.getElementById('maker-achievement');
const cheerInput = document.getElementById('maker-cheer');
const captionBox = document.getElementById('maker-caption');
const image = document.getElementById('maker-image');

const currentCard = () => achievementsFor(findPerson(state.person))[state.choice];

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

// Drawing takes a moment, so ignore any drawing that finishes after a newer one started
let drawing = 0;
async function updatePreview() {
  const card = currentCard();
  captionBox.value = captionFor(card, state.cheer);
  const thisDrawing = ++drawing;
  const canvas = await drawCard(card, state.cheer);
  if (thisDrawing !== drawing) return;
  image.src = canvas.toDataURL('image/png');
  image.alt = `${card.lead.title} card for ${card.person}`;
}

async function setUpSharing() {
  const button = document.getElementById('maker-share');
  if (!navigator.canShare) return;
  const test = new File([new Blob()], 'card.png', { type: 'image/png' });
  if (!navigator.canShare({ files: [test] })) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const card = currentCard();
    const blob = await canvasToBlob(await drawCard(card, state.cheer));
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
  updatePreview();
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

document.getElementById('maker-download').addEventListener('click', () => downloadCard(currentCard(), state.cheer));

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
updatePreview();
setUpSharing();

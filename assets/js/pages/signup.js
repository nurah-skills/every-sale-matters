// Create account for the demo: checks every detail, then signs the person in with their photo.
// Nothing is sent anywhere and the password is never kept.

const form = document.getElementById('signup-form');
const photoInput = document.getElementById('photo');
const collegeSelect = document.getElementById('college');
const scoreboardSelect = document.getElementById('scoreboard-name');

const MAX_PHOTO = 5 * 1024 * 1024;
let photoData = '';

function setError(id, message) {
  const field = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (id === 'photo') document.getElementById('photo-preview').classList.toggle('is-invalid', Boolean(message));
}

function fillScoreboardNames() {
  const college = collegeSelect.value;
  const chosen = scoreboardSelect.value;
  scoreboardSelect.replaceChildren(new Option("I'm not on the scoreboard", ''));
  PEOPLE.filter((person) => !college || person.college === college)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((person) => scoreboardSelect.append(new Option(person.name, person.name)));
  scoreboardSelect.value = [...scoreboardSelect.options].some((option) => option.value === chosen) ? chosen : '';
}

// Photos are cropped to a square and shrunk so they stay small enough to keep in the browser
function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        canvas.getContext('2d').drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 480, 480);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  photoInput.value = '';
  if (!file) return;

  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setError('photo', 'Please choose a JPG, PNG or WebP photo.');
    return;
  }
  if (file.size > MAX_PHOTO) {
    setError('photo', 'That photo is bigger than 5 MB. Please choose a smaller one.');
    return;
  }

  try {
    photoData = await preparePhoto(file);
  } catch {
    setError('photo', "That photo couldn't be opened. Please try another one.");
    return;
  }

  const preview = document.getElementById('photo-preview');
  preview.style.backgroundImage = `url("${photoData}")`;
  preview.classList.add('has-photo');
  document.getElementById('photo-button').textContent = 'Change photo';
  setError('photo', '');
});

collegeSelect.addEventListener('change', fillScoreboardNames);

const value = (id) => document.getElementById(id).value.trim();

function confirmError() {
  const confirm = document.getElementById('password-confirm').value;
  if (!confirm) return 'Please type your password again.';
  return confirm === document.getElementById('password').value ? '' : "The passwords don't match.";
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const errors = {
    photo: photoData ? '' : 'Please add a photo of yourself.',
    'first-name': value('first-name') ? '' : 'Please enter your first name.',
    surname: value('surname') ? '' : 'Please enter your surname.',
    'job-title': value('job-title') ? '' : 'Please enter your job title.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')) ? '' : 'Please enter a work email address, like name@college.co.za.',
    mobile: !value('mobile') || /^(\+27|0)[\d ]{9,13}$/.test(value('mobile')) ? '' : 'Please enter a South African mobile number, like 082 123 4567.',
    college: value('college') ? '' : 'Please choose your college.',
    password: document.getElementById('password').value.length >= 8 ? '' : 'Your password needs at least 8 characters.',
    'password-confirm': confirmError()
  };

  Object.entries(errors).forEach(([id, message]) => setError(id, message));
  const firstProblem = Object.keys(errors).find((id) => errors[id]);
  const summary = document.getElementById('signup-error');
  summary.hidden = !firstProblem;

  if (firstProblem) {
    const target = firstProblem === 'photo' ? photoInput : document.getElementById(firstProblem);
    target.focus();
    return;
  }

  const firstName = value('first-name');
  const preferred = value('preferred-name');
  const signedUp = startSession({
    name: `${preferred || firstName} ${value('surname')}`,
    firstName,
    surname: value('surname'),
    preferredName: preferred,
    role: value('job-title'),
    email: value('email'),
    mobile: value('mobile'),
    college: value('college'),
    person: scoreboardSelect.value || null,
    photo: photoData
  });

  if (signedUp && scoreboardSelect.value) savePhoto(scoreboardSelect.value, photoData);

  if (!signedUp) {
    summary.textContent = "Your browser is blocking site storage, so the demo can't create your account. Try a normal (not private) window.";
    summary.hidden = false;
    summary.focus();
    return;
  }
  location.href = 'home.html';
});

fillScoreboardNames();

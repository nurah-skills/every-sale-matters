// There are no real accounts yet. The demo sign-in just remembers a sample person in this browser.
const SESSION_KEY = 'esm-session';

// Two sample accounts, because managers and consultants see different things
const DEMO_USERS = {
  manager: {
    name: 'Refiloe Sibanda',
    college: 'Skills Academy',
    role: 'Sales manager',
    manager: true,
    person: null
  },
  consultant: {
    name: 'Lerato Mokoena',
    college: 'Skills Academy',
    role: 'Sales consultant',
    manager: false,
    person: 'Lerato Mokoena'
  }
};

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function startSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  } catch {
    return false;
  }
}

const startDemoSession = (kind) => startSession(DEMO_USERS[kind] || DEMO_USERS.consultant);

// Profile photos are kept apart from the session so they stay on cards after someone signs out
const PHOTOS_KEY = 'esm-photos';

function savedPhotos() {
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePhoto(person, dataUrl) {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify({ ...savedPhotos(), [person]: dataUrl }));
  } catch {
    // The card just goes without a photo if storage is full or blocked.
  }
}

function endSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

// Runs in the <head> so people never see a flash of the wrong page.
const pageType = document.documentElement.dataset.page;
const signedIn = readSession();
// The signed-in pages live in pages/, so the way back out is one level up
const SIGN_IN_PAGE = '../index.html';
const HOME_PAGE = pageType === 'app' ? 'home.html' : 'pages/home.html';

if (pageType === 'app' && !signedIn) location.replace(SIGN_IN_PAGE);
if (pageType === 'auth' && signedIn) location.replace(HOME_PAGE);
// Some pages are for managers only
if (document.documentElement.dataset.access === 'manager' && signedIn && !signedIn.manager) location.replace('home.html');

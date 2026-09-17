// There are no real accounts yet. The demo sign-in just remembers a sample person in this browser.
const SESSION_KEY = 'esm-session';

const DEMO_USER = {
  name: 'Lerato Mokoena',
  college: 'Skills Academy',
  role: 'Sales consultant'
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

const startDemoSession = () => startSession(DEMO_USER);

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
if (pageType === 'app' && !readSession()) location.replace('index.html');
if (pageType === 'auth' && readSession()) location.replace('home.html');

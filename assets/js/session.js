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

function startDemoSession() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER));
    return true;
  } catch {
    return false;
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

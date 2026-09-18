// What this board would tell someone looking at all three at once.
// The hub reads this rather than keeping its own copy of the figures, so the two can never disagree.
// It is loaded by summary.html, which the hub opens in a hidden frame.

// Cards a person earned but nobody has sent yet. Statuses a manager changed live in
// their own browser, so this is the board's own starting state, which is what a hub should show.
const cards = buildCards();
const ready = cards.filter((card) => card.startingStatus === 'ready');
const week = PEOPLE.reduce((sum, person) => sum + figuresFor(person, 'week').count, 0);
const weekCash = PEOPLE.reduce((sum, person) => sum + figuresFor(person, 'week').cash, 0);
const behind = PEOPLE.filter((person) => {
  const figures = figuresFor(person, 'week');
  return figures.count < figures.byNow;
}).length;

const SUMMARY = {
  board: 'scoreboard',
  name: 'Sales scoreboard',
  what: 'Registrations and cash by person and college, with the cards that recognise them.',
  home: 'pages/home.html',
  read: `${SNAPSHOT.date} at ${SNAPSHOT.time}`,
  needs: [
    {
      count: ready.length,
      one: 'card ready to send', many: 'cards ready to send',
      href: 'pages/cards.html', tone: 'hold'
    },
    {
      count: behind,
      one: 'person behind their August pace', many: 'people behind their August pace',
      href: 'pages/team.html', tone: 'hold'
    }
  ],
  figures: [
    { label: 'Registrations this week', value: week.toLocaleString('en-ZA').replace(/,/g, ' '), note: WEEK_LABEL },
    { label: 'Cash this week', value: `R ${Math.round(weekCash).toLocaleString('en-ZA').replace(/,/g, ' ')}`, note: 'recorded against those registrations' }
  ]
};

parent.postMessage({ hsgSummary: SUMMARY }, location.origin);

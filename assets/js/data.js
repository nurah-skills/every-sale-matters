// Made-up people and figures so the pages can be designed before the real sheets are connected.
// The measures match the current scoreboard: registrations, cash, August averages and personal bests.

const SNAPSHOT = {
  date: 'Thursday 17 September 2026',
  time: '10:32',
  // Share of an 08:00–17:00 working day that has passed at the snapshot time
  dayFraction: (10 + 32 / 60 - 8) / 9
};

const WORKDAYS = [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17];
const TODAY = WORKDAYS.length - 1;
const WEEK_START = WORKDAYS.indexOf(14);

const PERIODS = {
  today: {
    label: 'Today', unit: 'day', from: TODAY, to: TODAY,
    note: 'Thursday 17 September so far', days: 1, daysByNow: SNAPSHOT.dayFraction
  },
  yesterday: {
    label: 'Yesterday', unit: 'day', from: TODAY - 1, to: TODAY - 1,
    note: 'Wednesday 16 September', days: 1, daysByNow: 1
  },
  week: {
    label: 'This week', unit: 'week', from: WEEK_START, to: TODAY,
    note: 'Monday 14 to Thursday 17 September so far',
    days: TODAY - WEEK_START + 1, daysByNow: TODAY - WEEK_START + SNAPSHOT.dayFraction
  },
  month: {
    label: 'This month', unit: 'month', from: 0, to: TODAY,
    note: '1 to 17 September so far', days: TODAY + 1, daysByNow: TODAY + SNAPSHOT.dayFraction
  }
};

const COLLEGES = ['Skills Academy', 'Matric College', 'Bellview'];

const CASH_MILESTONES = {
  day: [1, 1000, 2500, 5000, 10000],
  week: [5000, 10000, 20000],
  month: [5000, 10000, 20000, 50000]
};

const LEAGUE_NAMES = ['Kingfishers', 'Herons', 'Falcons', 'Swifts'];

// name, college, registrations per day in August
const SAMPLE_PEOPLE = [
  ['Lerato Mokoena', 0, 2.8], ['Sipho Dlamini', 0, 6.4], ['Ayesha Patel', 0, 4.9], ['Johan van Wyk', 0, 3.1],
  ['Nomsa Khumalo', 0, 7.8], ['Kyle Adams', 0, 2.2], ['Thandeka Zulu', 0, 5.6], ['Ruan Pretorius', 0, 1.9],
  ['Fatima Hendricks', 0, 4.2], ['Bongani Mthembu', 0, 8.1], ['Chloe Naidoo', 0, 3.6], ['Tshepo Molefe', 0, 5.1],
  ['Zanele Ndlovu', 1, 6.9], ['Pieter Botha', 1, 2.5], ['Naledi Sithole', 1, 4.4], ['Craig Jacobs', 1, 3.3],
  ['Refilwe Maseko', 1, 7.2], ['Anele Cele', 1, 1.8], ['Megan Fourie', 1, 5.3], ['Kagiso Tau', 1, 3.9],
  ['Yusuf Ebrahim', 1, 2.7], ['Busisiwe Nkosi', 2, 4.7], ['Dylan Petersen', 2, 2.4], ['Karabo Radebe', 2, 6.1],
  ['Themba Kekana', 2, 3.5], ['Carmen Williams', 2, 1.7], ['Sibusiso Shabalala', 2, 5.4], ['Amahle Mahlangu', 2, 3.8],
  ['Grant Meyer', 2, 2.9], ['Precious Baloyi', 2, 4.1]
];

// Same seed gives the same numbers on every visit
function seededRandom(text) {
  let seed = 0;
  for (const character of text) seed = (seed * 31 + character.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundToFive = (value) => Math.round(value / 5) * 5;

const PEOPLE = SAMPLE_PEOPLE.map(([name, collegeIndex, august]) => {
  const random = seededRandom(name);
  const best = Math.max(3, Math.round(august * (1.7 + random() * 0.7)));

  const days = WORKDAYS.map((_, index) => {
    if (index === TODAY) return Math.round(august * SNAPSHOT.dayFraction * random() * 2.4);
    return Math.min(best, Math.max(0, Math.round(august * (0.35 + random() * 1.25))));
  });
  if (name === 'Lerato Mokoena') days[TODAY] = 2;

  const cashAugust = random() < 0.15 ? 0 : roundToFive(40 + random() * 900);
  const cash = WORKDAYS.map((_, index) => {
    if (!cashAugust || random() > (index === TODAY ? 0.15 : 0.4)) return 0;
    return roundToFive(cashAugust * (1 + random() * 3));
  });

  return {
    name,
    college: COLLEGES[collegeIndex],
    august,
    best,
    bestWeek: Math.max(best, Math.round(august * 5 * (1.15 + random() * 0.2))),
    bestMonth: Math.round(august * 20 * (0.95 + random() * 0.15)),
    cashAugust,
    cashBest: cashAugust ? roundToFive(cashAugust * (5 + random() * 8)) : 0,
    days,
    cash
  };
});

// Leagues group people with similar August averages
PEOPLE.slice()
  .sort((a, b) => a.august - b.august)
  .forEach((person, index) => {
    person.league = LEAGUE_NAMES[Math.min(LEAGUE_NAMES.length - 1, Math.floor(index / 8))];
  });

function findPerson(name) {
  return PEOPLE.find((person) => person.name === name) || PEOPLE[0];
}

function sumBetween(values, from, to) {
  let total = 0;
  for (let index = from; index <= to; index += 1) total += values[index];
  return total;
}

function figuresFor(person, periodKey) {
  const period = PERIODS[periodKey];
  const bests = { day: person.best, week: person.bestWeek, month: person.bestMonth };
  return {
    count: sumBetween(person.days, period.from, period.to),
    cash: sumBetween(person.cash, period.from, period.to),
    august: person.august * period.days,
    byNow: person.august * period.daysByNow,
    cashAugust: person.cashAugust * period.days,
    previousBest: bests[period.unit]
  };
}

function paceFor(figures, periodKey) {
  const { count, august, byNow, previousBest } = figures;
  const finished = periodKey === 'yesterday';
  if (count > previousBest) return { tone: 'best', text: 'New best' };
  if (count > 0 && count >= august) return { tone: 'good', text: 'Above August average' };
  if (!finished && count > 0 && count >= byNow) return { tone: 'good', text: 'Ahead of usual pace' };
  if (!finished && count > 0 && count >= byNow * 0.75) return { tone: 'info', text: 'On track' };
  if (count > 0) return { tone: 'waiting', text: finished ? 'Below August average' : 'Behind usual pace' };
  return { tone: 'waiting', text: finished ? 'No registrations' : 'No registrations yet' };
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIERS = [
  { count: 10, name: 'Diamond' },
  { count: 5, name: 'Gold' },
  { count: 3, name: 'Silver' },
  { count: 1, name: 'Bronze' }
];

function latestCardFor(person) {
  for (let index = TODAY; index >= 0; index -= 1) {
    const count = person.days[index];
    if (!count) continue;
    const tier = TIERS.find((level) => count >= level.count);
    const firstSale = tier.name === 'Bronze';
    return {
      tier: tier.name,
      count: firstSale ? 1 : count,
      unit: firstSale ? 'first registration' : 'registrations reached',
      label: firstSale ? 'First sale' : `${tier.count} sales`,
      // 1 September 2026 is a Tuesday
      date: `${WEEKDAY_NAMES[(WORKDAYS[index] + 1) % 7]} ${WORKDAYS[index]} September 2026`,
      status: index === TODAY ? 'Ready to send' : 'Sent'
    };
  }
  return null;
}

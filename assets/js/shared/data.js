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
// The last working days of August, so streaks can run back past 1 September
const AUGUST_DAYS = 12;
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
  const quiet = seededRandom(`${name} quiet days`);
  const best = Math.max(3, Math.round(august * (1.7 + random() * 0.7)));

  // Some days have no sales at all, which is what ends a streak
  const days = WORKDAYS.map((_, index) => {
    if (index === TODAY) return Math.round(august * SNAPSHOT.dayFraction * random() * 2.4);
    const count = Math.min(best, Math.max(0, Math.round(august * (0.35 + random() * 1.25))));
    return quiet() < 0.2 ? 0 : count;
  });
  const lateAugust = Array.from({ length: AUGUST_DAYS }, () => (quiet() < 0.2 ? 0 : Math.max(1, Math.round(august * (0.4 + quiet())))));
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
    lateAugust,
    cash
  };
});

// A few standout results so every kind of celebration has an example
(function addHighlights() {
  const bestDay = PEOPLE.find((person) => person.name === 'Sipho Dlamini');
  bestDay.days[TODAY - 1] = bestDay.best + 1;

  const bestMonth = PEOPLE.find((person) => person.name === 'Busisiwe Nkosi');
  bestMonth.bestMonth = bestMonth.days.reduce((sum, day) => sum + day, 0) - 4;

  const bestCash = PEOPLE.find((person) => person.name === 'Zanele Ndlovu');
  bestCash.cash[TODAY - 1] = bestCash.cashBest + 400;

  const platinum = PEOPLE.find((person) => person.name === 'Refilwe Maseko');
  platinum.best = Math.max(platinum.best, 18);
  platinum.days[TODAY - 1] = 15;

  const steady = PEOPLE.find((person) => person.name === 'Megan Fourie');
  [WEEK_START, WEEK_START + 1, WEEK_START + 2].forEach((index) => { steady.days[index] = Math.ceil(steady.august) + 1; });
  steady.days[TODAY] = Math.ceil(steady.august);

  // Streaks of 20, 10 and 5 working days reached today, plus a few still running
  const streak = (name, length, endDay = TODAY) => {
    const person = PEOPLE.find((someone) => someone.name === name);
    const history = [...person.lateAugust, ...person.days];
    const end = AUGUST_DAYS + endDay;
    for (let index = end - length + 1; index <= end; index += 1) history[index] = Math.max(1, history[index]);
    history[end - length] = 0;
    person.lateAugust = history.slice(0, AUGUST_DAYS);
    person.days = history.slice(AUGUST_DAYS);
  };
  streak('Nomsa Khumalo', 20);
  streak('Karabo Radebe', 10);
  streak('Kagiso Tau', 5);
  streak('Lerato Mokoena', 6);
  streak('Themba Kekana', 5, TODAY - 1);
})();

PEOPLE.forEach((person) => {
  person.cashBestWeek = roundToFive(person.cashBest * 1.6);
  person.bestMonthCash = roundToFive(person.cashAugust * 20 * 1.1);
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
  { count: 20, name: 'Black' },
  { count: 15, name: 'Platinum' },
  { count: 10, name: 'Diamond' },
  { count: 5, name: 'Gold' },
  { count: 3, name: 'Silver' },
  { count: 1, name: 'Bronze' }
];

// 1 September 2026 is a Tuesday
const dayName = (index) => `${WEEKDAY_NAMES[(WORKDAYS[index] + 1) % 7]} ${WORKDAYS[index]} September 2026`;
const slugFor = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const KIND_ORDER = { best: 0, streak: 1, cash: 2, sales: 3, steady: 4, incentive: 5, assist: 6 };
const STREAK_MILESTONES = [5, 10, 20];

// Working days in a row with at least one registration, counting back from a September day
function streakEnding(person, day) {
  const history = [...person.lateAugust, ...person.days];
  let length = 0;
  for (let index = AUGUST_DAYS + day; index >= 0 && history[index] > 0; index -= 1) length += 1;
  return length;
}

// Today only adds to a streak once there's a sale; an empty morning doesn't end it yet
function streakFor(person) {
  const current = person.days[TODAY] > 0 ? streakEnding(person, TODAY) : streakEnding(person, TODAY - 1);
  const longest = Math.max(...WORKDAYS.map((_, day) => streakEnding(person, day)));
  const next = STREAK_MILESTONES.find((milestone) => milestone > current) || null;
  return { current, longest, next, waitingToday: person.days[TODAY] === 0 && current > 0 };
}
const WEEK_LABEL = 'Monday 14 to Thursday 17 September 2026';
const rand = (value) => `R${Math.round(value).toLocaleString('en-ZA')}`;

const readTime = (day) => (day === TODAY ? `17 September at ${SNAPSHOT.time}` : '16 September at 17:02');

function dayWins(person, day) {
  const count = person.days[day];
  const cash = person.cash[day];
  const wins = [];

  if (count > person.best) {
    wins.push({ kind: 'best', title: 'New best day', value: count, unit: 'registrations in a day', detail: `Previous best day: ${person.best}` });
  }
  if (person.cashBest && cash > person.cashBest) {
    wins.push({ kind: 'best', title: 'Best cash day', value: cash, money: true, unit: 'cash recorded in a day', detail: `Previous best cash day: R${person.cashBest.toLocaleString('en-ZA')}` });
  }

  const tier = TIERS.find((level) => count >= level.count);
  if (tier) {
    const firstSale = tier.name === 'Bronze';
    wins.push({
      kind: 'sales',
      tier: tier.name,
      title: firstSale ? 'First sale · Bronze' : `${tier.count} sales · ${tier.name}`,
      value: firstSale ? 1 : count,
      unit: firstSale ? 'first registration' : 'registrations reached',
      detail: `${count} registration${count === 1 ? '' : 's'} in the day's snapshot`
    });
  }

  const streak = count > 0 ? streakEnding(person, day) : 0;
  if (STREAK_MILESTONES.includes(streak)) {
    wins.push({
      kind: 'streak',
      title: `${streak}-day streak`,
      value: streak,
      unit: 'working days in a row with a sale',
      detail: `A sale every working day for ${streak} days`
    });
  }

  const milestone = CASH_MILESTONES.day.slice().reverse().find((amount) => cash >= amount);
  if (milestone) {
    wins.push({
      kind: 'cash',
      title: milestone === 1 ? 'First payment' : `R${milestone.toLocaleString('en-ZA')} in a day`,
      value: cash,
      money: true,
      unit: 'cash recorded this day',
      detail: milestone === 1 ? 'Every rand counts' : `Reached the R${milestone.toLocaleString('en-ZA')} milestone`
    });
  }

  return wins.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

function monthWins(person) {
  const count = sumBetween(person.days, 0, TODAY);
  const cash = sumBetween(person.cash, 0, TODAY);
  const wins = [];
  if (count > person.bestMonth) {
    wins.push({ kind: 'best', title: 'Best month', value: count, unit: 'registrations this month so far', detail: `Previous whole-month best: ${person.bestMonth}` });
  }
  const milestone = CASH_MILESTONES.month.slice().reverse().find((amount) => cash >= amount);
  if (milestone) {
    wins.push({
      kind: 'cash',
      title: `R${milestone.toLocaleString('en-ZA')} this month`,
      value: cash,
      money: true,
      unit: 'cash recorded this month',
      detail: `Reached the R${milestone.toLocaleString('en-ZA')} milestone`
    });
  }
  if (person.bestMonthCash && cash > person.bestMonthCash) {
    wins.unshift({ kind: 'best', title: 'Best cash month', value: cash, money: true, unit: 'cash recorded this month so far', detail: `Previous whole-month cash best: ${rand(person.bestMonthCash)}` });
  }
  return wins.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

function weekWins(person) {
  const count = sumBetween(person.days, WEEK_START, TODAY);
  const cash = sumBetween(person.cash, WEEK_START, TODAY);
  const wins = [];

  if (count > person.bestWeek) {
    wins.push({ kind: 'best', title: 'Best week', value: count, unit: 'registrations this week', detail: `Previous best week: ${person.bestWeek}` });
  }
  if (person.cashBestWeek && cash > person.cashBestWeek) {
    wins.push({ kind: 'best', title: 'Best cash week', value: cash, money: true, unit: 'cash recorded this week', detail: `Previous best cash week: ${rand(person.cashBestWeek)}` });
  }

  const milestone = CASH_MILESTONES.week.slice().reverse().find((amount) => cash >= amount);
  if (milestone) {
    wins.push({ kind: 'cash', title: `${rand(milestone)} this week`, value: cash, money: true, unit: 'cash recorded this week', detail: `Reached the ${rand(milestone)} milestone` });
  }

  // Steady improvement: at or above the August daily average on at least 4 days this week
  const steadyDays = person.days.slice(WEEK_START, TODAY + 1).filter((day) => person.august > 0 && day >= person.august).length;
  if (steadyDays >= 4) {
    wins.push({ kind: 'steady', title: 'Steady progress', value: steadyDays, unit: 'days ahead of the August average this week', detail: `August daily average: ${person.august.toLocaleString('en-ZA')}` });
  }

  return wins.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

const cents = (value) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Like the current scoreboard: the card leads with the amount just recorded, then the week so far
function incentiveWin(person) {
  const incentives = incentivesFor(person);
  if (!incentives.total) return null;
  const [value, unit] = incentives.cash
    ? [incentives.cash, 'new cash incentive recorded']
    : incentives.enrolment ? [incentives.enrolment, 'new enrolment incentive recorded'] : [incentives.fees, 'new registration fee or referral recorded'];
  const breakdown = [`${cents(incentives.enrolment)} enrolment + ${cents(incentives.cash)} cash`];
  if (incentives.fees) breakdown.push(`${cents(incentives.fees)} other incentives`);
  breakdown.push('Recorded so far. Payment tracked separately.');
  return { kind: 'incentive', title: 'New staff incentive', value, money: true, unit, detail: `Your weekly total: ${cents(incentives.total)}`, breakdown };
}

// Follows the current scoreboard: unsent wins for the same person and day share one card,
// with the biggest personal best leading.
function dayCard(person, day, startingStatus) {
  const wins = dayWins(person, day);
  if (!wins.length) return null;
  return {
    id: `${slugFor(person.name)}-${WORKDAYS[day]}-september`,
    person: person.name,
    college: person.college,
    day,
    date: dayName(day),
    read: day === TODAY ? readTime(day) : `${WORKDAYS[day]} September at 17:02`,
    lead: wins[0],
    also: wins.slice(1).map((win) => win.title),
    startingStatus
  };
}

function buildCards() {
  const cards = [];

  PEOPLE.forEach((person) => {
    [TODAY, TODAY - 1].forEach((day) => {
      const lead = dayWins(person, day)[0];
      const status = !lead || day === TODAY || lead.kind === 'best'
        ? 'ready'
        : (WORKDAYS[day] + person.name.length) % 4 === 0 ? 'skipped' : 'sent';
      const card = dayCard(person, day, status);
      if (card) cards.push(card);
    });

    const addGroup = (wins, id, date, startingStatus = 'ready') => {
      if (!wins.length) return;
      cards.push({
        id: `${slugFor(person.name)}-${id}`,
        person: person.name,
        college: person.college,
        day: TODAY,
        date,
        read: readTime(TODAY),
        lead: wins[0],
        also: wins.slice(1).map((win) => win.title),
        startingStatus
      });
    };
    addGroup(weekWins(person), 'week-14-september', WEEK_LABEL);
    addGroup(monthWins(person), 'september-month', '1 to 17 September 2026');
    const incentive = incentiveWin(person);
    // Earnings already in the sheet aren't announced again, so only a few are new
    if (incentive) addGroup([incentive], 'incentive-14-september', INCENTIVE_WEEK, person.name.length % 4 === 0 ? 'ready' : 'sent');
  });

  // One card that was sent earlier today, where the person has kept going since
  const grown = cards.find((card) => card.date === dayName(TODAY) && card.lead.kind === 'sales' && card.lead.value >= 3);
  if (grown) grown.startingStatus = 'changed';

  return cards.sort((a, b) => KIND_ORDER[a.lead.kind] - KIND_ORDER[b.lead.kind] || b.lead.value - a.lead.value);
}

// Cards from earlier in the month, before the queue's two-day window. They were all sent at the time.
function pastCards() {
  const cards = [];
  PEOPLE.forEach((person) => {
    for (let day = 0; day < TODAY - 1; day += 1) {
      const card = dayCard(person, day, 'sent');
      if (card) cards.push({ ...card, status: 'sent' });
    }
  });
  return cards;
}

// The bigger moments of a day for the calendar: personal bests, streak milestones and Gold or higher
const CALENDAR_TIERS = ['Gold', 'Diamond', 'Platinum', 'Black'];

function milestonesOn(day) {
  return PEOPLE.flatMap((person) => dayWins(person, day)
    .filter((win) => win.kind === 'best' || win.kind === 'streak' || CALENDAR_TIERS.includes(win.tier))
    .map((win) => ({ person, win })));
}

// Everything one person could be celebrated for, one achievement per card
function achievementsFor(person) {
  const options = [];
  const add = (win, day, date, shortDate = 'this month') => options.push({
    id: `${slugFor(person.name)}-${slugFor(win.title)}-${slugFor(String(date))}`,
    person: person.name,
    college: person.college,
    date: day === null ? date : dayName(day),
    shortDate: day === null ? shortDate : `${WORKDAYS[day]} Sep`,
    read: readTime(day === null ? TODAY : day),
    lead: win,
    also: []
  });

  [TODAY, TODAY - 1].forEach((day) => {
    dayWins(person, day).forEach((win) => add(win, day, WORKDAYS[day]));
    add({ kind: 'sales', tier: 'Total', title: 'Day total', value: person.days[day], unit: 'registrations this day', detail: dayName(day) }, day, WORKDAYS[day]);
  });
  weekWins(person).forEach((win) => add(win, null, WEEK_LABEL, 'this week'));
  monthWins(person).forEach((win) => add(win, null, '1 to 17 September 2026'));
  const incentive = incentiveWin(person);
  if (incentive) add(incentive, null, INCENTIVE_WEEK, 'this week');
  add({
    kind: 'sales',
    tier: 'Total',
    title: 'Month so far',
    value: sumBetween(person.days, 0, TODAY),
    unit: 'registrations this month',
    detail: `Previous whole-month best: ${person.bestMonth}`
  }, null, '1 to 17 September 2026');

  // Personal bests first and plain totals last, like the card queue
  const rank = (card) => (card.lead.tier === 'Total' ? 9 : KIND_ORDER[card.lead.kind]);
  return options.sort((a, b) => rank(a) - rank(b));
}

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
      date: dayName(index),
      status: index === TODAY ? 'Ready to send' : 'Sent'
    };
  }
  return null;
}

// Weekly staff incentives, following the incentive sheet: the enrolment incentive uses
// debit-order registrations, and only the highest level reached is paid.
const INCENTIVE_LEVELS = [
  [25, 400], [30, 550], [35, 650], [40, 750], [45, 850], [50, 1000], [55, 1100], [60, 1200],
  [65, 1300], [70, 1400], [75, 1500], [80, 1600], [85, 1700], [90, 1800], [95, 1900], [100, 2000]
];

const INCENTIVE_WEEK = 'Monday 14 September to Friday 18 September 2026';

function incentivesFor(person) {
  const random = seededRandom(`${person.name} incentives`);
  const weekRegistrations = sumBetween(person.days, WEEK_START, TODAY);
  const qualifying = Math.round(weekRegistrations * (1.4 + random() * 1.2));
  const reached = INCENTIVE_LEVELS.filter(([count]) => qualifying >= count).pop();
  const next = INCENTIVE_LEVELS.find(([count]) => qualifying < count);
  const enrolment = reached ? reached[1] : 0;
  const cash = [0, 0, 150, 150, 300, 450][Math.floor(random() * 6)];
  const fees = random() < 0.3 ? 100 * (1 + Math.floor(random() * 3)) : 0;

  return {
    qualifying,
    enrolment,
    cash,
    fees,
    total: enrolment + cash + fees,
    paid: false,
    current: reached || null,
    next: next || null
  };
}

// Shout-outs already approved, so the board has something on it before anyone posts
const SAMPLE_SHOUTOUTS = [
  { from: 'Sipho Dlamini', to: 'Nomsa Khumalo', message: 'Twenty days in a row with a sale. That consistency is something else. Well done!', day: TODAY },
  { from: 'Megan Fourie', to: 'Zanele Ndlovu', message: 'Thanks for staying late to help me finish the paperwork for my students.', day: TODAY - 1 },
  { from: 'Karabo Radebe', to: 'Busisiwe Nkosi', message: 'Your tips on following up with parents really work. Two sign-ups from it already.', day: TODAY - 2 },
  { from: 'Chloe Naidoo', to: 'Bongani Mthembu', message: 'Always calm on the busy days and always happy to share a script. Appreciate you!', day: TODAY - 4 }
];

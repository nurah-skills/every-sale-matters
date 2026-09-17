# Sales Scoreboard

Every sale matters.

A scoreboard for the sales teams at Skills Academy, Matric College and Bellview. Consultants see their own progress, the team sees the whole group, and wins are turned into celebration cards for WhatsApp.

**Live site:** https://nurah-skills.github.io/every-sale-matters/

This is a working design. It shows the same measures as the current scoreboard, with made-up names and figures, and it isn’t connected to the real registration sheets yet.

## Trying it

1. Open the live site.
2. Select **Continue with demo account**, or choose **Create account** to try it with your own name and photo.
3. Sign out from the bottom of the menu.

On a phone the menu sits behind the menu button, and Home, Team, Cards and More run along the bottom of the screen.

## Pages

The pages follow the order of the menu.

### Main

| Page | What it does |
| --- | --- |
| `home.html` | One person’s progress. An at-a-glance strip (registrations, the next record, this week’s incentives, any sales streak), then registrations against their August average and usual pace, cash recorded, staff incentives, their latest celebration, their suggested league and the three colleges. |
| `team.html` | The whole group: totals, college totals and everyone’s results, with filters, sorting, grouping by college and your own row highlighted. Selecting a name opens their details. |

### Recognition

| Page | What it does |
| --- | --- |
| `cards.html` | Cards ready: celebration cards for sales levels (Bronze to Black), personal bests, cash milestones, streaks, steady progress, staff incentives and approved assists. Download, preview, copy the caption, mark as sent (with Undo) or skip. |
| `make.html` | Make a single card: choose a person and an achievement, add a cheer, pick a design or your own background, and add a photo with zoom and move controls. |
| `roundups.html` | A daily, weekly or monthly WhatsApp round-up for the whole team or one college. |
| `fame.html` | Wall of fame: every card sent this month, with filters by college, person and kind of card, this week’s highlights, and a September calendar of the bigger moments. |
| `streaks.html` | Who has made a sale on working days in a row, grouped by length, with the streak cards reached today and the longest streaks this month. |
| `shoutouts.html` | Send a short well done to a colleague. Once an admin approves it, it shows on the board. |

### Team health

| Page | What it does |
| --- | --- |
| `progress.html` | The four-week check: weekly registrations against the August average and a short survey on whether the scoreboard feels encouraging and fair. |
| `feedback.html` | Report a problem, share an idea or nominate a colleague for an assist, and see your own submissions and replies. |
| `admin.html` | An overview, the inbox (feedback, assists and shout-outs), the admin list and a button to reset the demo data. |

### Accounts

| Page | What it does |
| --- | --- |
| `index.html` | Sign in, or continue with the demo account. |
| `signup.html` | Create an account with a profile photo, name, job title and, optionally, a preferred name, mobile number and your name on the scoreboard. |

## How the demo saves things

There’s no database yet, so everything people do is saved in their own browser only:

- the signed-in person and their details (passwords are never kept)
- profile photos, which also go on that person’s cards
- card statuses (sent, skipped or ready)
- feedback, assist nominations and shout-outs, with admin replies
- approved assist cards, the admin list and the four-week check

Nothing is shared between devices. **Reset demo data** on the Admin page clears card statuses, feedback, assists, shout-outs, the admin list and the four-week check. It leaves the signed-in person and saved photos alone.

## Sample data

All names and figures are made up, so no real staff data is stored in this public repo. The sample month is 1 to 17 September 2026, with the figures read at 10:32 on Thursday 17 September. Some days have no sales and a few late-August days are included, so streaks start and end the way they would in real life.

The counting rules match the current scoreboard: a registration counts when a row has a salesperson’s name and either a student name or CRM ID, and “Cancelled” rows don’t count.

## Folders

```
*.html                 one file per page, kept at the top so the web addresses stay the same
assets/css/styles.css  all styles, in the same order as the menu
assets/img/            the logo, and colleges/ with the college logos used on cards
assets/js/shared/      used by several pages
  session.js           demo sign-in, sign-out and saved photos (loads first on every page)
  data.js              sample people, the calculations and the card rules
  app.js               menu, bottom bar, messages and small helpers for signed-in pages
  card-image.js        draws the WhatsApp card image and writes its caption
  auth.js              sign-in and create account buttons
assets/js/pages/       one script per page, named after the page
```

## Working on it

The site is plain HTML, CSS and JavaScript, with nothing to build.

To run it on your own computer, open a terminal in this folder and run:

```
npx.cmd serve .
```

Then open the address it shows. The first time, this downloads a small free web server from npm.

Changes pushed to the `main` branch go live on GitHub Pages within a few minutes.

## Still to do

- Connect the real registration and incentive sheets
- Real sign-in with approved work emails
- A shared database, so card statuses, feedback, shout-outs and photos are the same for everyone

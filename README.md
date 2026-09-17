# Sales Scoreboard

Every sale matters.

The registration scoreboard for Skills Academy, Matric College and Bellview.

Live site: https://nurah-skills.github.io/every-sale-matters/

## Pages

- `index.html` is the sign-in page.
- `signup.html` is the create account page. It asks for a profile photo, first name, surname and job title, plus an optional preferred name, mobile number and the person's name on the scoreboard, so their own results show first.
- `home.html` shows one person's progress: an at-a-glance strip (registrations and pace, the next record, this week's incentives), then registrations against their August average and usual pace, the next record, cash recorded, this week's staff incentives, their most recent celebration, their suggested league and the three colleges.
- `team.html` shows the whole group: totals, college totals and everyone's results with a bar against their August average and usual pace, quick filters (ahead, on track, behind, not started), optional grouping by college and your own row highlighted. Selecting a name opens their details. Below the table, Celebrate next shows new bests or the people closest to one.
- `cards.html` is the queue of celebration cards: sales levels from Bronze to Black, personal bests for registrations and cash, cash milestones, steady progress, staff incentives and approved assists. Each card can be previewed, downloaded as a 1080 × 1350 image for WhatsApp, have its caption copied, and be marked as sent or skipped. In the demo those statuses are saved in your browser only.
- `make.html` makes a single card: choose a person, one of the achievements their figures support, an optional cheer, a design (or your own background) and a photo of the salesperson with zoom and move controls, then download the image, share it or copy the caption. The photo someone adds when they create their account goes on their cards automatically, including in Cards ready. Backgrounds, photos you choose for one card and saved photos stay in the browser.
- `roundups.html` writes a daily, weekly or monthly WhatsApp round-up for the whole team or one college, with a summary alongside.
- `feedback.html` lets people report a problem, share an idea or nominate a colleague for an assist, and shows their own submissions and replies. In the demo, submissions are saved in your browser only.
- `progress.html` is the four-week check: weekly registrations against the August average, plus a short pulse survey on whether the scoreboard feels encouraging and fair.
- `admin.html` is for admins: an overview, the feedback inbox (reply, resolve, approve or decline assists), the admin list and a button to reset the demo data. Approving an assist adds a thank-you card to Cards ready.

On phones the menu moves behind a button, with Home, Team, Cards and More along the bottom of the screen.

Real accounts aren't set up yet. To look around, use **Continue with demo account** on the sign-in page, or fill in **Create account** to try it with your own name and photo. Those details stay in the browser and the password isn't kept. Sign out from the bottom of the menu.

## Figures

The measures are the same as the current scoreboard. The names and numbers are samples while the design is being settled, so no real staff data is stored in this repo. Connecting the real registration sheets is a later step.

## Folders

```
assets/css   styles
assets/js    session.js  demo sign-in, sign-out and saved photos
             auth.js     sign-in and create account pages
             signup.js   create account checks and photo
             data.js     sample people, the calculations and the card rules
             app.js      menu, signed-in person and formatting shared by signed-in pages
             home.js     home page
             team.js     team page
             card-image.js  the WhatsApp card image and caption, used by both card pages
             cards.js    cards ready page
             make.js     make a card page
             roundups.js round-ups page
             feedback.js feedback page
             progress.js our progress page
             admin.js    admin page
assets/img   logo, and colleges/ with the college logos used on cards
```

## Viewing it

Open `index.html` in a browser, or visit the live site.

# Sales Scoreboard

Every sale matters.

The registration scoreboard for Skills Academy, Matric College and Bellview.

Live site: https://nurah-skills.github.io/every-sale-matters/

## Pages

- `index.html` is the sign-in page.
- `signup.html` is the create account page. It asks for a profile photo, first name, surname and job title, plus an optional preferred name, mobile number and the person's name on the scoreboard, so their own results show first.
- `home.html` shows one person's progress: registrations against their August average and usual pace, the next record, cash recorded, this week's staff incentives, their most recent celebration, their suggested league and the three colleges.
- `team.html` shows the whole group: totals, college totals and everyone's results with a bar against their August average and usual pace, quick filters (ahead, on track, behind, not started), optional grouping by college and your own row highlighted. Selecting a name opens their details. Below the table, Celebrate next shows new bests or the people closest to one.
- `cards.html` is the queue of celebration cards: sales levels from Bronze to Black, personal bests for registrations and cash, cash milestones, steady progress, staff incentives and approved assists. Each card can be previewed, downloaded as a 1080 × 1350 image for WhatsApp, have its caption copied, and be marked as sent or skipped. In the demo those statuses are saved in your browser only.
- `make.html` makes a single card: choose a person, one of the achievements their figures support, an optional cheer, a design (or your own background) and an optional photo of the salesperson, then download the image, share it or copy the caption. Backgrounds and photos stay in the browser.
- `roundups.html` writes a daily, weekly or monthly WhatsApp round-up for the whole team or one college, with a summary alongside.
- `feedback.html` lets people report a problem, share an idea or nominate a colleague for an assist, and shows their own submissions and replies. In the demo, submissions are saved in your browser only.
- `progress.html` is the four-week check: weekly registrations against the August average, plus a short pulse survey on whether the scoreboard feels encouraging and fair.
- `admin.html` is for admins: an overview, the feedback inbox (reply, resolve, approve or decline assists), the admin list and a button to reset the demo data. Approving an assist adds a thank-you card to Cards ready.

Real accounts aren't set up yet. To look around, use **Continue with demo account** on the sign-in page, or fill in **Create account** to try it with your own name and photo. Those details stay in the browser and the password isn't kept. Sign out from the bottom of the menu.

## Figures

The measures are the same as the current scoreboard. The names and numbers are samples while the design is being settled, so no real staff data is stored in this repo. Connecting the real registration sheets is a later step.

## Folders

```
assets/css   styles
assets/js    session.js  demo sign-in and sign-out
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

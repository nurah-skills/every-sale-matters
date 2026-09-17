# Sales Scoreboard

Every sale matters.

The registration scoreboard for Skills Academy, Matric College and Bellview.

Live site: https://nurah-skills.github.io/every-sale-matters/

## Pages

- `index.html` is the sign-in page.
- `signup.html` is the create account page.
- `home.html` shows one person's progress: registrations against their August average and usual pace, the next record, cash recorded, this week's staff incentives, their most recent celebration, their suggested league and the three colleges.
- `team.html` shows the whole group: totals, college totals and everyone's results in a table you can search and sort.
- `cards.html` is the queue of celebration cards. Each card can be previewed, downloaded as a 1080 × 1350 image for WhatsApp, have its caption copied, and be marked as sent or skipped. In the demo those statuses are saved in your browser only.
- `make.html` makes a single card: choose a person, one of the achievements their figures support and an optional cheer, then download the image, share it or copy the caption.
- `roundups.html` writes a daily, weekly or monthly WhatsApp round-up for the whole team or one college, with a summary alongside.
- `feedback.html` lets people report a problem, share an idea or nominate a colleague for an assist, and shows their own submissions and replies. In the demo, submissions are saved in your browser only.
- `progress.html` is the four-week check: weekly registrations against the August average, plus a short pulse survey on whether the scoreboard feels encouraging and fair.
- `admin.html` is for admins: an overview, the feedback inbox (reply, resolve, approve or decline assists), the admin list and a button to reset the demo data. Approving an assist adds a thank-you card to Cards ready.

Real accounts aren't set up yet. To look around, use **Continue with demo account** on the sign-in page, and sign out from the bottom of the menu.

## Figures

The measures are the same as the current scoreboard. The names and numbers are samples while the design is being settled, so no real staff data is stored in this repo. Connecting the real registration sheets is a later step.

## Folders

```
assets/css   styles
assets/js    session.js  demo sign-in and sign-out
             auth.js     sign-in and create account pages
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
assets/img   logo
```

## Viewing it

Open `index.html` in a browser, or visit the live site.

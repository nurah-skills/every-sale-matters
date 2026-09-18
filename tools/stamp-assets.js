// GitHub Pages lets a browser hold a stylesheet or a script for ten minutes.
// Without this, a new page can load beside an old script and a control does nothing.
// Every asset link gets ?v= a short hash of that file, so a changed file is a new
// address and an unchanged one stays cached. Run it before every commit:
//
//   node tools/stamp-assets.js
//
// It prints what it changed, and says "nothing to stamp" when everything is current.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const pages = [
  ...fs.readdirSync(root).filter((name) => name.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'pages')).filter((name) => name.endsWith('.html')).map((name) => `pages/${name}`)
];

const stampOf = (assetPath) => {
  const file = path.join(root, assetPath);
  if (!fs.existsSync(file)) return null;
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
};

const changed = [];

pages.forEach((page) => {
  const file = path.join(root, page);
  const before = fs.readFileSync(file, 'utf8');
  const depth = page.includes('/') ? '../' : '';

  const after = before.replace(
    /((?:src|href)=")((?:\.\.\/)?assets\/[^"?]+\.(?:css|js|svg))(?:\?v=[a-f0-9]+)?(")/g,
    (whole, open, link, close) => {
      const assetPath = link.startsWith('../') ? link.slice(3) : link;
      const stamp = stampOf(assetPath);
      if (!stamp) return whole;
      return `${open}${depth}${assetPath}?v=${stamp}${close}`;
    }
  );

  if (after !== before) {
    fs.writeFileSync(file, after);
    changed.push(page);
  }
});

console.log(changed.length ? `Stamped: ${changed.join(', ')}` : 'Nothing to stamp — every page already points at the current files.');

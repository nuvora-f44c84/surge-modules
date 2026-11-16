const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['youtube-premium.js', 'premium-route.js'];
const source = files.map(file => fs.readFileSync(path.join(root, 'src/cf-autorank', file), 'utf8')).join('\n');
fs.writeFileSync(path.join(__dirname, 'YouTube-Premium-Route.js'), source);

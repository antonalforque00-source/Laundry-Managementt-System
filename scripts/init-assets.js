const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Created assets directory');
}

// A valid 1x1 transparent PNG base64 string
const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const pngBuffer = Buffer.from(minimalPngBase64, 'base64');

const files = [
  'favicon.png',
  'icon.png',
  'splash.png',
  'adaptive-icon.png'
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Created placeholder asset: assets/${file}`);
  } else {
    console.log(`Asset already exists: assets/${file}`);
  }
});

console.log('Expo assets initialized successfully!');

const fs = require('fs');
const path = require('path');

const distFile = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(distFile)) {
  console.log('ERROR: dist/index.html NO existe');
  process.exit(1);
}

const content = fs.readFileSync(distFile, 'utf8');
const sizeKB = Math.round(content.length / 1024);
const buildDate = fs.statSync(distFile).mtime.toLocaleString();

console.log('=== VERIFICACION dist/index.html ===');
console.log('Tamaño:', sizeKB + 'KB');
console.log('Fecha build:', buildDate);
console.log('DISPONIBLE en dist:', content.includes('DISPONIBLE') ? 'SI ✓' : 'NO ✗');
// CSS minified: can be repeat(1,1fr) or repeat(1, 1fr)
console.log('loterias-grid 1fr:', (content.includes('repeat(1, 1fr)') || content.includes('repeat(1,1fr)')) ? 'SI ✓' : 'NO ✗');
console.log('loterias-grid 2fr:', (content.includes('repeat(2, 1fr)') || content.includes('repeat(2,1fr)')) ? 'VIEJO ✗' : 'OK (no 2)');
console.log('viewport-fit=cover:', content.includes('viewport-fit=cover') ? 'SI ✓' : 'NO ✗');
console.log('width: 280px:', content.includes('280px') ? 'SI ✓' : 'NO ✗');

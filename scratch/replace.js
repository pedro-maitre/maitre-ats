const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  content = content.replace(/\[#c89650\]/g, 'maitre-gold');
  content = content.replace(/\[#b08040\]/g, 'maitre-gold-hover');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);

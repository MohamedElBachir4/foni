const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'app', 'admin'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find all fetch calls that look like fetch(..., { ... })
  // and add credentials: "include" if it's not already there.
  content = content.replace(/(fetch\([^,]+,\s*\{)([^}]+)\}/g, (match, p1, p2) => {
    if (!p2.includes('credentials')) {
      changed = true;
      return `${p1}${p2}, credentials: "include" }`;
    }
    return match;
  });

  // Handle fetch calls without options
  content = content.replace(/(fetch\([^,)]+\))(?!\s*,)/g, (match) => {
    changed = true;
    return match.replace(/\)$/, `, { credentials: "include" })`);
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});

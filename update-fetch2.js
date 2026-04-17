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
  
  // Fix misplaced credentials inside headers
  content = content.replace(/,\s*credentials:\s*"include"/g, '');
  content = content.replace(/, credentials: "include" \}/g, '}');
  content = content.replace(/\{ credentials: "include" \}/g, '');

  content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(headers:\s*(?:getAuthHeaders\(\)|\{.*?\})|method:\s*"[^"]+"|body:\s*[^,}]+)/g, "$1, credentials: 'include'");
  
  // Clean up duplicates if any
  content = content.replace(/,\s*credentials:\s*'include'\s*,\s*credentials:\s*'include'/g, ", credentials: 'include'");
  
  fs.writeFileSync(file, content);
});

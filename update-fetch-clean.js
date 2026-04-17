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
  let original = fs.readFileSync(file, 'utf8');
  let content = original;
  
  // Clean up ALL credentials
  content = content.replace(/,\s*credentials:\s*"include"/g, '');
  content = content.replace(/, credentials: "include"/g, '');
  content = content.replace(/,\s*credentials:\s*'include'/g, '');
  
  // Now explicitly add credentials: "include" to fetch options where getAuthHeaders or API_URL/api is used.
  // Instead of complex regex, let's just let getAuthHeaders() be the hook, but wait:
  // If we change getAuthHeaders() in adminAuth.ts to include the token AND credentials... Wait, getAuthHeaders returns Headers object! It can't include `credentials`.
  
  fs.writeFileSync(file, content);
});

console.log("Cleanup done.");

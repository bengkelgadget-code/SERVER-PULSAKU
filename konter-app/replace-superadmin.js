const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.sql')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      content = content.replace(/super_admin/g, 'superadmin');
      content = content.replace(/super_admin:/g, 'superadmin:');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

replaceInDir('./src');
replaceInDir('../konter-mobile/lib');
replaceInDir('../konter-mobile/services');
replaceInDir('../konter-mobile/contexts');
replaceInDir('../konter-mobile/app');
replaceInDir('./'); // this covers supabase_schema.sql, but we'll limit it to .sql files explicitly

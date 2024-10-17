/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const directoryPath = path.join(__dirname, '../dist');

function addJsExtensions(dirPath) {
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory does not exist: ${directoryPath}`);
    process.exit(1);
  }

  console.log(`Adding .js extension to files in: ${dirPath}`);

  // fs.readdirSync(dirPath).forEach((file) => {
  //   const filePath = path.join(dirPath, file);
  //   const stat = fs.statSync(filePath);

  //   if (stat.isDirectory()) {
  //     addJsExtensions(filePath);
  //   } else if (file.endsWith('.js')) {
  //     let content = fs.readFileSync(filePath, 'utf8');

  //     content = content.replace(
  //       /(import\s.*from\s['"`])(\.\/|\.\.\/)([^'"`]+)(['"`])/g,
  //       (match, p1, p2, p3, p4) => {
  //         return p1 + p2 + p3 + '.js' + p4; // Append .js extension
  //       }
  //     );

  //     fs.writeFileSync(filePath, content, 'utf8');
  //   }
  // });
}

addJsExtensions(directoryPath.slice(1));

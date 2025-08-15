import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), 'public', 'images', 'tmp');
const EXPIRE_MS = 60 * 60 * 1000; // 1시간

if (!fs.existsSync(TMP_DIR)) process.exit(0);

fs.readdirSync(TMP_DIR).forEach(file => {
  const filePath = path.join(TMP_DIR, file);
  const stat = fs.statSync(filePath);
  if (Date.now() - stat.mtimeMs > EXPIRE_MS) {
    fs.unlinkSync(filePath);
    console.log('임시파일 삭제:', filePath);
  }
}); 
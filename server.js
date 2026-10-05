import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const backendDir = path.resolve('backend');

if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
  console.log('📦 Installing backend dependencies on Render...');
  spawnSync(npmCmd, ['install'], { cwd: backendDir, stdio: 'inherit' });
}

console.log('🚀 Launching CampusCast backend server...');
const child = spawn(npmCmd, ['start'], { cwd: backendDir, stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

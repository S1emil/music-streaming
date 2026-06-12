const { execSync, spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

function startBackend() {
  console.log('\x1b[36m[Backend]\x1b[0m Starting...');
  const backend = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: isWindows,
  });
  return backend;
}

function startFrontend() {
  console.log('\x1b[32m[Frontend]\x1b[0m Starting...');
  const frontend = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: isWindows,
  });
  return frontend;
}

console.log('\x1b[35m╔══════════════════════════════════════╗\x1b[0m');
console.log('\x1b[35m║      MusicStream - Starting...       ║\x1b[0m');
console.log('\x1b[35m╚══════════════════════════════════════╝\x1b[0m');

const backend = startBackend();
const frontend = startFrontend();

process.on('SIGINT', () => {
  console.log('\n\x1b[33m[MusicStream]\x1b[0m Shutting down...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

backend.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m', err.message);
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[Frontend Error]\x1b[0m', err.message);
});

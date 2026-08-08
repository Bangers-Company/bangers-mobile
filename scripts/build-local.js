const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Default working directory for EAS local builds
// We use a directory in the home folder because /tmp is often a small tmpfs.
const easWorkingDir = process.env.EAS_LOCAL_BUILD_WORKINGDIR || path.join(os.homedir(), '.eas-build-local');

if (!fs.existsSync(easWorkingDir)) {
  fs.mkdirSync(easWorkingDir, { recursive: true });
}

console.log(`Using EAS_LOCAL_BUILD_WORKINGDIR=${easWorkingDir}`);

// Load .env file if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('EXPO_PUBLIC_')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

process.env.EAS_LOCAL_BUILD_WORKINGDIR = easWorkingDir;

// Command line arguments passed to script
const extraArgs = process.argv.slice(2);
// Use eas-cli package name so npx resolves correctly across all operating systems
const args = ['eas-cli', 'build', '--local', ...extraArgs];

const isWin = os.platform() === 'win32';
const command = isWin ? 'npx.cmd' : 'npx';

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: isWin,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to run eas build:', err);
  process.exit(1);
});

import { randomBytes, scryptSync } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';

// Password never goes into shell history, arguments, or terminal echo.
if (!process.stdin.isTTY) {
  console.error('Execute este comando em um terminal interativo.');
  process.exit(1);
}
process.stdout.write('Senha administrativa (entrada oculta): ');
emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
let password = '';
process.stdin.on('keypress', (text, key = {}) => {
  if (key.ctrl && key.name === 'c') {
    process.stdin.setRawMode(false);
    process.stdout.write('\n');
    process.exit(130);
  }
  if (key.name === 'return' || key.name === 'enter') {
    process.stdin.setRawMode(false);
    process.stdout.write('\n');
    if (password.length < 12) {
      console.error('Use uma senha de pelo menos 12 caracteres.');
      process.exit(1);
    }
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    password = '';
    console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${hash}`);
    console.log(`SESSION_SECRET=${randomBytes(48).toString('base64url')}`);
    process.exit(0);
  }
  if (key.name === 'backspace') password = password.slice(0, -1);
  else if (text && !key.ctrl && !key.meta) password += text;
});

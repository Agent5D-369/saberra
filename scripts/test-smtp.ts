import * as dotenv from 'dotenv';
dotenv.config();
import { SmtpService } from '../src/services/SmtpService';

async function main() {
  const to   = process.argv[2];
  if (!to) { console.error('Usage: npx ts-node scripts/test-smtp.ts <to-address>'); process.exit(1); }

  console.log(`Sending test email to ${to}...`);
  const smtp = new SmtpService();
  await smtp.sendEmail(to, 'Sera outbound test', [
    'This is an automated test from the Sera worker.',
    '',
    'If you received this, outbound email is working correctly.',
    '',
    `Sent: ${new Date().toISOString()}`,
    `Path: ${process.env.SMTP_HOST ? `SMTP via ${process.env.SMTP_HOST}` : 'Gmail API'}`,
  ].join('\n'));

  console.log('Done — email sent successfully.');
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });

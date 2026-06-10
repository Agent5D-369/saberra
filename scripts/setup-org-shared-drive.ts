/**
 * Verifies that roots@amora.cr can read a configured org Drive folder,
 * and lists its contents so you can confirm the folder structure looks right.
 *
 * CREATE THE SHARED DRIVE MANUALLY FIRST:
 *   1. Go to drive.google.com -> Shared drives -> New
 *   2. Name it "Amora Living Memory"
 *   3. Click the drive -> Manage members -> add roots@amora.cr as Manager
 *   4. Create subfolders: Brand Assets, Governance Docs, Meeting Assets,
 *      Marketing, Finance, Templates
 *   5. Copy the folder ID from the URL of the "Meeting Assets" folder
 *      (the long string after /folders/ in the URL)
 *   6. Set in Railway: ORG_SHARED_DRIVE_INBOX_FOLDER_ID=<that ID>
 *   7. Re-run this script to verify Sera can see it
 *
 * Usage: npx ts-node scripts/setup-org-shared-drive.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { getConfig } from '../src/config/ConfigService';
import { randomUUID } from 'crypto';

const DRIVE_NAME = 'Amora Living Memory';

const FOLDERS = [
  { name: 'Brand Assets',    desc: 'Logos, colors, fonts, brand guide, Canva exports' },
  { name: 'Governance Docs', desc: 'CCOS documents, circle charters, Living Constitution, policies' },
  { name: 'Meeting Assets',  desc: 'Sera copies accessible transcripts and notes here automatically' },
  { name: 'Marketing',       desc: 'Marketing plans, campaigns, outreach materials' },
  { name: 'Templates',       desc: 'Role card templates, circle charter templates, onboarding guides' },
  { name: 'Finance',         desc: 'Budgets, financial reports, funding documents (circle leads only)' },
];

async function verifyFolderAccess(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
): Promise<void> {
  // Try listing contents — confirms read access and shows what's already there
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields: 'files(id, name, mimeType)',
    pageSize: 20,
  });

  const files = res.data.files ?? [];
  if (files.length === 0) {
    console.log('  Folder is empty — ready for files.');
  } else {
    console.log(`  Contents (${files.length} items):`);
    files.forEach(f => console.log(`    ${f.mimeType?.includes('folder') ? '[folder]' : '[file]  '} ${f.name}`));
  }
}

async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string | null,
  desc: string,
): Promise<string> {
  const parentClause = parentId
    ? `and '${parentId}' in parents`
    : `and 'root' in parents`;

  const res = await drive.files.list({
    q: `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' ${parentClause} and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  if (res.data.files?.length) return res.data.files[0].id!;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      // Omit parents entirely for root-level folders (Drive API default = root)
      ...(parentId ? { parents: [parentId] } : {}),
      description: desc,
    },
    fields: 'id',
  });
  return created.data.id!;
}

async function setViewerAccess(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
): Promise<void> {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
      fields: 'id',
    });
  } catch {
    // Non-fatal
  }
}

async function main() {
  const config = getConfig();
  const auth = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth });

  const inboxFolderId = config.ORG_SHARED_DRIVE_INBOX_FOLDER_ID;
  const sharedDriveId = config.ORG_SHARED_DRIVE_ID;

  if (!inboxFolderId) {
    console.log('\nORG_SHARED_DRIVE_INBOX_FOLDER_ID is not set.\n');
    console.log('SETUP INSTRUCTIONS:');
    console.log('');
    console.log('1. Go to drive.google.com -> Shared drives -> New');
    console.log('   Name it "Amora Living Memory"');
    console.log('');
    console.log('2. Open the new Shared Drive -> Manage members');
    console.log('   Add roots@amora.cr as Manager');
    console.log('   Add each circle member as Content Manager');
    console.log('');
    console.log('3. Create these subfolders inside the Shared Drive:');
    FOLDERS.forEach(f => console.log(`   - ${f.name}  (${f.desc})`));
    console.log('');
    console.log('4. Click the "Meeting Assets" folder -> copy the ID from the URL');
    console.log('   URL looks like: drive.google.com/drive/folders/FOLDER_ID_HERE');
    console.log('');
    console.log('5. In Railway env vars, set:');
    console.log('   ORG_SHARED_DRIVE_INBOX_FOLDER_ID=<Meeting Assets folder ID>');
    console.log('   ORG_SHARED_DRIVE_ID=<the Shared Drive ID from the URL>');
    console.log('');
    console.log('6. Re-run this script to verify Sera can access the folder.');
    console.log('');
    console.log('7. In Claude Teams:');
    console.log('   claude.ai -> Settings -> Integrations -> Google Drive -> Reconnect');
    console.log('   Sign in as roots@amora.cr so Claude can see everything Sera sees.');
    return;
  }

  console.log(`\nVerifying Sera can access the org Drive inbox folder...`);
  console.log(`  Inbox folder ID: ${inboxFolderId}`);
  if (sharedDriveId) console.log(`  Shared Drive ID: ${sharedDriveId}`);

  try {
    await verifyFolderAccess(drive, inboxFolderId);
    console.log('\nAccess confirmed. Sera will automatically use this folder for Meeting Assets.');
    console.log(`URL: https://drive.google.com/drive/folders/${inboxFolderId}`);
  } catch (err: any) {
    console.error('\nCould not access folder:', err.message);
    console.error('Ensure roots@amora.cr is a Manager in the Shared Drive and the folder ID is correct.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Setup failed:', err.message ?? err);
  if (err.message?.includes('insufficientPermissions') || err.message?.includes('403')) {
    console.error('\nThe OAuth token does not have permission to create Shared Drives.');
    console.error('Go to Google Cloud Console -> OAuth consent screen -> Scopes');
    console.error('and ensure https://www.googleapis.com/auth/drive is authorized,');
    console.error('then re-run the OAuth flow to get a new refresh token.');
  }
  process.exit(1);
});

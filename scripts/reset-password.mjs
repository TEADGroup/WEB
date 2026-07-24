#!/usr/bin/env node
/**
 * reset-password.mjs — Reset user password
 *
 * Usage: node scripts/reset-password.mjs <email> <newPassword>
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Simple .env parser
async function loadEnv(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key.trim()] = value.trim();
      }
    });
    return env;
  } catch {
    return {};
  }
}

async function main() {
  const envWeb = await loadEnv(join(rootDir, 'apps', 'web', '.env'));
  const envRoot = await loadEnv(join(rootDir, '.env'));
  const env = { ...envRoot, ...envWeb };

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Usage: node scripts/reset-password.mjs <email> <newPassword>');
    process.exit(1);
  }

  try {
    // Get user ID
    const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    const listData = await listResponse.json();
    const user = listData.users?.find(u => u.email === email);

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`🔄 Resetting password for: ${email}`);

    // Update user password
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: newPassword,
        email_confirm: true
      })
    });

    if (updateResponse.ok) {
      console.log('✅ Password reset successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 New Password: ${newPassword}`);
    } else {
      const error = await updateResponse.text();
      console.error('❌ Failed to reset password:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

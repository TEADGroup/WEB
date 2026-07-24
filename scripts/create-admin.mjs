#!/usr/bin/env node
/**
 * create-admin.mjs — Create first admin user for TEA Group website
 *
 * Usage: node scripts/create-admin.mjs <email> <password>
 * Example: node scripts/create-admin.mjs admin@teagroup.vn YourSecurePassword123!
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
  // Load .env from apps/web (preferred) and root
  const envWeb = await loadEnv(join(rootDir, 'apps', 'web', '.env'));
  const envRoot = await loadEnv(join(rootDir, '.env'));
  const env = { ...envRoot, ...envWeb };

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  // Get email and password from command line
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('❌ Usage: node scripts/create-admin.mjs <email> <password>');
    console.error('   Example: node scripts/create-admin.mjs admin@teagroup.vn YourSecurePassword123!');
    process.exit(1);
  }

  try {
    console.log(`🔐 Creating admin user: ${email}`);

    // First, check if user exists
    const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list users: ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const existingUser = listData.users?.find(u => u.email === email);

    let userId;

    if (existingUser) {
      console.log(`ℹ️  User already exists: ${email}`);
      userId = existingUser.id;
    } else {
      // Create user via Supabase Admin API
      const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: 'Admin User'
          }
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create user: ${error}`);
      }

      const userData = await createResponse.json();
      userId = userData.id;
      console.log(`✅ User created in Auth: ${userId}`);
    }

    // Create or update profile with admin role
    const profileCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    const profiles = await profileCheck.json();

    if (profiles && profiles.length > 0) {
      // Update existing profile
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          role: 'admin'
        })
      });

      if (updateResponse.ok) {
        console.log('✅ User promoted to admin successfully!');
      } else {
        console.error('⚠️  Failed to update profile (you may need to do it manually in SQL)');
      }
    } else {
      // Create new profile
      const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: userId,
          email: email,
          full_name: 'Admin User',
          role: 'admin'
        })
      });

      if (createProfileResponse.ok) {
        console.log('✅ Admin profile created successfully!');
      } else {
        const error = await createProfileResponse.text();
        console.error('⚠️  Failed to create profile:', error);
        console.log('💡 You may need to create the profile manually in Supabase Studio SQL Editor:');
        console.log(`   insert into public.profiles (id, email, full_name, role) values ('${userId}', '${email}', 'Admin User', 'admin');`);
      }
    }

    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/vi/login');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

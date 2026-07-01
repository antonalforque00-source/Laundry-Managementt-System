import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'supabase-config.json');
if (!fs.existsSync(configPath)) {
  console.error("supabase-config.json does not exist");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log("Supabase URL:", config.supabaseUrl);

const client = createClient(config.supabaseUrl, config.supabaseKey);

async function test() {
  const tables = ["users", "orders", "inventory", "audit_logs", "feedbacks"];
  for (const table of tables) {
    console.log(`Checking table: ${table}...`);
    try {
      const res = await client.from(table).select("id").limit(1);
      if (res.error) {
        console.log(`Table ${table} error:`, res.error);
      } else {
        console.log(`Table ${table} verified! Data count inside query:`, res.data.length);
      }
    } catch (err) {
      console.error(`Table ${table} exception:`, err);
    }
  }
}

test();

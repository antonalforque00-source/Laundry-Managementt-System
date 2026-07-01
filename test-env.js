console.log("Keys in process.env related to Supabase:");
for (const key of Object.keys(process.env)) {
  if (key.toLowerCase().includes("supabase")) {
    console.log(`${key}: ${process.env[key] ? 'exists (length: ' + process.env[key].length + ')' : 'empty'}`);
  }
}

/**
 * DevPad DB Cleanup Script
 * Removes unused `resetToken` and `resetTokenExpiry` fields from all User documents.
 * Run once from the project root:  node server/scripts/cleanupDB.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  const result = await mongoose.connection.collection('users').updateMany(
    {},
    { $unset: { resetToken: '', resetTokenExpiry: '' } }
  );

  console.log(`Users updated: ${result.modifiedCount}`);
  console.log('Removed fields: resetToken, resetTokenExpiry');
  console.log('\nDone — safe to run again anytime (idempotent).');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

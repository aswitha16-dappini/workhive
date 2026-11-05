import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, maskMongoUri } from './config/db.js';

// Resolve directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory reliably
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URI;

console.log('====================================================');
console.log('🐝 WorkHive MongoDB Atlas Connection Diagnostics');
console.log('====================================================');
console.log(`Target Database : workhive`);
console.log(`Target Cluster  : WorkHiveCluster`);
console.log(`Configured URI  : ${maskMongoUri(configuredUri)}`);
console.log('====================================================');

const test = async () => {
  const isConnected = await connectDB();

  if (isConnected) {
    try {
      const admin = mongoose.connection.db.admin();
      const pingResult = await admin.ping();
      console.log('📡 Atlas Ping Check:', pingResult.ok === 1 ? 'OK (Responsive)' : 'Failed');
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📁 Collections in 'workhive': ${collections.length === 0 ? 'None yet (clean)' : collections.map(c => c.name).join(', ')}`);
      console.log('====================================================');
      console.log('🎉 CONNECTION TEST PASSED! Ready for data models.');
      console.log('====================================================');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Error during post-connection checks:', err.message);
      await mongoose.disconnect();
      process.exit(0);
    }
  } else {
    console.log('====================================================');
    console.log('⚠️  CONNECTION TEST PENDING:');
    console.log('   Please check that server/.env has your valid Atlas username,');
    console.log('   password, and cluster address, and that Network Access in');
    console.log('   MongoDB Atlas allows connections from your IP.');
    console.log('====================================================');
    process.exit(1);
  }
};

test();

import dns from 'dns';
import mongoose from 'mongoose';

// Configure DNS: prefer IPv4 and use reliable public DNS on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback gracefully if environment restricts dns modification
}

/**
 * Safely masks database credentials in a MongoDB connection URI.
 * Example: mongodb+srv://user:secret@cluster... -> mongodb+srv://user:****@cluster...
 */
export const maskMongoUri = (uri) => {
  if (!uri) return 'Not configured';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1****$3');
};

/**
 * Connect to MongoDB Atlas via Mongoose
 */
export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.error('❌ MONGO_URI is not defined in your server/.env file.');
    return false;
  }

  // Check if placeholder is still present
  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.warn(
      '⚠️  MongoDB Atlas URI contains placeholder credentials (<username>/<password>).\n' +
      '   Please enter your real Atlas credentials in server/.env to establish a connection.'
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'workhive', // Explicitly targets the workhive database
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of hanging 30s on bad credentials
    });

    console.log(`✅ MongoDB Atlas Connected!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Target URI: ${maskMongoUri(uri)}`);
    return true;
  } catch (error) {
    // Sanitize any password that might appear inside Mongoose error messages
    const safeErrorMsg = error.message.replace(/(:\/\/[^:]+:)([^@]+)(@)/g, '$1****$3');
    console.error(`❌ MongoDB Connection Failed: ${safeErrorMsg}`);
    if (error.reason && error.reason.servers) {
      console.error('🔍 Server connection details:');
      for (const [server, desc] of error.reason.servers.entries()) {
        const descMsg = desc.error ? desc.error.message : desc.type;
        console.error(`   - ${server}: ${descMsg}`);
      }
    }
    return false;
  }
};

/**
 * Returns current Mongoose connection status
 */
export const getDatabaseStatus = () => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateCode = mongoose.connection.readyState;
  const isConnected = stateCode === 1;
  const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  return {
    stateCode,
    status: states[stateCode] || 'Unknown',
    isConnected,
    host: isConnected ? mongoose.connection.host : null,
    databaseName: isConnected ? mongoose.connection.name : 'workhive',
    maskedUri: maskMongoUri(configuredUri),
  };
};

import { MongoClient } from "mongodb";
import dns from "dns";

// Ensure DNS resolution for SRV records works reliably across Windows/ISP networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in restricted environments
}

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise = null;

if (uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;

export async function getDatabase(dbName = "data") {
  const currentUri = process.env.MONGODB_URI;
  if (!currentUri || (!currentUri.startsWith("mongodb://") && !currentUri.startsWith("mongodb+srv://"))) {
    return null;
  }

  try {
    if (!clientPromise) {
      client = new MongoClient(currentUri, options);
      clientPromise = client.connect();
    }
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    return null;
  }
}

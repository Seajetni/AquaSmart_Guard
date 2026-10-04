import { MongoClient } from "mongodb";
import dns from "dns";

const options = {
  serverSelectionTimeoutMS: 5000,
};

// Helper to resolve mongodb+srv:// URIs using public DNS servers (8.8.8.8, 1.1.1.1)
// This resolves the common "querySrv ECONNREFUSED" error on Windows and ISP routers
async function normalizeMongoUri(rawUri) {
  if (!rawUri || !rawUri.startsWith("mongodb+srv://")) {
    return rawUri;
  }

  try {
    const url = new URL(rawUri.replace("mongodb+srv://", "http://"));
    const hostname = url.hostname;
    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

    const [srvRecords, txtRecords] = await Promise.all([
      resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
      resolver.resolveTxt(hostname).catch(() => []),
    ]);

    if (srvRecords && srvRecords.length > 0) {
      const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
      const auth = url.username
        ? `${url.username}${url.password ? `:${url.password}` : ""}@`
        : "";
      const pathname = url.pathname || "/";

      const searchParams = new URLSearchParams(url.search);
      searchParams.set("ssl", "true");

      if (txtRecords && txtRecords.length > 0) {
        const txtStr = txtRecords.map((t) => t.join("")).join("&");
        const txtParams = new URLSearchParams(txtStr);
        for (const [key, value] of txtParams) {
          if (!searchParams.has(key)) searchParams.set(key, value);
        }
      }

      return `mongodb://${auth}${hosts}${pathname}?${searchParams.toString()}`;
    }
  } catch (err) {
    console.warn("SRV DNS fallback resolution warning:", err.message);
  }

  return rawUri;
}

async function connectToMongo(uri) {
  const resolvedUri = await normalizeMongoUri(uri);
  const client = new MongoClient(resolvedUri, options);
  return await client.connect();
}

let clientPromise = null;

export default clientPromise;

export async function getDatabase(dbName = "data") {
  const currentUri = process.env.MONGODB_URI;
  if (!currentUri || (!currentUri.startsWith("mongodb://") && !currentUri.startsWith("mongodb+srv://"))) {
    return null;
  }

  try {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connectToMongo(currentUri).catch((err) => {
        // Clear cached promise on failure so future requests can retry
        global._mongoClientPromise = null;
        throw err;
      });
    }
    const connectedClient = await global._mongoClientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    return null;
  }
}

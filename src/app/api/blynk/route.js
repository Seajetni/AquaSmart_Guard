import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_BLYNK_TOKEN = process.env.BLYNK_TOKEN || "";
const LOG_INTERVAL_MS = 60 * 60 * 1000; // 1 ชั่วโมง (3,600,000 ms)
let lastLoggedTime = 0;

function parsePinValue(rawText, fallback = 0) {
  if (rawText === null || rawText === undefined) return fallback;
  try {
    // Strip quotes or array brackets if returned as JSON string
    const cleanStr = String(rawText).replace(/[\[\]"]/g, "").trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? fallback : num;
  } catch {
    return fallback;
  }
}

async function fetchBlynkPin(token, pin) {
  const url = `https://blynk.cloud/external/api/get?token=${token}&${pin}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, status: res.status, raw: null };
    }
    const text = await res.text();
    return { ok: true, raw: text.trim() };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, error: err.message, raw: null };
  }
}

async function checkHardwareConnected(token) {
  const url = `https://blynk.cloud/external/api/isHardwareConnected?token=${token}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, isHardwareConnected: false, status: res.status, raw: null };
    }
    const text = (await res.text()).trim().toLowerCase();
    const isOnline = text === "true";
    return { ok: true, isHardwareConnected: isOnline, raw: text };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, isHardwareConnected: false, error: err.message, raw: null };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || process.env.BLYNK_TOKEN || DEFAULT_BLYNK_TOKEN;

  try {
    // V0 = Temperature, V1 = TDS, V2 = pH, plus isHardwareConnected for ESP32 online/offline check
    const [v0Res, v1Res, v2Res, hwRes] = await Promise.all([
      fetchBlynkPin(token, "V0"),
      fetchBlynkPin(token, "V1"),
      fetchBlynkPin(token, "V2"),
      checkHardwareConnected(token),
    ]);

    const isConnected = v0Res.ok || v1Res.ok || v2Res.ok;
    const isHardwareOnline = hwRes.isHardwareConnected;

    const temp = v0Res.ok ? parsePinValue(v0Res.raw, 25.0) : null;
    const tds = v1Res.ok ? parsePinValue(v1Res.raw, 200) : null;
    const ph = v2Res.ok ? parsePinValue(v2Res.raw, 7.0) : null;

    // Asynchronously log to MongoDB sensor_logs if valid reading (rate limit: once per 1 hour)
    const nowMs = Date.now();
    if (isConnected && nowMs - lastLoggedTime > LOG_INTERVAL_MS) {
      lastLoggedTime = nowMs;
      getDatabase()
        .then(async (db) => {
          if (!db) return;
          // Verify with latest DB record to ensure at least 1 hour between logs even across server restarts
          const latestLog = await db.collection("sensor_logs").findOne({}, { sort: { timestamp: -1 } });
          if (latestLog && nowMs - new Date(latestLog.timestamp).getTime() < LOG_INTERVAL_MS) {
            lastLoggedTime = new Date(latestLog.timestamp).getTime();
            return;
          }

          await db.collection("sensor_logs").insertOne({
            timestamp: new Date(),
            ph: ph ?? 7.0,
            ppm: tds ?? 0,
            temp: temp ?? 25.0,
            isHardwareConnected: isHardwareOnline,
          });
        })
        .catch((e) => console.warn("Auto-log to MongoDB failed:", e.message));
    }

    return NextResponse.json(
      {
        success: isConnected,
        connected: isConnected,
        isHardwareConnected: isHardwareOnline,
        hardwareStatus: isHardwareOnline ? "online" : "offline",
        temp,
        tds,
        ph,
        raw: {
          v0: v0Res.raw,
          v1: v1Res.raw,
          v2: v2Res.raw,
          hardware: hwRes.raw,
        },
        timestamp: new Date().toISOString(),
        errors: {
          v0: v0Res.ok ? null : (v0Res.error || `HTTP ${v0Res.status}`),
          v1: v1Res.ok ? null : (v1Res.error || `HTTP ${v1Res.status}`),
          v2: v2Res.ok ? null : (v2Res.error || `HTTP ${v2Res.status}`),
          hardware: hwRes.ok ? null : (hwRes.error || `HTTP ${hwRes.status}`),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        isHardwareConnected: false,
        hardwareStatus: "error",
        error: err.message || "Failed to fetch Blynk data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

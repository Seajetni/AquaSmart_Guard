import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        data: [],
      });
    }

    const logs = await db
      .collection("sensor_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 100))
      .toArray();

    // Reverse to display chronologically (oldest to newest) on chart
    const sortedLogs = logs.reverse();

    return NextResponse.json({
      success: true,
      dbConnected: true,
      count: sortedLogs.length,
      data: sortedLogs,
    });
  } catch (err) {
    console.error("GET /api/logs error:", err);
    return NextResponse.json(
      { success: false, error: err.message, data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ph, ppm, temp, isHardwareConnected } = body;

    if (ph === undefined && ppm === undefined && temp === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing sensor parameters" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        { success: false, dbConnected: false, message: "Database not connected" },
        { status: 503 }
      );
    }

    const entry = {
      timestamp: new Date(),
      ph: typeof ph === "number" ? Number(ph.toFixed(2)) : parseFloat(ph) || 7.0,
      ppm: typeof ppm === "number" ? Math.round(ppm) : parseInt(ppm, 10) || 0,
      temp: typeof temp === "number" ? Number(temp.toFixed(2)) : parseFloat(temp) || 25.0,
      isHardwareConnected: isHardwareConnected ?? true,
    };

    const result = await db.collection("sensor_logs").insertOne(entry);

    return NextResponse.json({
      success: true,
      insertedId: result.insertedId,
      data: entry,
    });
  } catch (err) {
    console.error("POST /api/logs error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

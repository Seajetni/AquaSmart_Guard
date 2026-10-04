import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range"); // "minute" | "hour" | "day" | "week" | "month"
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        range: range || "default",
        data: [],
      });
    }

    const collection = db.collection("sensor_logs");

    // Default mode (legacy compatibility when range is not specified)
    if (!range || range === "default") {
      const logs = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 100))
        .toArray();

      const sortedLogs = logs.reverse();
      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "default",
        count: sortedLogs.length,
        data: sortedLogs,
      });
    }

    // 1. Minute mode: recent points with time formatting
    if (range === "minute") {
      const logs = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 50))
        .toArray();

      const sortedLogs = logs.reverse();
      const points = sortedLogs.map((log) => {
        const d = new Date(log.timestamp);
        const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
        return {
          id: String(log._id),
          label: timeStr,
          timestamp: log.timestamp,
          ph: Number(Number(log.ph).toFixed(2)),
          ppm: Math.round(Number(log.ppm) || 0),
          temp: Number(Number(log.temp).toFixed(1)),
        };
      });

      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "minute",
        count: points.length,
        data: points,
      });
    }

    // 2. Hour mode: aggregate by year-month-day-hour (+07:00 Thailand time)
    if (range === "hour") {
      const hourAgg = await collection
        .aggregate([
          {
            $group: {
              _id: {
                year: { $year: { date: "$timestamp", timezone: "+07:00" } },
                month: { $month: { date: "$timestamp", timezone: "+07:00" } },
                day: { $dayOfMonth: { date: "$timestamp", timezone: "+07:00" } },
                hour: { $hour: { date: "$timestamp", timezone: "+07:00" } },
              },
              avgPh: { $avg: "$ph" },
              avgPpm: { $avg: "$ppm" },
              avgTemp: { $avg: "$temp" },
              count: { $sum: 1 },
              latestTime: { $max: "$timestamp" },
            },
          },
          { $sort: { latestTime: 1 } },
          { $limit: 48 },
        ])
        .toArray();

      const points = hourAgg.map((h) => {
        const d = new Date(h.latestTime);
        const dateStr = `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
        const timeStr = `${String(d.getHours()).padStart(2, "0")}:00`;
        return {
          label: `${dateStr} ${timeStr}`,
          shortLabel: timeStr,
          timestamp: h.latestTime,
          ph: Number(Number(h.avgPh).toFixed(2)),
          ppm: Math.round(Number(h.avgPpm) || 0),
          temp: Number(Number(h.avgTemp).toFixed(1)),
          count: h.count,
        };
      });

      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "hour",
        count: points.length,
        data: points,
      });
    }

    // 3. Day mode: aggregate by year-month-day (+07:00 Thailand time)
    if (range === "day") {
      const dayAgg = await collection
        .aggregate([
          {
            $group: {
              _id: {
                year: { $year: { date: "$timestamp", timezone: "+07:00" } },
                month: { $month: { date: "$timestamp", timezone: "+07:00" } },
                day: { $dayOfMonth: { date: "$timestamp", timezone: "+07:00" } },
              },
              avgPh: { $avg: "$ph" },
              avgPpm: { $avg: "$ppm" },
              avgTemp: { $avg: "$temp" },
              count: { $sum: 1 },
              latestTime: { $max: "$timestamp" },
            },
          },
          { $sort: { latestTime: 1 } },
          { $limit: 31 },
        ])
        .toArray();

      const points = dayAgg.map((item) => {
        const d = new Date(item.latestTime);
        const label = `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
        return {
          label,
          shortLabel: label,
          timestamp: item.latestTime,
          ph: Number(Number(item.avgPh).toFixed(2)),
          ppm: Math.round(Number(item.avgPpm) || 0),
          temp: Number(Number(item.avgTemp).toFixed(1)),
          count: item.count,
        };
      });

      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "day",
        count: points.length,
        data: points,
      });
    }

    // 4. Week mode: aggregate by ISO week (+07:00 Thailand time)
    if (range === "week") {
      const weekAgg = await collection
        .aggregate([
          {
            $group: {
              _id: {
                isoWeekYear: { $isoWeekYear: { date: "$timestamp", timezone: "+07:00" } },
                isoWeek: { $isoWeek: { date: "$timestamp", timezone: "+07:00" } },
              },
              avgPh: { $avg: "$ph" },
              avgPpm: { $avg: "$ppm" },
              avgTemp: { $avg: "$temp" },
              count: { $sum: 1 },
              minTime: { $min: "$timestamp" },
              maxTime: { $max: "$timestamp" },
            },
          },
          { $sort: { minTime: 1 } },
          { $limit: 16 },
        ])
        .toArray();

      const points = weekAgg.map((w) => {
        const minD = new Date(w.minTime);
        const maxD = new Date(w.maxTime);
        const label = `${minD.getDate()} ${THAI_MONTHS[minD.getMonth()]} - ${maxD.getDate()} ${THAI_MONTHS[maxD.getMonth()]}`;
        return {
          label: `สัปดาห์ ${label}`,
          shortLabel: `${minD.getDate()} ${THAI_MONTHS[minD.getMonth()]}`,
          timestamp: w.maxTime,
          ph: Number(Number(w.avgPh).toFixed(2)),
          ppm: Math.round(Number(w.avgPpm) || 0),
          temp: Number(Number(w.avgTemp).toFixed(1)),
          count: w.count,
        };
      });

      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "week",
        count: points.length,
        data: points,
      });
    }

    // 5. Month mode: aggregate by year-month (+07:00 Thailand time)
    if (range === "month") {
      const monthAgg = await collection
        .aggregate([
          {
            $group: {
              _id: {
                year: { $year: { date: "$timestamp", timezone: "+07:00" } },
                month: { $month: { date: "$timestamp", timezone: "+07:00" } },
              },
              avgPh: { $avg: "$ph" },
              avgPpm: { $avg: "$ppm" },
              avgTemp: { $avg: "$temp" },
              count: { $sum: 1 },
              latestTime: { $max: "$timestamp" },
            },
          },
          { $sort: { latestTime: 1 } },
          { $limit: 24 },
        ])
        .toArray();

      const points = monthAgg.map((m) => {
        const d = new Date(m.latestTime);
        const label = `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
        return {
          label,
          shortLabel: THAI_MONTHS[d.getMonth()],
          timestamp: m.latestTime,
          ph: Number(Number(m.avgPh).toFixed(2)),
          ppm: Math.round(Number(m.avgPpm) || 0),
          temp: Number(Number(m.avgTemp).toFixed(1)),
          count: m.count,
        };
      });

      return NextResponse.json({
        success: true,
        dbConnected: true,
        range: "month",
        count: points.length,
        data: points,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid range parameter" },
      { status: 400 }
    );
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

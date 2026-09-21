import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  tankId: "main_tank",
  tankName: "ตู้ปลาหลัก (Main Tank)",
  speciesName: "มาตรฐานน้ำจืดทั่วไป (General Freshwater)",
  phMin: 6.5,
  phMax: 7.5,
  ppmMin: 150,
  ppmMax: 300,
  tempMin: 26.0,
  tempMax: 28.5,
  tips: ["ดูแลคุณภาพน้ำและเปลี่ยนถ่ายน้ำสม่ำเสมอ"],
};

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        data: DEFAULT_SETTINGS,
        message: "Database not connected, using defaults",
      });
    }

    const settings = await db.collection("tank_settings").findOne({ tankId: "main_tank" });
    if (!settings) {
      return NextResponse.json({
        success: true,
        dbConnected: true,
        data: DEFAULT_SETTINGS,
        message: "No custom settings found, returned defaults",
      });
    }

    return NextResponse.json({
      success: true,
      dbConnected: true,
      data: settings,
    });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      {
        success: false,
        dbConnected: false,
        error: err.message,
        data: DEFAULT_SETTINGS,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { speciesName, phMin, phMax, ppmMin, ppmMax, tempMin, tempMax, tips, tankName } = body;

    const payload = {
      tankId: "main_tank",
      tankName: tankName || "ตู้ปลาหลัก (Main Tank)",
      speciesName: speciesName || DEFAULT_SETTINGS.speciesName,
      phMin: typeof phMin === "number" ? phMin : parseFloat(phMin) || DEFAULT_SETTINGS.phMin,
      phMax: typeof phMax === "number" ? phMax : parseFloat(phMax) || DEFAULT_SETTINGS.phMax,
      ppmMin: typeof ppmMin === "number" ? ppmMin : parseFloat(ppmMin) || DEFAULT_SETTINGS.ppmMin,
      ppmMax: typeof ppmMax === "number" ? ppmMax : parseFloat(ppmMax) || DEFAULT_SETTINGS.ppmMax,
      tempMin: typeof tempMin === "number" ? tempMin : parseFloat(tempMin) || DEFAULT_SETTINGS.tempMin,
      tempMax: typeof tempMax === "number" ? tempMax : parseFloat(tempMax) || DEFAULT_SETTINGS.tempMax,
      tips: Array.isArray(tips) ? tips : DEFAULT_SETTINGS.tips,
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          dbConnected: false,
          message: "Database connection unavailable",
        },
        { status: 503 }
      );
    }

    await db.collection("tank_settings").updateOne(
      { tankId: "main_tank" },
      { $set: payload },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "บันทึกเกณฑ์และข้อมูลตู้ปลาลง MongoDB สำเร็จ",
      data: payload,
    });
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

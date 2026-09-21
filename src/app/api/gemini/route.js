import { NextResponse } from "next/server";

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// Curated offline knowledge fallback in case of network or quota issues
const FALLBACK_FISH_DB = [
  {
    keys: ["เทวดา", "angel"],
    speciesName: "ปลาเทวดา (Angelfish)",
    phMin: 6.5,
    phMax: 7.2,
    ppmMin: 100,
    ppmMax: 200,
    tempMin: 26.0,
    tempMax: 29.0,
    tips: [
      "ชอบน้ำค่อนข้างนุ่มและเป็นกรดอ่อนๆ ควรมีไม้น้ำทรงสูงในตู้เพื่อเลียนแบบธรรมชาติ",
      "ระวังไม่เลี้ยงรวมกับปลาขนาดเล็กมาก เช่น ลูกปลานีออน เพราะอาจโดนกินเป็นอาหารได้",
      "ไวต่อการเปลี่ยนแปลงอุณหภูมิเฉียบพลัน ควรใช้ฮีตเตอร์ควบคุมให้คงที่",
    ],
  },
  {
    keys: ["คาร์ฟ", "koi"],
    speciesName: "ปลาคาร์ฟ (Koi)",
    phMin: 7.2,
    phMax: 8.0,
    ppmMin: 200,
    ppmMax: 400,
    tempMin: 18.0,
    tempMax: 25.0,
    tips: [
      "ต้องการระบบกรองขนาดใหญ่และมีออกซิเจนในน้ำสูงมาก เพราะกินเก่งและขับถ่ายเยอะ",
      "ทนต่ออุณหภูมิเย็นได้ดี แต่ควรระวังการแกว่งของค่า pH หลังฝนตกหนัก",
      "หมั่นตรวจสอบค่า TDS/PPM และไนเตรตสม่ำเสมอเพื่อสุขภาพปลาและสีสันสดใส",
    ],
  },
  {
    keys: ["ปอม", "discus"],
    speciesName: "ปลาปอมปาดัวร์ (Discus)",
    phMin: 6.0,
    phMax: 6.8,
    ppmMin: 50,
    ppmMax: 150,
    tempMin: 28.5,
    tempMax: 31.0,
    tips: [
      "ต้องการน้ำที่สะอาด บริสุทธิ์ และค่าน้ำนุ่มมาก (TDS ต่ำ) ละเอียดอ่อนต่อคุณภาพน้ำ",
      "ชอบอุณหภูมิน้ำอุ่นค่อนข้างสูง (29-30°C) ช่วยกระตุ้นภูมิคุ้มกันและเจริญอาหาร",
      "ห้ามใช้น้ำประปาที่มีคลอรีนหรือโลหะหนักตกค้างอย่างเด็ดขาด",
    ],
  },
  {
    keys: ["กัด", "betta"],
    speciesName: "ปลากัด (Betta)",
    phMin: 6.5,
    phMax: 7.5,
    ppmMin: 100,
    ppmMax: 220,
    tempMin: 24.0,
    tempMax: 28.0,
    tips: [
      "แม้จะมีความอดทนสูง แต่น้ำที่สะอาดปราศจากแอมโมเนียจะป้องกันโรคครีบและหางเปื่อยได้ดีเยี่ยม",
      "หลีกเลี่ยงกระแสน้ำแรงจากกรอง เนื่องจากปลากัดชอบน้ำนิ่งและมีใบหูกวางแห้งปรับสภาพน้ำ",
      "แยกเลี้ยงเดี่ยวสำหรับตัวผู้ หรือเลี้ยงในตู้ไม้น้ำขนาด 5-10 แกลลอนขึ้นไป",
    ],
  },
  {
    keys: ["หางนกยูง", "guppy"],
    speciesName: "ปลาหางนกยูง (Guppy)",
    phMin: 6.8,
    phMax: 7.8,
    ppmMin: 150,
    ppmMax: 300,
    tempMin: 24.0,
    tempMax: 28.0,
    tips: [
      "ชอบน้ำที่มีความเป็นกลางถึงด่างอ่อนๆ และมีความกระด้างปานกลาง",
      "เปลี่ยนน้ำสัปดาห์ละ 20-30% และสามารถเสริมเกลือสมุทรเล็กน้อยเพื่อลดความเครียด",
      "ออกลูกเป็นตัวและแพร่พันธุ์ได้รวดเร็ว ควรมีพืชน้ำให้ลูกปลาหลบซ่อน",
    ],
  },
  {
    keys: ["หมอสี", "cichlid"],
    speciesName: "ปลาหมอสี (Cichlid)",
    phMin: 7.5,
    phMax: 8.6,
    ppmMin: 250,
    ppmMax: 450,
    tempMin: 25.0,
    tempMax: 28.5,
    tips: [
      "ส่วนใหญ่ชอบน้ำที่มีฤทธิ์เป็นด่างและกระด้างปานกลางถึงสูง (โดยเฉพาะสายพันธุ์มาลาวีและแทนกันยีกา)",
      "นิสัยรักถิ่นและดุร้าย ควรจัดโขดหินหรือท่อหลบซ่อนให้เพียงพอ",
      "ต้องการระบบกรองที่มีประสิทธิภาพสูงและให้อาหารที่มีโปรตีนและสาหร่ายสไปรูลิน่า",
    ],
  },
  {
    keys: ["มังกร", "arowana", "อโรวาน่า"],
    speciesName: "ปลามังกร (Arowana)",
    phMin: 6.5,
    phMax: 7.5,
    ppmMin: 100,
    ppmMax: 250,
    tempMin: 27.0,
    tempMax: 30.0,
    tips: [
      "ต้องการตู้ขนาดใหญ่ (ขั้นต่ำ 60-72 นิ้วขึ้นไป) พร้อมฝาปิดตู้ที่แน่นหนาเพราะกระโดดเก่งมาก",
      "รักษาความสะอาดของน้ำอย่างเข้มงวด ควบคุมอุณหภูมิให้อุ่นคงที่ 28-30°C",
      "ให้อาหารมีชีวิตหรืออาหารเม็ดคุณภาพสูง และระวังตาตกจากการมองอาหารที่พื้นตู้",
    ],
  },
  {
    keys: ["ทอง", "goldfish"],
    speciesName: "ปลาทอง (Goldfish)",
    phMin: 7.0,
    phMax: 7.8,
    ppmMin: 180,
    ppmMax: 350,
    tempMin: 20.0,
    tempMax: 25.0,
    tips: [
      "ชอบน้ำเย็นและออกซิเจนสูง ไม่ควรให้น้ำร้อนเกิน 26°C",
      "ระบบกรองต้องรองรับของเสียปริมาณมาก เนื่องจากปลาทองไม่มีกระเพาะอาหารจริง กินตลอดเวลา",
      "หลีกเลี่ยงของตกแต่งตู้ที่มีขอบคม เพราะอาจทำให้วุ้นหรือเกล็ดปลาฉีกขาดได้",
    ],
  },
  {
    keys: ["นีออน", "neon", "tetra", "เตตร้า"],
    speciesName: "ปลานีออนเทตร้า (Neon Tetra)",
    phMin: 6.0,
    phMax: 7.0,
    ppmMin: 50,
    ppmMax: 150,
    tempMin: 23.0,
    tempMax: 27.0,
    tips: [
      "ชอบอยู่รวมกันเป็นฝูงอย่างน้อย 8-10 ตัวขึ้นไปในตู้ไม้น้ำ",
      "ชอบน้ำนุ่ม เป็นกรดอ่อนๆ และแสงไฟที่ไม่สว่างจ้าจนเกินไป",
      "ระวังคุณภาพน้ำใหม่ขณะเปลี่ยนน้ำ ควรปรับอุณหภูมิและ pH ให้ใกล้เคียงน้ำเดิม",
    ],
  },
  {
    keys: ["กุ้ง", "shrimp", "แคระ"],
    speciesName: "กุ้งแคระ (Dwarf Shrimp)",
    phMin: 6.4,
    phMax: 7.2,
    ppmMin: 120,
    ppmMax: 220,
    tempMin: 22.0,
    tempMax: 26.0,
    tips: [
      "ไวต่อสารเคมีและโลหะทองแดงอย่างยิ่ง ปริมาณเพียงเล็กน้อยอาจถึงแก่ชีวิตได้",
      "ต้องมีค่าแร่ธาตุความกระด้าง (GH/KH) พอเหมาะเพื่อให้กุ้งลอกคราบได้สำเร็จ",
      "ชอบกินตะไคร่น้ำและแบคทีเรียชีวภาพบนผิวมอสหรือใบหูกวางแห้ง",
    ],
  },
];

function getFallbackData(fishSpecies) {
  const query = fishSpecies.toLowerCase();
  for (const item of FALLBACK_FISH_DB) {
    if (item.keys.some((k) => query.includes(k))) {
      return item;
    }
  }

  // Generic freshwater fish template
  return {
    speciesName: fishSpecies,
    phMin: 6.5,
    phMax: 7.5,
    ppmMin: 150,
    ppmMax: 280,
    tempMin: 25.0,
    tempMax: 28.0,
    tips: [
      "ควรรักษาคุณภาพน้ำให้สะอาดสม่ำเสมอ โดยเปลี่ยนถ่ายน้ำ 20-30% ทุกสัปดาห์",
      "หลีกเลี่ยงการให้อาหารเกินความจำเป็นเพื่อป้องกันค่า TDS, แอมโมเนีย และไนเตรตพุ่งสูง",
      "ติดตั้งระบบกรองและเติมออกซิเจนให้เพียงพอต่อปริมาตรน้ำในตู้",
    ],
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const fishSpecies = body.fishSpecies?.trim();
    const customKey = body.apiKey?.trim();

    if (!fishSpecies) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อสายพันธุ์ปลา" },
        { status: 400 }
      );
    }

    const apiKey = customKey || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;

    // Supported Gemini models to try in order of preference
    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ];

    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการเลี้ยงปลาและนิเวศวิทยาระบบน้ำตู้ปลา (Aquarium Specialist & Aquascaper)
ตอบเป็นโครงสร้าง JSON ตามนี้เท่านั้น (ไม่ต้องใส่ markdown code blocks):
{
  "speciesName": "ชื่อสายพันธุ์ปลาภาษาไทยและอังกฤษ เช่น ปลาเทวดา (Angelfish)",
  "phMin": 6.5,
  "phMax": 7.5,
  "ppmMin": 100,
  "ppmMax": 250,
  "tempMin": 25.0,
  "tempMax": 28.5,
  "tips": [
    "ข้อแนะนำเฉพาะสายพันธุ์ที่ 1...",
    "ข้อแนะนำเฉพาะสายพันธุ์ที่ 2...",
    "ข้อแนะนำเฉพาะสายพันธุ์ที่ 3..."
  ]
}
หมายเหตุ: ตัวเลข phMin, phMax, ppmMin, ppmMax, tempMin, tempMax ต้องเป็นตัวเลข Number จริงๆ และ tips ต้องเป็น array ของ string 3-4 ข้อที่เป็นประโยชน์มากที่สุด`;

    const userPrompt = `ขอค่าที่เหมาะสมที่สุดในการเลี้ยงสัตว์น้ำชนิดนี้: "${fishSpecies}" ทั้งค่า pH, TDS/PPM และอุณหภูมิ (°C) พร้อมคำแนะนำและข้อควรระวังสำคัญ`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    let resultJson = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            // Clean any potential markdown wrapping
            const cleaned = rawText
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();
            resultJson = JSON.parse(cleaned);
            break;
          }
        } else {
          const errBody = await res.text();
          lastError = `Model ${model} returned ${res.status}: ${errBody}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (resultJson && typeof resultJson === "object") {
      // Normalize tips to array if string
      let tips = resultJson.tips;
      if (typeof tips === "string") {
        tips = [tips];
      } else if (!Array.isArray(tips)) {
        tips = ["ควรรักษาคุณภาพน้ำและเปลี่ยนถ่ายน้ำสม่ำเสมอ"];
      }

      return NextResponse.json({
        success: true,
        source: "gemini",
        data: {
          speciesName: resultJson.speciesName || fishSpecies,
          phMin: Number(resultJson.phMin) || 6.5,
          phMax: Number(resultJson.phMax) || 7.5,
          ppmMin: Number(resultJson.ppmMin) || 150,
          ppmMax: Number(resultJson.ppmMax) || 280,
          tempMin: Number(resultJson.tempMin) || 25.0,
          tempMax: Number(resultJson.tempMax) || 28.0,
          tips,
        },
      });
    }

    // Fallback to offline knowledge base
    console.warn("Gemini API call failed or exhausted, using fallback DB:", lastError);
    const fallback = getFallbackData(fishSpecies);

    return NextResponse.json({
      success: true,
      source: "fallback",
      data: fallback,
      note: "แสดงผลจากฐานข้อมูลผู้เชี่ยวชาญในระบบ (เนื่องจาก Gemini API ใช้เวลาตอบสนองนานหรือมีการจำกัดโควตา)",
    });
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการประมวลผลข้อมูล",
      },
      { status: 500 }
    );
  }
}

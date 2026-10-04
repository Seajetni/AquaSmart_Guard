/**
 * ThresholdService - จัดการเกณฑ์ (thresholds) และ AI recommendations
 * ๑. ดึง/บันทึก thresholds จาก localStorage และ MongoDB
 * ๒. ประเมินสถานะ (status: safe/warning/danger)
 * ๓. เรียก Gemini AI เพื่อให้คำแนะนำ
 * ๔. สร้าง comparison analysis
 */

const DEFAULT_THRESHOLDS = {
  speciesName: "มาตรฐานน้ำจืดทั่วไป (General Freshwater)",
  phMin: 6.5,
  phMax: 7.5,
  ppmMin: 150,
  ppmMax: 300,
  tempMin: 26.0,
  tempMax: 28.5,
};

export class ThresholdService {
  constructor() {
    this.thresholds = { ...DEFAULT_THRESHOLDS };
  }

  /**
   * โหลด thresholds จาก localStorage และ MongoDB
   */
  async loadThresholds() {
    // ๑. โหลดจาก localStorage ก่อน (instant)
    try {
      const cached = localStorage.getItem("tank_thresholds");
      if (cached) {
        this.thresholds = JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }

    // ๒. โหลดจาก MongoDB (sync ในพื้นหลัง)
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data && data.dbConnected) {
        this.thresholds = data.data;
        try {
          localStorage.setItem("tank_thresholds", JSON.stringify(data.data));
        } catch {}
      }
    } catch (err) {
      console.warn("Could not fetch thresholds from MongoDB:", err);
    }

    return { ...this.thresholds };
  }

  /**
   * บันทึก thresholds ไปยัง localStorage และ MongoDB
   */
  async saveThresholds(newThresholds) {
    this.thresholds = newThresholds;

    // ๑. บันทึกลง localStorage ทันที
    try {
      localStorage.setItem("tank_thresholds", JSON.stringify(newThresholds));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // ๒. บันทึกลง MongoDB
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newThresholds),
      });
      const data = await res.json();
      return { success: data.success, message: data.message || "บันทึกสำเร็จ" };
    } catch (err) {
      console.warn("Could not save to MongoDB:", err);
      return { success: false, message: "บันทึกไว้ในเครื่องแล้ว" };
    }
  }

  /**
   * ประเมินสถานะของค่า
   */
  evaluateStatus(value, min, max, paramType = "ph") {
    if (value >= min && value <= max) {
      return {
        text: "ปกติ / Safe",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        indicatorColor: "bg-emerald-400",
        status: "safe",
      };
    }

    const tolerance = paramType === "ph" ? 0.4 : paramType === "ppm" ? 50 : 1.0;
    if (value >= min - tolerance && value <= max + tolerance) {
      return {
        text: "เตือน / Warning",
        colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        indicatorColor: "bg-amber-400",
        status: "warning",
      };
    }

    return {
      text: "อันตราย / Danger",
      colorClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse",
      indicatorColor: "bg-rose-400",
      status: "danger",
    };
  }

  /**
   * เรียก Gemini API เพื่อให้คำแนะนำ
   */
  async queryAi(fishSpecies, apiKey) {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fishSpecies,
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, data: data.data, source: data.source };
      } else {
        return {
          success: false,
          error: data.error || "ไม่สามารถวิเคราะห์ข้อมูลปลาได้",
        };
      }
    } catch (err) {
      console.error("AI Request error:", err);
      return {
        success: false,
        error: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI",
      };
    }
  }

  /**
   * สร้าง comparison analysis ระหว่าง current values กับ thresholds
   */
  generateComparison(currentValues, aiResponse = null) {
    const activeParams = aiResponse?.data || this.thresholds;
    const { ph, ppm, temp } = currentValues;

    const analysis = [];
    let score = 100;

    // ประเมิน pH
    const phAnalysis = this._analyzePh(ph, activeParams.phMin, activeParams.phMax);
    analysis.push(phAnalysis);
    score -= phAnalysis.penalty;

    // ประเมิน PPM
    const ppmAnalysis = this._analyzePpm(ppm, activeParams.ppmMin, activeParams.ppmMax);
    analysis.push(ppmAnalysis);
    score -= ppmAnalysis.penalty;

    // ประเมิน Temperature
    const tempAnalysis = this._analyzeTemp(temp, activeParams.tempMin, activeParams.tempMax);
    analysis.push(tempAnalysis);
    score -= tempAnalysis.penalty;

    return {
      species: activeParams.speciesName || "ทั่วไป",
      score: Math.max(0, score),
      items: analysis.map(({ penalty, ...rest }) => rest), // ลบ penalty ออก
    };
  }

  /**
   * วิเคราะห์ pH
   */
  _analyzePh(ph, min, max) {
    if (ph < min) {
      return {
        penalty: 25,
        param: "pH (ความเป็นกรด-ด่าง)",
        current: `${ph} pH`,
        recommended: `${min} - ${max}`,
        state: "low",
        msg: `น้ำเป็นกรดมากเกินไป (ต่ำกว่าเกณฑ์ ${min})`,
        action: "แนะนำให้เติมบัฟเฟอร์ปรับด่าง (pH Up) เล็กน้อย หรือเปลี่ยนถ่ายน้ำ 20%",
      };
    } else if (ph > max) {
      return {
        penalty: 25,
        param: "pH (ความเป็นกรด-ด่าง)",
        current: `${ph} pH`,
        recommended: `${min} - ${max}`,
        state: "high",
        msg: `น้ำเป็นด่างสูงเกินไป (เกินเกณฑ์ ${max})`,
        action: "แนะนำให้เติมน้ำยาปรับลด pH (pH Down) หรือใส่ใบหูกวางแห้ง",
      };
    }
    return {
      penalty: 0,
      param: "pH (ความเป็นกรด-ด่าง)",
      current: `${ph} pH`,
      recommended: `${min} - ${max}`,
      state: "good",
      msg: "ระดับกรด-ด่างสมบูรณ์แบบ",
      action: "รักษาคุณภาพน้ำให้สม่ำเสมอ",
    };
  }

  /**
   * วิเคราะห์ PPM
   */
  _analyzePpm(ppm, min, max) {
    if (ppm < min) {
      return {
        penalty: 15,
        param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
        current: `${Math.round(ppm)} PPM`,
        recommended: `${min} - ${max} PPM`,
        state: "low",
        msg: `ปริมาณแร่ธาตุต่ำกว่าปกติ (ต่ำกว่า ${min} PPM)`,
        action: "อาจต้องการเกลือแร่หรือ GH Booster",
      };
    } else if (ppm > max) {
      return {
        penalty: 30,
        param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
        current: `${Math.round(ppm)} PPM`,
        recommended: `${min} - ${max} PPM`,
        state: "high",
        msg: `ค่า PPM สูงมาก (เกินเกณฑ์ ${max} PPM)`,
        action: "แนะนำให้เปลี่ยนถ่ายน้ำ 30-40% ทันที และล้างไส้กรองชีวภาพ",
      };
    }
    return {
      penalty: 0,
      param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
      current: `${Math.round(ppm)} PPM`,
      recommended: `${min} - ${max} PPM`,
      state: "good",
      msg: "ระดับความบริสุทธิ์สะอาดและปลอดภัย",
      action: "ตรวจเช็คเป็นประจำทุกสัปดาห์",
    };
  }

  /**
   * วิเคราะห์อุณหภูมิ
   */
  _analyzeTemp(temp, min, max) {
    if (temp < min) {
      return {
        penalty: 20,
        param: "อุณหภูมิน้ำ (°C)",
        current: `${temp} °C`,
        recommended: `${min} - ${max} °C`,
        state: "low",
        msg: `อุณหภูมิน้ำเย็นเกินไป (ต่ำกว่า ${min} °C)`,
        action: "ติดตั้งฮีตเตอร์ควบคุมอุณหภูมิอัตโนมัติ",
      };
    } else if (temp > max) {
      return {
        penalty: 20,
        param: "อุณหภูมิน้ำ (°C)",
        current: `${temp} °C`,
        recommended: `${min} - ${max} °C`,
        state: "high",
        msg: `อุณหภูมิน้ำร้อนเกินไป (สูงกว่า ${max} °C)`,
        action: "ติดตั้งพัดลมระบายความร้อน หรือเครื่องชิลเลอร์",
      };
    }
    return {
      penalty: 0,
      param: "อุณหภูมิน้ำ (°C)",
      current: `${temp} °C`,
      recommended: `${min} - ${max} °C`,
      state: "good",
      msg: "อุณหภูมิน้ำเหมาะสมสบายตัว",
      action: "ควบคุมไม่ให้แกว่งเกิน ±1 °C ต่อวัน",
    };
  }

  /**
   * ดึง thresholds ปัจจุบัน
   */
  getThresholds() {
    return { ...this.thresholds };
  }

  /**
   * Reset เป็นค่า default
   */
  reset() {
    this.thresholds = { ...DEFAULT_THRESHOLDS };
  }
}

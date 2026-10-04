/**
 * SensorDataManager - จัดการข้อมูลเซนเซอร์จาก Blynk
 * ๑. ดึงข้อมูลจาก API
 * ๒. ประมวลผลค่า (normalization)
 * ๓. เก็บ raw data
 */

export class SensorDataManager {
  constructor() {
    this.currentValues = {
      ph: 7.2,
      ppm: 185,
      temp: 27.4,
    };

    this.rawBlynk = {
      v0: null,
      v1: null,
      v2: null,
      hardware: null,
      errors: null,
    };

    this.connectionStatus = {
      blynkConnected: false,
      isEspOnline: true,
      lastUpdated: "กำลังเชื่อมต่อ...",
    };
  }

  /**
   * ดึงข้อมูลเซนเซอร์จาก Blynk API
   */
  async fetchSensorData() {
    try {
      const res = await fetch("/api/blynk", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        return this._handleFetchError();
      }

      return this._processSensorData(data);
    } catch (err) {
      console.error("Blynk fetch error:", err);
      return this._handleFetchError();
    }
  }

  /**
   * ประมวลผลข้อมูล Blynk raw
   */
  _processSensorData(data) {
    const phVal = data.ph !== null ? data.ph : 7.0;
    let ppmVal = data.tds !== null ? Number(data.tds) : 200;

    // Normalize PPM ถ้าเกิน 300
    if (ppmVal > 300) {
      ppmVal -= 120;
    }

    const tempVal = data.temp !== null ? data.temp : 25.0;

    // อัพเดต current values
    this.currentValues = {
      ph: phVal,
      ppm: ppmVal,
      temp: tempVal,
    };

    // เก็บ raw data
    this.rawBlynk = {
      v0: data.raw?.v0,
      v1: data.raw?.v1,
      v2: data.raw?.v2,
      hardware: data.raw?.hardware,
      errors: data.errors,
    };

    // อัพเดต connection status
    this.connectionStatus = {
      blynkConnected: true,
      isEspOnline: data.isHardwareConnected === true,
      lastUpdated: this._formatTime(new Date()),
    };

    return {
      success: true,
      values: this.currentValues,
      raw: this.rawBlynk,
      status: this.connectionStatus,
      timeString: this.connectionStatus.lastUpdated,
    };
  }

  /**
   * จัดการข้อผิดพลาด
   */
  _handleFetchError() {
    this.connectionStatus = {
      blynkConnected: false,
      isEspOnline: false,
      lastUpdated: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    };

    return {
      success: false,
      values: this.currentValues,
      status: this.connectionStatus,
    };
  }

  /**
   * Format เวลาเป็น HH:MM:SS
   */
  _formatTime(date) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `อัปเดตล่าสุด: ${hours}:${minutes}:${seconds}`;
  }

  /**
   * ดึงค่าปัจจุบัน
   */
  getValues() {
    return { ...this.currentValues };
  }

  /**
   * ดึง raw data
   */
  getRawData() {
    return { ...this.rawBlynk };
  }

  /**
   * ดึง connection status
   */
  getStatus() {
    return { ...this.connectionStatus };
  }

  /**
   * Reset values
   */
  reset() {
    this.currentValues = { ph: 7.2, ppm: 185, temp: 27.4 };
    this.rawBlynk = { v0: null, v1: null, v2: null, hardware: null, errors: null };
    this.connectionStatus = { blynkConnected: false, isEspOnline: true, lastUpdated: "กำลังเชื่อมต่อ..." };
  }
}

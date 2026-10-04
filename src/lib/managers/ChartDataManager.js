/**
 * ChartDataManager - จัดการข้อมูลและการทำงานของกราฟ
 * ๑. ดึงข้อมูล historical/aggregated
 * ๒. ประมวลผลข้อมูลกราฟ
 * ๓. จัดการ chart instance
 * ๔. คำนวณ summary statistics
 */

export class ChartDataManager {
  constructor() {
    this.chartInstance = null;
    this.chartData = {
      labels: ["เริ่มต้น", "ก่อนหน้า", "ก่อนหน้า", "ก่อนหน้า", "ปัจจุบัน"],
      ph: [7.2, 7.2, 7.2, 7.2, 7.2],
      ppm: [185, 185, 185, 185, 185],
      temp: [27.4, 27.4, 27.4, 27.4, 27.4],
    };

    this.summary = null;
    this.maxDataPoints = 30; // จำกัดจำนวนจุดข้อมูลในโหมด real-time
  }

  /**
   * ตั้งค่า Chart instance
   */
  setChartInstance(instance) {
    this.chartInstance = instance;
  }

  /**
   * ดึงข้อมูล historical ตามช่วงเวลา
   */
  async fetchHistoricalData(range) {
    try {
      const res = await fetch(`/api/logs?range=${range}`);
      const resData = await res.json();

      if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
        return this._processHistoricalData(resData.data);
      } else {
        return this._handleEmptyData(range);
      }
    } catch (err) {
      console.warn("Could not fetch chart data:", err);
      return { success: false, summary: null };
    }
  }

  /**
   * ประมวลผล historical data
   */
  _processHistoricalData(points) {
    const labels = points.map((p) => p.label);
    const phs = points.map((p) => Number(p.ph));
    const ppms = points.map((p) => {
      const val = Math.round(p.ppm);
      return val > 300 ? val - 120 : val;
    });
    const temps = points.map((p) => Number(p.temp));

    this.chartData = { labels, ph: phs, ppm: ppms, temp: temps };

    const summary = {
      count: points.length,
      avgPh: (phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2),
      avgPpm: Math.round(ppms.reduce((a, b) => a + b, 0) / ppms.length),
      avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
    };

    this.summary = summary;

    if (this.chartInstance) {
      this._updateChartDisplay();
    }

    return { success: true, summary };
  }

  /**
   * จัดการกรณีไม่มีข้อมูล
   */
  _handleEmptyData(range) {
    const emptyLabels = range === "minute" ? ["กำลังรับข้อมูล..."] : ["ไม่มีข้อมูลบันทึก"];
    this.chartData = { labels: emptyLabels, ph: [0], ppm: [0], temp: [0] };
    this.summary = null;

    if (this.chartInstance) {
      this._updateChartDisplay();
    }

    return { success: true, summary: null };
  }

  /**
   * อัพเดตการแสดงผลกราฟ
   */
  _updateChartDisplay() {
    if (!this.chartInstance) return;

    const chart = this.chartInstance;
    chart.data.labels = this.chartData.labels;
    chart.data.datasets[0].data = this.chartData.ph;
    chart.data.datasets[1].data = this.chartData.ppm;
    chart.data.datasets[2].data = this.chartData.temp;
    chart.update();
  }

  /**
   * เพิ่มจุดข้อมูล real-time (streaming)
   */
  appendRealTimePoint(ph, ppm, temp, timeStr, isMinuteMode = true) {
    if (!this.chartInstance || !isMinuteMode) return;

    const chart = this.chartInstance;

    // ล้างข้อมูล placeholder
    if (
      chart.data.labels.length > 0 &&
      ["เริ่มต้น", "ไม่มีข้อมูลบันทึก", "กำลังรับข้อมูล..."].includes(chart.data.labels[0])
    ) {
      chart.data.labels = [];
      chart.data.datasets.forEach((ds) => (ds.data = []));
    }

    // เพิ่มจุดข้อมูลใหม่
    chart.data.labels.push(timeStr);
    chart.data.datasets[0].data.push(Number(ph).toFixed(2));
    chart.data.datasets[1].data.push(Math.round(ppm));
    chart.data.datasets[2].data.push(Number(temp).toFixed(1));

    // จำกัดจำนวนจุด
    if (chart.data.labels.length > this.maxDataPoints) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((ds) => ds.data.shift());
    }

    // อัพเดต summary
    this._updateSummaryStats(chart);
    chart.update("none");
  }

  /**
   * คำนวณ summary statistics จากข้อมูลปัจจุบัน
   */
  _updateSummaryStats(chart) {
    const phs = chart.data.datasets[0].data;
    const ppms = chart.data.datasets[1].data;
    const temps = chart.data.datasets[2].data;

    if (phs.length > 0) {
      this.summary = {
        count: phs.length,
        avgPh: (phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2),
        avgPpm: Math.round(ppms.reduce((a, b) => a + b, 0) / ppms.length),
        avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      };
    }
  }

  /**
   * ดึง chart data
   */
  getChartData() {
    return { ...this.chartData };
  }

  /**
   * ดึง summary
   */
  getSummary() {
    return this.summary ? { ...this.summary } : null;
  }

  /**
   * ตั้งค่าจำนวนจุดสูงสุด
   */
  setMaxDataPoints(max) {
    this.maxDataPoints = max;
  }

  /**
   * Reset ข้อมูล
   */
  reset() {
    this.chartData = {
      labels: ["เริ่มต้น"],
      ph: [7.2],
      ppm: [185],
      temp: [27.4],
    };
    this.summary = null;
  }
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";

export default function AquariumDashboard() {
  // Mode: "live" (Blynk real-time) or "sim" (manual simulator)
  const [mode, setMode] = useState("live");
  const [blynkConnected, setBlynkConnected] = useState(false);
  const [isEspOnline, setIsEspOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("กำลังเชื่อมต่อ...");
  const [pollInterval, setPollInterval] = useState(3000); // 3 seconds
  const [isPollingPaused, setIsPollingPaused] = useState(false);

  // Raw and current sensor values
  const [currentValues, setCurrentValues] = useState({
    ph: 7.2,
    ppm: 185,
    temp: 27.4,
  });

  const [rawBlynk, setRawBlynk] = useState({
    v0: null,
    v1: null,
    v2: null,
    hardware: null,
    errors: null,
  });

  // Simulator slider state
  const [simValues, setSimValues] = useState({
    ph: 7.2,
    ppm: 185,
    temp: 27.4,
  });

  // AI & Threshold Settings (Standard defaults or customized by AI)
  const [aiThresholds, setAiThresholds] = useState({
    speciesName: "มาตรฐานน้ำจืดทั่วไป (General Freshwater)",
    phMin: 6.5,
    phMax: 7.5,
    ppmMin: 150,
    ppmMax: 300,
    tempMin: 26.0,
    tempMax: 28.5,
  });

  // AI State
  const [fishInput, setFishInput] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Background bubbles
  const [bubbles, setBubbles] = useState([]);

  // Chart ref
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const chartDataRef = useRef({
    labels: ["เริ่มต้น", "ก่อนหน้า", "ก่อนหน้า", "ก่อนหน้า", "ปัจจุบัน"],
    ph: [7.2, 7.2, 7.2, 7.2, 7.2],
    ppm: [185, 185, 185, 185, 185],
    temp: [27.4, 27.4, 27.4, 27.4, 27.4],
  });

  // 1. Initialize Bubbles & Load Saved API Key
  useEffect(() => {
    // Generate floating background bubbles
    const bubbleList = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: Math.random() * 38 + 12,
      left: Math.random() * 98,
      duration: Math.random() * 9 + 7,
      delay: Math.random() * 6,
    }));
    setBubbles(bubbleList);

    // Load saved API key from localStorage if set by user
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  // 2. Initialize Chart.js
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartCanvasRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartDataRef.current.labels,
        datasets: [
          {
            label: "pH (ความเป็นกรด-ด่าง)",
            data: chartDataRef.current.ph,
            borderColor: "#00b4d8",
            backgroundColor: "rgba(0, 180, 216, 0.12)",
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.35,
            yAxisID: "y",
            fill: true,
          },
          {
            label: "TDS / PPM (ความบริสุทธิ์)",
            data: chartDataRef.current.ppm,
            borderColor: "#3b82f6",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.35,
            yAxisID: "y1",
          },
          {
            label: "อุณหภูมิ (°C)",
            data: chartDataRef.current.temp,
            borderColor: "#f59e0b",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.35,
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(11, 25, 44, 0.95)",
            titleColor: "#90e0ef",
            bodyColor: "#f0f8ff",
            borderColor: "rgba(0, 180, 216, 0.3)",
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8", font: { family: "Kanit", size: 11 } },
          },
          y: {
            type: "linear",
            position: "left",
            min: 0,
            max: 14,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#00b4d8", font: { family: "Kanit", size: 11 } },
            title: { display: true, text: "pH", color: "#00b4d8" },
          },
          y1: {
            type: "linear",
            position: "right",
            min: 0,
            max: 1600,
            grid: { drawOnChartArea: false },
            ticks: { color: "#3b82f6", font: { family: "Kanit", size: 11 } },
            title: { display: true, text: "PPM", color: "#3b82f6" },
          },
          y2: {
            type: "linear",
            position: "right",
            min: 10,
            max: 45,
            grid: { drawOnChartArea: false },
            ticks: { color: "#f59e0b", font: { family: "Kanit", size: 11 } },
            title: { display: true, text: "°C", color: "#f59e0b" },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update chart data points helper
  const appendChartPoint = useCallback((ph, ppm, temp, timeStr) => {
    if (!chartInstanceRef.current) return;
    const chart = chartInstanceRef.current;

    chart.data.labels.push(timeStr);
    chart.data.datasets[0].data.push(Number(ph.toFixed(1)));
    chart.data.datasets[1].data.push(Math.round(ppm));
    chart.data.datasets[2].data.push(Number(temp.toFixed(1)));

    // Keep up to 16 historical readings for smooth graph
    if (chart.data.labels.length > 16) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
      chart.data.datasets[2].data.shift();
    }

    chart.update("none");
  }, []);

  // 3. Fetch Real Blynk Sensor Data
  const fetchBlynkData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/blynk", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        const phVal = data.ph !== null ? data.ph : 7.0;
        const ppmVal = data.tds !== null ? data.tds : 200;
        const tempVal = data.temp !== null ? data.temp : 25.0;

        setCurrentValues({
          ph: phVal,
          ppm: ppmVal,
          temp: tempVal,
        });

        setRawBlynk({
          v0: data.raw?.v0,
          v1: data.raw?.v1,
          v2: data.raw?.v2,
          hardware: data.raw?.hardware,
          errors: data.errors,
        });

        setBlynkConnected(true);
        setIsEspOnline(data.isHardwareConnected === true);

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        setLastUpdated(`อัปเดตล่าสุด: ${timeStr}`);

        // Update chart if in live mode
        if (mode === "live") {
          appendChartPoint(phVal, ppmVal, tempVal, timeStr);
        }
      } else {
        setBlynkConnected(false);
        setIsEspOnline(false);
        setLastUpdated("เชื่อมต่อ Blynk ไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Blynk fetch error:", err);
      setBlynkConnected(false);
      setIsEspOnline(false);
      setLastUpdated("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsRefreshing(false);
    }
  }, [mode, appendChartPoint]);

  // 4. Polling effect for Live Mode
  useEffect(() => {
    if (mode !== "live") return;

    // Immediate first fetch
    fetchBlynkData();

    if (isPollingPaused) return;

    const interval = setInterval(() => {
      fetchBlynkData();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [mode, pollInterval, isPollingPaused, fetchBlynkData]);

  // 5. Simulation Mode Effect (Periodic subtle jitter for realistic demo)
  useEffect(() => {
    if (mode !== "sim") return;

    const simInterval = setInterval(() => {
      setSimValues((prev) => {
        const newPh = Math.max(5.0, Math.min(9.5, prev.ph + (Math.random() * 0.2 - 0.1)));
        const newPpm = Math.max(40, Math.min(1500, prev.ppm + (Math.random() * 10 - 5)));
        const newTemp = Math.max(18.0, Math.min(36.0, prev.temp + (Math.random() * 0.2 - 0.1)));

        setCurrentValues({
          ph: Number(newPh.toFixed(1)),
          ppm: Math.round(newPpm),
          temp: Number(newTemp.toFixed(1)),
        });

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        setLastUpdated(`จำลองค่าสด: ${timeStr}`);

        appendChartPoint(newPh, newPpm, newTemp, timeStr);

        return { ph: newPh, ppm: newPpm, temp: newTemp };
      });
    }, 2500);

    return () => clearInterval(simInterval);
  }, [mode, appendChartPoint]);

  // Manual Slider Update
  const handleSliderChange = (param, value) => {
    const num = parseFloat(value);
    setSimValues((prev) => ({ ...prev, [param]: num }));
    setCurrentValues((prev) => ({ ...prev, [param]: num }));

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLastUpdated(`ปรับค่าด้วยตนเอง: ${timeStr}`);

    appendChartPoint(
      param === "ph" ? num : currentValues.ph,
      param === "ppm" ? num : currentValues.ppm,
      param === "temp" ? num : currentValues.temp,
      timeStr
    );
  };

  // Reset Sliders
  const handleResetSliders = () => {
    const defaults = { ph: 7.2, ppm: 185, temp: 27.4 };
    setSimValues(defaults);
    setCurrentValues(defaults);
  };

  // Evaluate status badge for each parameter
  const evaluateStatus = (val, min, max, type = "ph") => {
    if (val >= min && val <= max) {
      return {
        text: "ปกติ / Safe",
        colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        indicatorColor: "bg-emerald-400",
        status: "safe",
      };
    }

    const tolerance = type === "ph" ? 0.4 : type === "ppm" ? 50 : 1.0;
    if (val >= min - tolerance && val <= max + tolerance) {
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
  };

  // Save API Key
  const handleSaveApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem("gemini_api_key", geminiApiKey.trim());
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 3000);
    } else {
      localStorage.removeItem("gemini_api_key");
      alert("ยกเลิกการบันทึก API Key แล้ว");
    }
  };

  // Ask AI
  const handleAskAi = async (overrideSpecies = null) => {
    const target = overrideSpecies || fishInput.trim();
    if (!target) {
      alert("กรุณากรอกชื่อหรือสายพันธุ์ปลาก่อนครับ");
      return;
    }

    if (overrideSpecies) {
      setFishInput(overrideSpecies);
    }

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fishSpecies: target,
          apiKey: geminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiResponse(data);
      } else {
        alert(data.error || "ไม่สามารถวิเคราะห์ข้อมูลสายพันธุ์ปลาได้");
      }
    } catch (err) {
      console.error("AI Request error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ผู้ช่วย");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI recommended parameters as current dashboard thresholds
  const handleApplyAiThresholds = () => {
    if (!aiResponse?.data) return;
    const d = aiResponse.data;
    setAiThresholds({
      speciesName: d.speciesName,
      phMin: d.phMin,
      phMax: d.phMax,
      ppmMin: d.ppmMin,
      ppmMax: d.ppmMax,
      tempMin: d.tempMin,
      tempMax: d.tempMax,
    });
    alert(`นำเกณฑ์ที่เหมาะสมของ "${d.speciesName}" ไปปรับใช้กับระบบตรวจวัดและแถบเตือนสถานะเรียบร้อยแล้ว!`);
  };

  // Generate comparison report between live tank values and AI recommendations
  const generateComparisonAnalysis = () => {
    const activeParams = aiResponse?.data || aiThresholds;
    const ph = currentValues.ph;
    const ppm = currentValues.ppm;
    const temp = currentValues.temp;

    const analysis = [];
    let score = 100;

    // pH analysis
    if (ph < activeParams.phMin) {
      score -= 25;
      analysis.push({
        param: "pH (ความเป็นกรด-ด่าง)",
        current: `${ph} pH`,
        recommended: `${activeParams.phMin} - ${activeParams.phMax}`,
        state: "low",
        msg: `น้ำเป็นกรดมากเกินไป (ต่ำกว่าเกณฑ์ ${activeParams.phMin})`,
        action: "แนะนำให้เติมบัฟเฟอร์ปรับด่าง (pH Up) เล็กน้อย หรือเปลี่ยนถ่ายน้ำ 20% ด้วยน้ำสะอาดที่พักไว้",
      });
    } else if (ph > activeParams.phMax) {
      score -= 25;
      analysis.push({
        param: "pH (ความเป็นกรด-ด่าง)",
        current: `${ph} pH`,
        recommended: `${activeParams.phMin} - ${activeParams.phMax}`,
        state: "high",
        msg: `น้ำเป็นด่างสูงเกินไป (เกินเกณฑ์ ${activeParams.phMax})`,
        action: "แนะนำให้เติมน้ำยาปรับลด pH (pH Down), ใส่ใบหูกวางแห้ง หรือขอนไม้ เพื่อเพิ่มแทนนินธรรมชาติ",
      });
    } else {
      analysis.push({
        param: "pH (ความเป็นกรด-ด่าง)",
        current: `${ph} pH`,
        recommended: `${activeParams.phMin} - ${activeParams.phMax}`,
        state: "good",
        msg: "ระดับกรด-ด่างอยู่ในช่วงสมบูรณ์แบบสำหรับสายพันธุ์นี้",
        action: "รักษาคุณภาพน้ำให้สม่ำเสมอ",
      });
    }

    // TDS analysis
    if (ppm < activeParams.ppmMin) {
      score -= 15;
      analysis.push({
        param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
        current: `${Math.round(ppm)} PPM`,
        recommended: `${activeParams.ppmMin} - ${activeParams.ppmMax} PPM`,
        state: "low",
        msg: `ปริมาณแร่ธาตุละลายต่ำกว่าปกติ (ต่ำกว่า ${activeParams.ppmMin} PPM)`,
        action: "สำหรับปลาบางชนิดอาจต้องการแร่ธาตุรวม (GH Booster) หรือเกลือแร่สำหรับสัตว์น้ำ",
      });
    } else if (ppm > activeParams.ppmMax) {
      score -= 30;
      analysis.push({
        param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
        current: `${Math.round(ppm)} PPM`,
        recommended: `${activeParams.ppmMin} - ${activeParams.ppmMax} PPM`,
        state: "high",
        msg: `ค่าสารละลายรวมและของเสียสะสมสูงมาก (เกินเกณฑ์ ${activeParams.ppmMax} PPM)`,
        action: "แนะนำให้เปลี่ยนถ่ายน้ำ 30-40% ทันที และล้างไส้กรองชีวภาพ พร้อมงดให้อาหารตกค้าง",
      });
    } else {
      analysis.push({
        param: "TDS / PPM (ความบริสุทธิ์น้ำ)",
        current: `${Math.round(ppm)} PPM`,
        recommended: `${activeParams.ppmMin} - ${activeParams.ppmMax} PPM`,
        state: "good",
        msg: "ระดับความบริสุทธิ์ของน้ำสะอาดและปลอดภัยมาก",
        action: "ตรวจเช็คเป็นประจำทุกสัปดาห์",
      });
    }

    // Temp analysis
    if (temp < activeParams.tempMin) {
      score -= 20;
      analysis.push({
        param: "อุณหภูมิน้ำ (°C)",
        current: `${temp} °C`,
        recommended: `${activeParams.tempMin} - ${activeParams.tempMax} °C`,
        state: "low",
        msg: `อุณหภูมิน้ำเย็นเกินไป (ต่ำกว่า ${activeParams.tempMin} °C)`,
        action: "ควรติดตั้งฮีตเตอร์ควบคุมอุณหภูมิตู้ปลาอัตโนมัติ เพื่อป้องกันปลาป่วยเป็นโรคจุดขาว",
      });
    } else if (temp > activeParams.tempMax) {
      score -= 20;
      analysis.push({
        param: "อุณหภูมิน้ำ (°C)",
        current: `${temp} °C`,
        recommended: `${activeParams.tempMin} - ${activeParams.tempMax} °C`,
        state: "high",
        msg: `อุณหภูมิน้ำร้อนเกินไป (สูงกว่า ${activeParams.tempMax} °C)`,
        action: "ติดตั้งพัดลมระบายความร้อน หรือเครื่องชิลเลอร์ (Chiller) และเปิดฝาตู้เพื่อระบายความร้อน",
      });
    } else {
      analysis.push({
        param: "อุณหภูมิน้ำ (°C)",
        current: `${temp} °C`,
        recommended: `${activeParams.tempMin} - ${activeParams.tempMax} °C`,
        state: "good",
        msg: "อุณหภูมิน้ำเหมาะสม สบายตัวสำหรับปลา",
        action: "ควบคุมไม่ให้อุณหภูมิแกว่งเกิน ±1 °C ต่อวัน",
      });
    }

    return {
      species: activeParams.speciesName || "ทั่วไป",
      score: Math.max(0, score),
      items: analysis,
    };
  };

  const phStatus = evaluateStatus(currentValues.ph, aiThresholds.phMin, aiThresholds.phMax, "ph");
  const ppmStatus = evaluateStatus(currentValues.ppm, aiThresholds.ppmMin, aiThresholds.ppmMax, "ppm");
  const tempStatus = evaluateStatus(currentValues.temp, aiThresholds.tempMin, aiThresholds.tempMax, "temp");

  return (
    <div className="font-sans antialiased text-slate-100 relative pb-16 min-h-screen">
      {/* Background Animated Floating Bubbles */}
      <div className="bubbles">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="bubble"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 border-b border-cyan-900/40 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <i className="fa-solid fa-fish-fins text-2xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400">
                  AquaSmart Guard
                </h1>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold uppercase tracking-wider">
                  Next.js Edition
                </span>
              </div>
              <p className="text-xs text-cyan-300/70">
                ระบบติดตามสภาวะตู้ปลา และ AI วิเคราะห์การดูแล (Blynk IoT & Gemini)
              </p>
            </div>
          </div>

          {/* Header Controls & Status Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* Blynk Sensor Connection & ESP32 Status */}
            {mode === "live" ? (
              <div className="flex items-center gap-2">
                {/* ESP32 Hardware Status Badge */}
                <div
                  className={`glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm border transition ${
                    isEspOnline
                      ? "border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                      : "border-rose-500/50 text-rose-300 bg-rose-500/10 animate-pulse"
                  }`}
                  title="สถานะการเชื่อมต่อจริงของบอร์ด ESP32 บน Blynk Cloud (isHardwareConnected)"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {isEspOnline && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isEspOnline ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    ></span>
                  </span>
                  <i className="fa-solid fa-microchip text-xs"></i>
                  <span className="font-semibold">
                    ESP32: {isEspOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Blynk Cloud Connection Badge */}
                <div
                  className={`glass-card px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1.5 text-xs border ${
                    blynkConnected ? "border-cyan-500/30 text-cyan-300" : "border-rose-500/30 text-rose-300"
                  }`}
                  title="สถานะการเชื่อมต่อกับ Blynk Cloud Server"
                >
                  <i className="fa-solid fa-cloud text-xs"></i>
                  <span>{blynkConnected ? "Cloud Sync" : "Cloud Fail"}</span>
                </div>
              </div>
            ) : (
              <div className="glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm border border-amber-500/40 text-amber-300">
                <i className="fa-solid fa-flask-vial text-amber-400 text-xs"></i>
                <span className="font-medium">โหมดจำลองค่า (Simulation)</span>
              </div>
            )}

            {/* Mode Toggle Button */}
            <button
              onClick={() => {
                if (mode === "live") {
                  setMode("sim");
                  setSimValues({ ...currentValues });
                } else {
                  setMode("live");
                  fetchBlynkData();
                }
              }}
              className={`glass-card hover:bg-cyan-500/20 px-3.5 py-1.5 rounded-full text-xs sm:text-sm flex items-center gap-2 border transition ${
                mode === "sim"
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                  : "border-cyan-500/30 text-slate-300 hover:text-white"
              }`}
              title="สลับระหว่างข้อมูลจริงจาก Blynk และโหมดทดลองปรับค่า"
            >
              <i
                className={`fa-solid fa-arrows-rotate text-cyan-400 ${
                  mode === "sim" || isRefreshing ? "animate-spin" : ""
                }`}
              ></i>
              <span>{mode === "live" ? "จำลองค่าสด" : "กลับไปใช้ Blynk สด"}</span>
            </button>

            {/* Manual Refresh / Polling Button in Live Mode */}
            {mode === "live" && (
              <button
                onClick={() => fetchBlynkData()}
                disabled={isRefreshing}
                className="glass-card hover:bg-cyan-500/20 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-cyan-500/30 text-cyan-300 transition disabled:opacity-50"
                title="ดึงข้อมูลจาก Blynk ทันที"
              >
                <i className={`fa-solid fa-rotate ${isRefreshing ? "animate-spin" : ""}`}></i>
                <span>รีเฟรช</span>
              </button>
            )}

            {/* Diagnostic Details Toggle */}
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="glass-card hover:bg-slate-700/40 px-2.5 py-1.5 rounded-full text-xs border border-slate-700 text-slate-400 hover:text-cyan-300 transition"
              title="ดูข้อมูลสถานะ ESP32 และ Blynk Pins"
            >
              <i className="fa-solid fa-terminal"></i>
            </button>
          </div>
        </header>

        {/* Diagnostics Bar (Collapsible) */}
        {showDiagnostics && (
          <div className="glass-card rounded-xl p-4 mb-6 border border-cyan-500/20 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center text-cyan-300 font-bold font-sans">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-satellite-dish"></i> สถานะฮาร์ดแวร์ ESP32 และ Blynk Cloud Pins
              </span>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-microchip"></i> ESP32 Board
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isEspOnline
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {isEspOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
                <div className="text-slate-300 mt-1">Status: {isEspOnline ? "เชื่อมต่อแล้ว" : "ขาดการเชื่อมต่อ"}</div>
                <div className="text-[10px] text-slate-400 truncate">.../isHardwareConnected</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-amber-400 font-semibold">Pin V0: อุณหภูมิ (Temp)</div>
                <div className="text-slate-300 mt-1">Raw: {rawBlynk.v0 ?? "รอข้อมูล..."}</div>
                <div className="text-[10px] text-slate-400 truncate">.../get?token=...&V0</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-blue-400 font-semibold">Pin V1: TDS / PPM</div>
                <div className="text-slate-300 mt-1">Raw: {rawBlynk.v1 ?? "รอข้อมูล..."}</div>
                <div className="text-[10px] text-slate-400 truncate">.../get?token=...&V1</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-cyan-400 font-semibold">Pin V2: ค่า pH</div>
                <div className="text-slate-300 mt-1">Raw: {rawBlynk.v2 ?? "รอข้อมูล..."}</div>
                <div className="text-[10px] text-slate-400 truncate">.../get?token=...&V2</div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Banner if ESP32 is offline */}
        {!isEspOnline && mode === "live" && (
          <div className="mb-6 p-4 rounded-2xl glass-card border border-rose-500/50 bg-rose-950/40 flex items-start gap-3.5 text-rose-200 shadow-xl shadow-rose-950/50 animate-pulse">
            <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl mt-0.5 shrink-0 border border-rose-500/30">
              <i className="fa-solid fa-triangle-exclamation text-xl text-rose-400"></i>
            </div>
            <div>
              <strong className="font-bold text-rose-300 text-sm sm:text-base block mb-1">
                แจ้งเตือน: อุปกรณ์ ESP32 ขาดการเชื่อมต่อ (ESP32 Offline)
              </strong>
              <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                บอร์ด ESP32 ไม่ได้เชื่อมต่อกับระบบ Blynk Cloud ในขณะนี้ (isHardwareConnected = false) ค่าวัดอุณหภูมิ (V0), TDS (V1), และ pH (V2) ที่แสดงอาจเป็นค่าล่าสุดที่ค้างอยู่ กรุณาตรวจเช็คการจ่ายไฟ การเชื่อมต่อ Wi-Fi หรือเฟิร์มแวร์บนตัวบอร์ด ESP32
              </p>
            </div>
          </div>
        )}


        {/* Section 1: Current Sensor Parameters (pH, PPM, Temp) */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-cyan-200 flex items-center gap-2">
                <i className="fa-solid fa-gauge-high text-cyan-400"></i>
                ค่าพารามิเตอร์ปัจจุบัน
              </h2>
              <span className="text-xs bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                เกณฑ์: {aiThresholds.speciesName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-cyan-300/70">
              {mode === "live" && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  โหมดดึงอัตโนมัติ (ทุก 3 วินาที)
                </span>
              )}
              <span>{lastUpdated}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* pH Card (V2) */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-cyan-500/10 text-9xl font-black select-none pointer-events-none">
                pH
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl shadow-inner">
                    <i className="fa-solid fa-flask text-xl"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium text-slate-300">ระดับความเป็นกรด-ด่าง</h3>
                      <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                        V2
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ค่าที่เหมาะสม: {aiThresholds.phMin} - {aiThresholds.phMax} pH
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${phStatus.colorClass}`}
                >
                  {phStatus.text}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  {Number(currentValues.ph).toFixed(1)}
                </span>
                <span className="text-sm text-slate-400 font-medium">pH</span>
              </div>

              {/* Progress Bar (0 to 14) */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentValues.ph / 14) * 100))}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>0 (กรดเข้มข้น)</span>
                <span>7.0 (กลาง)</span>
                <span>14 (ด่างเข้มข้น)</span>
              </div>
            </div>

            {/* PPM / TDS Card (V1) */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-blue-500/10 text-8xl font-black select-none pointer-events-none">
                PPM
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 text-blue-300 rounded-xl shadow-inner">
                    <i className="fa-solid fa-droplet text-xl"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium text-slate-300">ความบริสุทธิ์น้ำ (TDS)</h3>
                      <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                        V1
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ค่าที่เหมาะสม: {aiThresholds.ppmMin} - {aiThresholds.ppmMax} PPM
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ppmStatus.colorClass}`}
                >
                  {ppmStatus.text}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  {Math.round(currentValues.ppm)}
                </span>
                <span className="text-sm text-slate-400 font-medium">PPM</span>
              </div>

              {/* Progress Bar (0 to 1500 PPM) */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentValues.ppm / 1500) * 100))}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>0 PPM</span>
                <span>300 (ปกติ)</span>
                <span>1500+ PPM</span>
              </div>
            </div>

            {/* Temp Card (V0) */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-amber-500/10 text-9xl font-black select-none pointer-events-none">
                °C
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-300 rounded-xl shadow-inner">
                    <i className="fa-solid fa-temperature-half text-xl"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium text-slate-300">อุณหภูมิน้ำ</h3>
                      <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                        V0
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ค่าที่เหมาะสม: {aiThresholds.tempMin} - {aiThresholds.tempMax} °C
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${tempStatus.colorClass}`}
                >
                  {tempStatus.text}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  {Number(currentValues.temp).toFixed(1)}
                </span>
                <span className="text-sm text-slate-400 font-medium">°C</span>
              </div>

              {/* Progress Bar (10 to 40 °C) */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-400 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, ((currentValues.temp - 10) / 30) * 100)
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>10 °C</span>
                <span>28 °C (เหมาะ)</span>
                <span>40 °C</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Real-time Trends Chart & Simulator Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Chart.js Parameter Trend */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <h3 className="font-bold text-lg text-cyan-200 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-cyan-400"></i>
                แนวโน้มค่าวัดย้อนหลังแบบเรียลไทม์
              </h3>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center text-xs text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8] inline-block mr-1.5"></span>{" "}
                  pH
                </span>
                <span className="inline-flex items-center text-xs text-blue-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block mr-1.5"></span>{" "}
                  PPM
                </span>
                <span className="inline-flex items-center text-xs text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block mr-1.5"></span>{" "}
                  °C
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <canvas ref={chartCanvasRef}></canvas>
            </div>
          </div>

          {/* Manual Test Simulator Box */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-cyan-200 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-cyan-400"></i>
                  ปรับจำลองค่าในตู้ปลา
                </h3>
                {mode === "sim" && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-semibold border border-cyan-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-6">
                {mode === "sim"
                  ? "เลื่อนสไลเดอร์เพื่อทดสอบการตอบสนองของระบบแจ้งเตือนและกราฟทันที"
                  : "กดเปลี่ยนเป็นโหมดจำลองเพื่อทดลองปรับค่าพารามิเตอร์แบบ Manual"}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">ปรับค่า pH:</span>
                    <span className="text-cyan-300 font-bold">{Number(simValues.ph).toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="4.5"
                    max="9.5"
                    step="0.1"
                    value={simValues.ph}
                    onChange={(e) => {
                      if (mode !== "sim") setMode("sim");
                      handleSliderChange("ph", e.target.value);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">ปรับค่า PPM (TDS):</span>
                    <span className="text-blue-300 font-bold">{Math.round(simValues.ppm)}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="1500"
                    step="10"
                    value={simValues.ppm}
                    onChange={(e) => {
                      if (mode !== "sim") setMode("sim");
                      handleSliderChange("ppm", e.target.value);
                    }}
                    className="w-full accent-blue-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">ปรับอุณหภูมิ (°C):</span>
                    <span className="text-amber-300 font-bold">
                      {Number(simValues.temp).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16.0"
                    max="38.0"
                    step="0.1"
                    value={simValues.temp}
                    onChange={(e) => {
                      if (mode !== "sim") setMode("sim");
                      handleSliderChange("temp", e.target.value);
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
              <button
                onClick={handleResetSliders}
                className="text-xs text-slate-400 hover:text-cyan-300 transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-rotate-left"></i> คืนค่ามาตรฐาน
              </button>
              <span className="text-[11px] text-cyan-400/80 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/50">
                {mode === "live" ? "Live Feed Mode" : "Manual Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: AI Assistant Powered by Gemini */}
        <section className="glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden border border-cyan-500/30">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2 border border-cyan-500/30">
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Powered by Gemini
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ผู้ช่วย AI วิเคราะห์สภาวะปลาสายพันธุ์ต่างๆ
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                กรอกชื่อชนิดปลาที่คุณเลี้ยงเพื่อหาค่า pH, PPM และอุณหภูมิที่สมบูรณ์แบบที่สุด พร้อมคำแนะนำพิเศษ
              </p>
            </div>

            {/* API Key Config Box */}
            <div className="glass-card p-2.5 rounded-xl border border-slate-700 flex items-center gap-2 max-w-sm text-xs relative">
              <i className="fa-solid fa-key text-amber-400 pl-1"></i>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="ใส่ Gemini API Key (ตัวเลือก)"
                className="bg-transparent border-none focus:outline-none text-white text-xs w-full placeholder-slate-500 pr-1"
              />
              <button
                onClick={handleSaveApiKey}
                title="บันทึก Gemini Key"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-md transition text-xs whitespace-nowrap shadow font-medium"
              >
                บันทึก
              </button>

              {keySavedToast && (
                <div className="absolute -top-8 right-0 bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded shadow-lg animate-bounce">
                  บันทึก Key สำเร็จ!
                </div>
              )}
            </div>
          </div>

          {/* Quick Fish Presets */}
          <div className="mb-4">
            <span className="text-xs text-slate-400 mr-2">ปลายอดนิยม:</span>
            <div className="inline-flex flex-wrap gap-2 mt-1">
              {[
                "ปลาเทวดา (Angelfish)",
                "ปลาคาร์ฟ (Koi)",
                "ปลาปอมปาดัวร์ (Discus)",
                "ปลากัด (Betta)",
                "ปลาหางนกยูง (Guppy)",
                "ปลาหมอสี (Cichlid)",
                "ปลามังกร (Arowana)",
                "ปลาทอง (Goldfish)",
                "กุ้งแคระ (Dwarf Shrimp)",
              ].map((fish) => (
                <button
                  key={fish}
                  onClick={() => handleAskAi(fish)}
                  className="text-xs bg-slate-800/80 hover:bg-cyan-900/60 text-cyan-200 border border-slate-700 hover:border-cyan-500 px-3 py-1 rounded-full transition"
                >
                  {fish.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Box */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-fish"></i>
              </div>
              <input
                type="text"
                value={fishInput}
                onChange={(e) => setFishInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAskAi();
                }}
                placeholder="ระบุชนิดปลา เช่น ปลาเทวดา, Neon Tetra, ปลามังกร, กุ้งแคระ..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-slate-500 text-sm"
              />
            </div>
            <button
              onClick={() => handleAskAi()}
              disabled={isAiLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  <span>กำลังวิเคราะห์...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>สอบถาม AI</span>
                </>
              )}
            </button>
          </div>

          {/* AI Loading State */}
          {isAiLoading && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-cyan-400 border-t-transparent mb-3"></div>
              <p className="text-cyan-300 font-medium text-sm animate-pulse">
                กำลังสอบถาม AI Gemini และประมวลผลข้อมูลสายพันธุ์ปลา...
              </p>
            </div>
          )}

          {/* AI Response Output */}
          {aiResponse && !isAiLoading && (
            <div className="bg-slate-900/80 rounded-xl p-6 border border-cyan-500/30 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-lg">
                    <i className="fa-solid fa-circle-info text-xl"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-cyan-200">
                        {aiResponse.data.speciesName}
                      </h3>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                        {aiResponse.source === "gemini" ? "Gemini AI Live" : "Expert Database"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ค่าพารามิเตอร์ที่แนะนำและเหมาะสมที่สุดสำหรับสายพันธุ์นี้
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompareModalOpen(true)}
                    className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-code-compare"></i> เทียบกับค่าปัจจุบันในตู้
                  </button>
                  <button
                    onClick={handleApplyAiThresholds}
                    className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                    title="นำเกณฑ์นี้ไปใช้กับการคำนวณสถานะเตือนบนการ์ด"
                  >
                    <i className="fa-solid fa-check-double"></i> ใช้เกณฑ์นี้กับระบบ
                  </button>
                </div>
              </div>

              {/* Recommended Parameters Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <i className="fa-solid fa-flask text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">ค่า pH ที่แนะนำ</div>
                    <div className="text-lg font-bold text-cyan-300">
                      {aiResponse.data.phMin} - {aiResponse.data.phMax}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <i className="fa-solid fa-droplet text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">ค่า PPM (TDS) ที่แนะนำ</div>
                    <div className="text-lg font-bold text-blue-300">
                      {aiResponse.data.ppmMin} - {aiResponse.data.ppmMax} PPM
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <i className="fa-solid fa-temperature-half text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">อุณหภูมิที่แนะนำ</div>
                    <div className="text-lg font-bold text-amber-300">
                      {aiResponse.data.tempMin} - {aiResponse.data.tempMax} °C
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Tips Section */}
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <h4 className="text-sm font-semibold text-slate-200 mb-2.5 flex items-center gap-2">
                  <i className="fa-solid fa-lightbulb text-amber-400"></i> คำแนะนำและข้อควรระวังพิเศษ
                </h4>
                <div className="text-sm text-slate-300 leading-relaxed space-y-2">
                  {aiResponse.data.tips?.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <i className="fa-solid fa-circle-check text-cyan-400 mt-1 text-xs shrink-0"></i>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {aiResponse.note && (
                <div className="mt-3 text-[11px] text-slate-400 italic">
                  * {aiResponse.note}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Modal: Deep Comparison of Current Tank vs AI Recommended */}
        {compareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="glass-card max-w-2xl w-full rounded-2xl p-6 sm:p-7 border border-cyan-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setCompareModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition w-8 h-8 rounded-full bg-slate-800/60 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>

              {(() => {
                const comp = generateComparisonAnalysis();
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                        <i className="fa-solid fa-code-compare"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          ผลการเปรียบเทียบสภาวะน้ำปัจจุบัน
                        </h3>
                        <p className="text-xs text-cyan-300/80">
                          เทียบกับเกณฑ์ที่เหมาะสมของ: {comp.species}
                        </p>
                      </div>
                    </div>

                    {/* Overall Quality Score */}
                    <div className="bg-slate-900/90 rounded-xl p-4 mb-5 border border-cyan-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">ดัชนีความเหมาะสมของน้ำโดยรวม</div>
                        <div className="text-2xl font-black text-cyan-300">
                          {comp.score} / 100 คะแนน
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            comp.score >= 80
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : comp.score >= 50
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                          }`}
                        >
                          {comp.score >= 80
                            ? "สภาวะน้ำดีเยี่ยม"
                            : comp.score >= 50
                            ? "ควรปรับปรุงบางส่วน"
                            : "ต้องแก้ไขด่วน"}
                        </span>
                      </div>
                    </div>

                    {/* Comparison Cards */}
                    <div className="space-y-3 mb-6">
                      {comp.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60"
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-sm text-slate-200">
                              {item.param}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium ${
                                item.state === "good"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : item.state === "low"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {item.state === "good"
                                ? "สมบูรณ์แบบ 👍"
                                : item.state === "low"
                                ? "ต่ำกว่าเกณฑ์ ⚠️"
                                : "สูงกว่าเกณฑ์ ⚠️"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-2">
                            <div>
                              <span className="text-slate-500">ค่าปัจจุบันในตู้:</span>{" "}
                              <strong className="text-white">{item.current}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">เกณฑ์แนะนำ:</span>{" "}
                              <strong className="text-cyan-300">{item.recommended}</strong>
                            </div>
                          </div>
                          <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800 leading-relaxed">
                            <span className="text-amber-400 font-semibold">ข้อแนะนำแก้ไข: </span>
                            {item.action}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          handleApplyAiThresholds();
                          setCompareModalOpen(false);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-lg shadow-cyan-600/30"
                      >
                        นำเกณฑ์นี้ไปใช้กับหน้าแดชบอร์ด
                      </button>
                      <button
                        onClick={() => setCompareModalOpen(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition"
                      >
                        ปิดหน้าต่าง
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
          <p>© 2026 AquaSmart Guard - ระบบตรวจวัดตู้ปลาอัจฉริยะแบบเรียลไทม์ (Next.js & Blynk IoT)</p>
          <p className="mt-1 text-slate-600">
            Blynk Pins: V0 (Temperature), V1 (TDS/PPM), V2 (pH) | AI Engine: Gemini 3.5 Flash Lite
          </p>
        </footer>
      </div>
    </div>
  );
}

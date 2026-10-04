import { memo } from "react";

const Header = memo(({ isEspOnline, blynkConnected, isRefreshing, showDiagnostics, onRefresh, onToggleDiagnostics, rawBlynk }) => {
  return (
    <>
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

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm border transition ${
                isEspOnline
                  ? "border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                  : "border-rose-500/50 text-rose-300 bg-rose-500/10 animate-pulse"
              }`}
              title="สถานะการเชื่อมต่อจริงของบอร์ด ESP32 บน Blynk Cloud"
            >
              <span className="relative flex h-2.5 w-2.5">
                {isEspOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isEspOnline ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              </span>
              <i className="fa-solid fa-microchip text-xs"></i>
              <span className="font-semibold">ESP32: {isEspOnline ? "Online" : "Offline"}</span>
            </div>

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

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="glass-card hover:bg-cyan-500/20 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-cyan-500/30 text-cyan-300 transition disabled:opacity-50"
            title="ดึงข้อมูลจาก Blynk ทันที"
          >
            <i className={`fa-solid fa-rotate ${isRefreshing ? "animate-spin" : ""}`}></i>
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={onToggleDiagnostics}
            className="glass-card hover:bg-slate-700/40 px-2.5 py-1.5 rounded-full text-xs border border-slate-700 text-slate-400 hover:text-cyan-300 transition"
            title="ดูข้อมูลสถานะ ESP32 และ Blynk Pins"
          >
            <i className="fa-solid fa-terminal"></i>
          </button>
        </div>
      </header>

      {showDiagnostics && (
        <div className="glass-card rounded-xl p-4 mb-6 border border-cyan-500/20 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center text-cyan-300 font-bold font-sans">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-satellite-dish"></i> สถานะฮาร์ดแวร์ ESP32 และ Blynk Cloud Pins
            </span>
            <button onClick={onToggleDiagnostics} className="text-slate-400 hover:text-white">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            <DiagnosticCard title="ESP32 Board" value={rawBlynk.v0} endpoint="isHardwareConnected" />
            <DiagnosticCard title="Pin V0: อุณหภูมิ (Temp)" value={rawBlynk.v0} endpoint="...&V0" />
            <DiagnosticCard title="Pin V1: TDS / PPM" value={rawBlynk.v1} endpoint="...&V1" color="text-blue-400" />
            <DiagnosticCard title="Pin V2: ค่า pH" value={rawBlynk.v2} endpoint="...&V2" color="text-cyan-400" />
          </div>
        </div>
      )}
    </>
  );
});

const DiagnosticCard = ({ title, value, endpoint, color = "text-amber-400" }) => (
  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
    <div className={`${color} font-semibold`}>{title}</div>
    <div className="text-slate-300 mt-1">Raw: {value ?? "รอข้อมูล..."}</div>
    <div className="text-[10px] text-slate-400 truncate">.../get?token={endpoint}</div>
  </div>
);

Header.displayName = "Header";

export default Header;

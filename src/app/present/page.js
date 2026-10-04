"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export default function PresentPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState("slide"); // "slide" or "overview"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const containerRef = useRef(null);

  const TOTAL_SLIDES = 9;

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    if (viewMode === "overview") {
      const el = document.getElementById(`slide-section-${index}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is in an input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlide(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlide(TOTAL_SLIDES - 1);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        setViewMode((m) => (m === "slide" ? "overview" : "slide"));
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsLaserActive((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowHelp(false);
        setShowThumbnails(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, TOTAL_SLIDES]);

  // Presentation Timer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Laser Pointer tracking
  const handleMouseMove = (e) => {
    if (isLaserActive) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  const slidesMeta = [
    { id: 0, title: "หน้าปกโครงการ", tag: "AquaSmart Guard" },
    { id: 1, title: "อุปกรณ์ & Tech Stack (1)", tag: "ESP32 & pH" },
    { id: 2, title: "อุปกรณ์ & Virtual Pin (2)", tag: "TDS, Temp & Pin" },
    { id: 3, title: "หลักการทำงาน 4 ขั้นตอน", tag: "Workflow" },
    { id: 4, title: "โครงสร้างระบบโดยสรุป", tag: "Architecture" },
    { id: 5, title: "ปัญหาและแรงบันดาลใจ", tag: "Pain Points" },
    { id: 6, title: "แนวคิดการแก้ปัญหา", tag: "Solutions" },
    { id: 7, title: "ประโยชน์ที่ได้รับ", tag: "Benefits" },
    { id: 8, title: "ค่ามาตรฐาน & แผนปรับปรุง", tag: "Roadmap" },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#031B2E] text-white selection:bg-[#6FE3F5] selection:text-[#031B2E] font-sans overflow-x-hidden flex flex-col justify-between"
      style={{
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(14, 134, 166, 0.22) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(54, 194, 138, 0.16) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(10, 53, 80, 0.3) 0%, transparent 70%),
          linear-gradient(180deg, #031B2E 0%, #062B45 60%, #031B2E 100%)
        `,
      }}
    >
      {/* Laser Pointer overlay */}
      {isLaserActive && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
        >
          <div className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_15px_#ff0055,0_0_30px_#ff0055] animate-ping opacity-75 absolute"></div>
          <div className="w-4 h-4 rounded-full bg-red-400 border border-white shadow-[0_0_12px_#ff0000]"></div>
        </div>
      )}

      {/* Top Floating Header & Status Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-cyan-500/15 backdrop-blur-md bg-[#031B2E]/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#031B2E] rounded-[10px] flex items-center justify-center">
              <i className="fa-solid fa-fish text-cyan-400 text-lg"></i>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-base text-white">AquaSmart Guard</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30 font-medium">
                Presentation Deck
              </span>
            </div>
            <p className="text-xs text-[#7F9AA3] hidden sm:block">
              ระบบตรวจวัดคุณภาพน้ำตู้ปลาอัจฉริยะ & AI ผู้ช่วยดูแล
            </p>
          </div>
        </div>

        {/* Center: Slide indicator */}
        <div className="flex items-center gap-2">
          {viewMode === "slide" && (
            <div className="flex items-center gap-2 bg-[#062B45]/90 border border-cyan-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-200">
              <span className="text-cyan-400 font-bold text-sm">{currentSlide + 1}</span>
              <span className="text-[#7F9AA3]">/</span>
              <span className="text-[#7F9AA3]">{TOTAL_SLIDES}</span>
              <span className="hidden md:inline-block ml-1 text-slate-300 border-l border-cyan-500/20 pl-2">
                {slidesMeta[currentSlide].title}
              </span>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Presentation Timer */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#062B45]/70 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-slate-300">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? "หยุดเวลาชั่วคราว" : "เริ่มจับเวลา"}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <i className={`fa-solid ${isTimerRunning ? "fa-pause" : "fa-play"}`}></i>
            </button>
            <span className="font-mono font-medium text-cyan-100">{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => {
                setTimerSeconds(0);
                setIsTimerRunning(false);
              }}
              title="รีเซ็ตเวลา"
              className="text-[#7F9AA3] hover:text-rose-400 ml-1"
            >
              <i className="fa-solid fa-rotate-right text-[10px]"></i>
            </button>
          </div>

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === "slide" ? "overview" : "slide")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "overview"
                ? "bg-cyan-500 text-[#031B2E] border-cyan-400 shadow-md shadow-cyan-500/30"
                : "bg-[#062B45]/70 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/15"
            }`}
            title="สลับโหมดสไลด์เดี่ยว / ดูทั้งหมด (O)"
          >
            <i className={`fa-solid ${viewMode === "overview" ? "fa-table-cells-large" : "fa-film"}`}></i>
            <span className="hidden md:inline">{viewMode === "overview" ? "โหมดสไลด์ (Slide)" : "ดูทั้งหมด (Overview)"}</span>
          </button>

          {/* Laser Pointer */}
          <button
            onClick={() => setIsLaserActive(!isLaserActive)}
            className={`p-2 rounded-lg border transition-all ${
              isLaserActive
                ? "bg-red-500/30 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                : "bg-[#062B45]/70 border-cyan-500/20 text-[#7F9AA3] hover:text-cyan-300"
            }`}
            title="เลเซอร์พอยน์เตอร์สำหรับพรีเซนต์ (L)"
          >
            <i className="fa-solid fa-crosshairs"></i>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#062B45]/70 border border-cyan-500/20 text-[#7F9AA3] hover:text-cyan-300 transition-colors"
            title="เต็มจอ (F)"
          >
            <i className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`}></i>
          </button>

          {/* Help Modal */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg bg-[#062B45]/70 border border-cyan-500/20 text-[#7F9AA3] hover:text-cyan-300 transition-colors"
            title="คีย์ลัดการนำเสนอ (?)"
          >
            <i className="fa-solid fa-keyboard"></i>
          </button>

          {/* Link to live dashboard */}
          <Link
            href="/"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 font-medium transition-all"
            title="เปิดหน้าแดชบอร์ดระบบตู้ปลาจริง"
          >
            <i className="fa-solid fa-gauge-high"></i>
            <span>เปิดแดชบอร์ด</span>
          </Link>
        </div>
      </header>

      {/* Main Presentation Body */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 md:px-10 py-6 max-w-7xl mx-auto w-full">
        {viewMode === "slide" ? (
          /* Single Slide Presentation Mode */
          <div className="w-full transition-all duration-300 min-h-[580px] flex flex-col justify-center">
            {renderSlideContent(currentSlide, goToSlide, nextSlide)}
          </div>
        ) : (
          /* Continuous Overview / All Slides Mode */
          <div className="space-y-16 py-6 w-full">
            <div className="text-center pb-6 border-b border-cyan-500/20">
              <span className="text-xs uppercase tracking-widest text-[#6FE3F5] font-semibold">Overview Mode</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">สไลด์นำเสนอโครงการ AquaSmart Guard ทั้งหมด 9 สไลด์</h2>
              <p className="text-sm text-[#7F9AA3] mt-2">คลิกเพื่อสลับกลับสู่โหมดสไลด์เดี่ยว หรือเลื่อนอ่านข้อมูลสรุปครบถ้วนตามเอกสาร</p>
            </div>
            {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
              <div
                key={index}
                id={`slide-section-${index}`}
                className="scroll-mt-24 p-6 md:p-8 rounded-3xl bg-[#062B45]/40 border border-cyan-500/20 backdrop-blur-xl shadow-2xl relative"
              >
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-cyan-500/15">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-cyan-200 text-lg">{slidesMeta[index].title}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentSlide(index);
                      setViewMode("slide");
                    }}
                    className="px-3 py-1 text-xs rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500 hover:text-[#031B2E] transition-all font-medium flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-play text-[10px]"></i>
                    เปิดพรีเซนต์สไลด์นี้
                  </button>
                </div>
                {renderSlideContent(index, goToSlide, nextSlide)}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Slide Thumbnails Drawer Modal */}
      {showThumbnails && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 md:p-8"
          onClick={() => setShowThumbnails(false)}
        >
          <div
            className="bg-[#062B45] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-5xl shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <i className="fa-solid fa-list-check text-cyan-400"></i>
                สารบัญสไลด์ทั้งหมด (Slide Index)
              </h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-[#7F9AA3] hover:text-white text-sm p-1"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
              {slidesMeta.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    goToSlide(idx);
                    setShowThumbnails(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-28 transition-all group ${
                    currentSlide === idx
                      ? "bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg"
                      : "bg-[#031B2E]/80 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#031B2E]"
                  }`}
                >
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded w-max ${
                      currentSlide === idx ? "bg-cyan-400 text-[#031B2E]" : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="text-[11px] font-medium text-white line-clamp-2 group-hover:text-cyan-200">
                      {s.tag}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-[#062B45] border border-cyan-500/40 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-keyboard text-cyan-400 text-lg"></i>
                <h3 className="font-bold text-lg text-white">ปุ่มลัดการนำเสนอ (Shortcuts)</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-[#7F9AA3] hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs md:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">สไลด์ถัดไป</span>
                <div className="flex items-center gap-1 font-mono text-cyan-300">
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">Space</kbd>
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">→</kbd>
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">PageDown</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">สไลด์ก่อนหน้า</span>
                <div className="flex items-center gap-1 font-mono text-cyan-300">
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">←</kbd>
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">PageUp</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">เปิด / ปิด เต็มหน้าจอ</span>
                <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30 font-mono text-cyan-300">F</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">สลับโหมดสไลด์ / ดูทั้งหมด</span>
                <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30 font-mono text-cyan-300">O</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">เปิด / ปิด เลเซอร์พอยน์เตอร์</span>
                <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30 font-mono text-cyan-300">L</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-cyan-500/10">
                <span className="text-[#A9B8BD]">สไลด์แรก / สไลด์สุดท้าย</span>
                <div className="flex items-center gap-1 font-mono text-cyan-300">
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">Home</kbd>
                  <kbd className="px-2 py-1 rounded bg-[#031B2E] border border-cyan-500/30">End</kbd>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#031B2E] font-bold text-sm transition-all"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <footer className="relative z-30 px-6 py-4 border-t border-cyan-500/15 backdrop-blur-md bg-[#031B2E]/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Progress bar */}
          <div className="flex-1 max-w-xs md:max-w-md hidden sm:block">
            <div className="flex justify-between text-[11px] text-[#7F9AA3] mb-1.5">
              <span>ความคืบหน้านำเสนอ</span>
              <span className="font-mono text-cyan-300">{Math.round(((currentSlide + 1) / TOTAL_SLIDES) * 100)}%</span>
            </div>
            <div className="w-full bg-[#062B45] h-2 rounded-full overflow-hidden border border-cyan-500/20">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Center Navigation Buttons */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                currentSlide === 0
                  ? "opacity-30 cursor-not-allowed border-slate-700 bg-slate-800/40 text-slate-500"
                  : "bg-[#062B45] border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-md"
              }`}
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
              <span className="hidden md:inline">ก่อนหน้า</span>
            </button>

            {/* Slide Index Modal Button */}
            <button
              onClick={() => setShowThumbnails(true)}
              className="px-3.5 py-2 rounded-xl bg-[#062B45] border border-cyan-500/30 text-xs font-mono text-cyan-200 hover:border-cyan-400 transition-colors flex items-center gap-1.5"
              title="ดูรายการสไลด์ทั้งหมด"
            >
              <i className="fa-solid fa-layer-group text-cyan-400"></i>
              <span>
                {currentSlide + 1} / {TOTAL_SLIDES}
              </span>
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlide === TOTAL_SLIDES - 1}
              className={`px-5 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                currentSlide === TOTAL_SLIDES - 1
                  ? "opacity-30 cursor-not-allowed border-slate-700 bg-slate-800/40 text-slate-500"
                  : "bg-gradient-to-r from-cyan-500 to-teal-400 border-transparent text-[#031B2E] hover:from-cyan-400 hover:to-teal-300 shadow-lg shadow-cyan-500/25 font-bold"
              }`}
            >
              <span>ถัดไป</span>
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

          {/* Quick jump dots for desktop */}
          <div className="hidden lg:flex items-center gap-1.5">
            {slidesMeta.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToSlide(idx)}
                className={`transition-all duration-200 rounded-full ${
                  currentSlide === idx
                    ? "w-7 h-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_#6FE3F5]"
                    : "w-2.5 h-2.5 bg-[#062B45] border border-cyan-500/40 hover:bg-cyan-500/40"
                }`}
                title={`สไลด์ ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// RENDER SLIDE CONTENT HELPER FUNCTION
// ==========================================
function renderSlideContent(slideIndex, goToSlide, nextSlide) {
  switch (slideIndex) {
    // ----------------------------------------
    // SLIDE 1: COVER / HERO
    // ----------------------------------------
    case 0:
      return (
        <div className="flex flex-col items-center justify-center text-center py-8 md:py-14 relative">
          {/* Subtle glowing ambient behind hero */}
          <div className="absolute -top-10 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          {/* Top tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 via-[#062B45] to-emerald-500/15 border border-cyan-400/40 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(111,227,245,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs md:text-sm font-semibold tracking-wide text-[#6FE3F5]">
              ระบบตรวจวัดคุณภาพน้ำตู้ปลาอัจฉริยะ
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 drop-shadow-md">
            AquaSmart{" "}
            <span className="bg-gradient-to-r from-[#6FE3F5] via-[#4DA3FF] to-[#36C28A] bg-clip-text text-transparent">
              Guard
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="text-lg md:text-2xl text-slate-200 max-w-3xl leading-relaxed font-light mb-10 text-balance">
            ระบบติดตามสภาพน้ำในตู้ปลาแบบเรียลไทม์ พร้อมผู้ช่วย AI วิเคราะห์และแนะนำการดูแลตามสายพันธุ์ปลา
          </p>

          {/* Tech stack badge pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-10">
            <div className="p-3 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex items-center justify-center gap-2.5 shadow-lg group hover:border-cyan-400 hover:scale-105 transition-all">
              <i className="fa-solid fa-microchip text-[#6FE3F5] text-lg"></i>
              <span className="font-bold text-sm text-[#6FE3F5]">ESP32</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex items-center justify-center gap-2.5 shadow-lg group hover:border-cyan-400 hover:scale-105 transition-all">
              <i className="fa-solid fa-cloud-arrow-up text-[#6FE3F5] text-lg"></i>
              <span className="font-bold text-sm text-[#6FE3F5]">Blynk IoT</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex items-center justify-center gap-2.5 shadow-lg group hover:border-cyan-400 hover:scale-105 transition-all">
              <i className="fa-brands fa-react text-[#6FE3F5] text-lg"></i>
              <span className="font-bold text-sm text-[#6FE3F5]">Next.js</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex items-center justify-center gap-2.5 shadow-lg group hover:border-cyan-400 hover:scale-105 transition-all">
              <i className="fa-solid fa-wand-magic-sparkles text-[#6FE3F5] text-lg"></i>
              <span className="font-bold text-sm text-[#6FE3F5]">Gemini AI</span>
            </div>
          </div>

          {/* Live Demo Link Card & Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://aqua-smart-guard.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#062B45] border border-cyan-500/40 text-cyan-200 hover:text-white hover:border-cyan-300 hover:bg-cyan-500/20 font-medium text-sm transition-all shadow-md group"
            >
              <i className="fa-solid fa-globe text-cyan-400 group-hover:rotate-12 transition-transform"></i>
              <span>Live Demo: aqua-smart-guard.vercel.app</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-xs text-[#7F9AA3]"></i>
            </a>

            <button
              onClick={nextSlide}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6FE3F5] to-[#36C28A] text-[#031B2E] font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <span>เริ่มเข้าสู่เนื้อหา</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 2: HARDWARE & TECH STACK (1)
    // ----------------------------------------
    case 1:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#6FE3F5] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-microchip"></i>
              <span>HARDWARE & ARCHITECTURE • ตอนที่ 1</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">อุปกรณ์และเทคโนโลยีที่ใช้</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Col: Hardware Components (ESP32 & pH Sensor) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: ESP32 DevKit */}
              <div className="p-5 rounded-2xl bg-[#062B45]/70 border border-cyan-500/25 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30">
                      MAIN MCU
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Wi-Fi 2.4GHz
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#6FE3F5]">ESP32 DevKit</h3>
                  <p className="text-sm text-slate-300 mt-1">บอร์ดควบคุมหลัก เชื่อมต่อ Blynk Cloud</p>
                </div>

                <div className="my-4 relative bg-[#031B2E]/90 rounded-xl p-3 border border-cyan-500/20 flex items-center justify-center min-h-[170px] overflow-hidden group-hover:border-cyan-400/50 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/present/image1.png"
                    alt="ESP32 DevKit"
                    className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(111,227,245,0.25)]"
                  />
                  {/* Secondary LED indicator visual */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-[#062B45]/90 px-2 py-1 rounded-lg border border-cyan-500/30 text-[10px] text-cyan-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/present/image2.png" alt="LED" className="w-3.5 h-3.5 object-contain" />
                    <span>LED Status (GPIO 02)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#A9B8BD]">
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">30 Pins</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">ADC 12-bit</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">Blynk API</span>
                </div>
              </div>

              {/* Card 2: pH Sensor (E-201-C) */}
              <div className="p-5 rounded-2xl bg-[#062B45]/70 border border-cyan-500/25 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30">
                      VIRTUAL PIN V2
                    </span>
                    <span className="text-xs text-cyan-300 font-mono">0.0 - 14.0 pH</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#6FE3F5]">pH Sensor (E-201-C)</h3>
                  <p className="text-sm text-slate-300 mt-1">วัดค่ากรด-ด่างของน้ำ</p>
                </div>

                <div className="my-4 relative bg-[#031B2E]/90 rounded-xl p-3 border border-cyan-500/20 flex items-center justify-center min-h-[170px] overflow-hidden group-hover:border-cyan-400/50 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/present/image3.png"
                    alt="pH Sensor E-201-C"
                    className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(111,227,245,0.25)]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#A9B8BD]">
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">BNC Probe</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">Signal Mod</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">Analog ADC</span>
                </div>
              </div>
            </div>

            {/* Right Col: Tech Stack Box */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#6FE3F5]">
                  <i className="fa-solid fa-layer-group text-lg"></i>
                  <h3 className="text-2xl font-bold">Tech Stack</h3>
                </div>
                <div className="space-y-4">
                  {/* Firmware */}
                  <div className="p-3.5 rounded-xl bg-[#031B2E]/80 border border-cyan-500/20 flex items-start gap-3.5 hover:border-cyan-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-[#6FE3F5]">
                      <i className="fa-solid fa-code text-base"></i>
                    </div>
                    <div>
                      <span className="text-xs text-[#6FE3F5] font-semibold tracking-wide uppercase">Firmware</span>
                      <h4 className="text-base font-bold text-white">ESP32 (Arduino C++)</h4>
                      <p className="text-xs text-[#A9B8BD] mt-0.5">อ่านค่าจากเซนเซอร์ ควบคุมการส่งข้อมูลแบบ non-blocking</p>
                    </div>
                  </div>

                  {/* Cloud / IoT Platform */}
                  <div className="p-3.5 rounded-xl bg-[#031B2E]/80 border border-cyan-500/20 flex items-start gap-3.5 hover:border-cyan-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-[#6FE3F5]">
                      <i className="fa-solid fa-cloud text-base"></i>
                    </div>
                    <div>
                      <span className="text-xs text-[#6FE3F5] font-semibold tracking-wide uppercase">Cloud / IoT Platform</span>
                      <h4 className="text-base font-bold text-white">Blynk IoT</h4>
                      <p className="text-xs text-[#A9B8BD] mt-0.5">รับส่งข้อมูลเซนเซอร์ผ่าน Virtual Pins V0, V1, V2 แบบเรียลไทม์</p>
                    </div>
                  </div>

                  {/* Frontend / Dashboard */}
                  <div className="p-3.5 rounded-xl bg-[#031B2E]/80 border border-cyan-500/20 flex items-start gap-3.5 hover:border-cyan-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-[#6FE3F5]">
                      <i className="fa-brands fa-react text-base"></i>
                    </div>
                    <div>
                      <span className="text-xs text-[#6FE3F5] font-semibold tracking-wide uppercase">Frontend / Dashboard</span>
                      <h4 className="text-base font-bold text-white">Next.js (Vercel)</h4>
                      <p className="text-xs text-[#A9B8BD] mt-0.5">แดชบอร์ดเว็บทันสมัย แสดงผลกราฟ Chart.js และประมวลผลรวดเร็ว</p>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-3.5 rounded-xl bg-[#031B2E]/80 border border-cyan-500/20 flex items-start gap-3.5 hover:border-cyan-400/40 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 text-[#031B2E] flex items-center justify-center shrink-0 font-bold">
                      <i className="fa-solid fa-sparkles text-base"></i>
                    </div>
                    <div>
                      <span className="text-xs text-[#6FE3F5] font-semibold tracking-wide uppercase">AI วิเคราะห์</span>
                      <h4 className="text-base font-bold text-white">Google Gemini</h4>
                      <p className="text-xs text-[#A9B8BD] mt-0.5">ประเมินค่าน้ำร่วมกับข้อมูลสายพันธุ์ปลา และแนะนำวิธีดูแลเฉพาะตัว</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 3: HARDWARE (CONT.) & BLYNK VIRTUAL PIN
    // ----------------------------------------
    case 2:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#6FE3F5] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-network-wired"></i>
              <span>HARDWARE & PINOUT • ตอนที่ 2</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">อุปกรณ์ (ต่อ) & Blynk Virtual Pin</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Col: TDS & DS18B20 */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TDS Sensor */}
              <div className="p-5 rounded-2xl bg-[#062B45]/70 border border-cyan-500/25 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30">
                      PIN V1
                    </span>
                    <span className="text-xs text-cyan-300 font-mono">0 - 1000+ PPM</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#6FE3F5]">TDS Sensor</h3>
                  <p className="text-xs text-cyan-200 font-medium">(Analog EC Meter)</p>
                  <p className="text-sm text-slate-300 mt-1">วัดค่าความสกปรก / สารละลายในน้ำ</p>
                </div>

                <div className="my-4 relative bg-[#031B2E]/90 rounded-xl p-3 border border-cyan-500/20 flex items-center justify-center min-h-[170px] overflow-hidden group-hover:border-cyan-400/50 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/present/image4.png"
                    alt="TDS Sensor V1.0"
                    className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(111,227,245,0.25)]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#A9B8BD]">
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">Waterproof</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">3.3V / 5.0V</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">TDS PPM</span>
                </div>
              </div>

              {/* DS18B20 Temp Sensor */}
              <div className="p-5 rounded-2xl bg-[#062B45]/70 border border-cyan-500/25 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-[#6FE3F5] border border-cyan-400/30">
                      PIN V0
                    </span>
                    <span className="text-xs text-cyan-300 font-mono">-55°C ถึง 125°C</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#6FE3F5]">DS18B20 Sensor</h3>
                  <p className="text-xs text-cyan-200 font-medium">(Digital 1-Wire)</p>
                  <p className="text-sm text-slate-300 mt-1">วัดอุณหภูมิน้ำแบบกันน้ำ (waterproof)</p>
                </div>

                <div className="my-4 relative bg-[#031B2E]/90 rounded-xl p-3 border border-cyan-500/20 flex items-center justify-center min-h-[170px] overflow-hidden group-hover:border-cyan-400/50 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/present/image5.png"
                    alt="DS18B20 Waterproof"
                    className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(111,227,245,0.25)]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#A9B8BD]">
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">Stainless Steel</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">±0.5°C Prec.</span>
                  <span className="px-2 py-0.5 rounded bg-[#031B2E] border border-cyan-500/20">1-Wire Bus</span>
                </div>
              </div>
            </div>

            {/* Right Col: Blynk Virtual Pin mapping */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#6FE3F5]">
                    <i className="fa-solid fa-satellite-dish text-lg"></i>
                    <h3 className="text-2xl font-bold">Blynk Virtual Pin</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                    Cloud Synced
                  </span>
                </div>
                <p className="text-xs text-[#A9B8BD] mb-5">
                  ช่องทางการสื่อสารข้อมูลแบบ Virtual Data Streams ระหว่างฮาร์ดแวร์ ESP32 และแดชบอร์ด
                </p>

                <div className="space-y-3.5">
                  {/* V0 */}
                  <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-[#062B45] font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                      V0
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-white">อุณหภูมิ</h4>
                        <span className="text-xs font-mono text-cyan-300">°C</span>
                      </div>
                      <p className="text-xs text-[#6FE3F5] font-medium">Temperature · DS18B20</p>
                      <p className="text-[11px] text-[#7F9AA3] mt-0.5">ตรวจจับอุณหภูมิน้ำเพื่อป้องกันปลาช็อกน้ำ</p>
                    </div>
                  </div>

                  {/* V1 */}
                  <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-[#062B45] font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      V1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-white">TDS</h4>
                        <span className="text-xs font-mono text-emerald-300">PPM</span>
                      </div>
                      <p className="text-xs text-[#6FE3F5] font-medium">PPM · TDS Sensor</p>
                      <p className="text-[11px] text-[#7F9AA3] mt-0.5">วัดสารละลายรวม บ่งชี้ความสะอาดของน้ำ</p>
                    </div>
                  </div>

                  {/* V2 */}
                  <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-[#062B45] font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      V2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-white">pH</h4>
                        <span className="text-xs font-mono text-amber-300">pH scale</span>
                      </div>
                      <p className="text-xs text-[#6FE3F5] font-medium">pH Sensor (E-201-C)</p>
                      <p className="text-[11px] text-[#7F9AA3] mt-0.5">วัดสมดุลกรด-ด่างที่สำคัญต่อสุขภาพปลา</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 4: HOW IT WORKS (4 STEPS)
    // ----------------------------------------
    case 3:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#6FE3F5] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-arrows-spin"></i>
              <span>SYSTEM WORKFLOW</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">หลักการทำงาน 4 ขั้นตอน</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md relative flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#6FE3F5] mb-2">ตรวจวัดค่าน้ำ</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ESP32 อ่านค่า pH, TDS, อุณหภูมิ จากเซนเซอร์เป็นระยะ แล้วส่งขึ้น Blynk Cloud ผ่าน Virtual Pin
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <i className="fa-solid fa-microchip"></i>
                <span>Sensors → ESP32 → Blynk</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md relative flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#6FE3F5] mb-2">Dashboard ดึงข้อมูล</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  เว็บ Next.js ดึงค่าล่าสุดจาก Blynk มาแสดงผลแบบเรียลไทม์ พร้อมกราฟแนวโน้มย้อนหลัง
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <i className="fa-solid fa-chart-line"></i>
                <span>Blynk REST → Next.js UI</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md relative flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                  3
                </div>
                <h3 className="text-xl font-bold text-[#6FE3F5] mb-2">เลือกชนิดปลา + ถาม AI</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ผู้ใช้เลือกหรือพิมพ์ชนิดปลาที่เลี้ยง แล้วกดสอบถาม AI บนหน้าเว็บ
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <i className="fa-solid fa-fish"></i>
                <span>Species Query Input</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md relative flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                  4
                </div>
                <h3 className="text-xl font-bold text-[#6FE3F5] mb-2">Gemini วิเคราะห์และแนะนำ</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ส่งค่าที่วัดได้พร้อมชนิดปลาไปให้ Gemini วิเคราะห์ แล้วแสดงคำแนะนำการดูแลบนหน้าเว็บ
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>AI Insights & Water Care</span>
              </div>
            </div>
          </div>

          {/* Workflow Bottom Visual Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-[#062B45]/50 border border-cyan-500/20 flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2 text-cyan-300">
              <i className="fa-solid fa-circle-check text-emerald-400"></i> เซนเซอร์อัตโนมัติ 24 ชม.
            </span>
            <span className="text-[#7F9AA3]">➔</span>
            <span className="flex items-center gap-2 text-cyan-300">
              <i className="fa-solid fa-circle-check text-emerald-400"></i> คลาวด์ซิงก์เรียลไทม์
            </span>
            <span className="text-[#7F9AA3]">➔</span>
            <span className="flex items-center gap-2 text-cyan-300">
              <i className="fa-solid fa-circle-check text-emerald-400"></i> แดชบอร์ดสรุปผลเข้าใจง่าย
            </span>
            <span className="text-[#7F9AA3]">➔</span>
            <span className="flex items-center gap-2 text-cyan-300">
              <i className="fa-solid fa-circle-check text-emerald-400"></i> ผู้ช่วย AI ดูแลปลาเฉพาะสายพันธุ์
            </span>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 5: SYSTEM ARCHITECTURE (DATA FLOW)
    // ----------------------------------------
    case 4:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#6FE3F5] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-diagram-project"></i>
              <span>DATA FLOW & ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">โครงสร้างระบบโดยสรุป</h2>
          </div>

          {/* 5-Node Pipeline Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {/* Node 1 */}
            <div className="p-4 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-[#062B45] font-black text-sm flex items-center justify-center mx-auto mb-2">
                  1
                </div>
                <h4 className="text-base font-bold text-white">เซนเซอร์</h4>
                <p className="text-xs text-[#6FE3F5] font-medium mt-1">pH · TDS · DS18B20</p>
              </div>
              <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-[#A9B8BD]">
                ตรวจวัดกายภาพและเคมี
              </div>
            </div>

            {/* Node 2 */}
            <div className="p-4 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-[#062B45] font-black text-sm flex items-center justify-center mx-auto mb-2">
                  2
                </div>
                <h4 className="text-base font-bold text-white">ESP32 DevKit</h4>
                <p className="text-xs text-[#6FE3F5] font-medium mt-1">อ่านค่าและส่งขึ้น Cloud</p>
              </div>
              <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-[#A9B8BD]">
                ประมวลผล & เชื่อม Wi-Fi
              </div>
            </div>

            {/* Node 3 */}
            <div className="p-4 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-[#062B45] font-black text-sm flex items-center justify-center mx-auto mb-2">
                  3
                </div>
                <h4 className="text-base font-bold text-white">Blynk Cloud</h4>
                <p className="text-xs text-[#6FE3F5] font-medium mt-1">Virtual Pin V0 / V1 / V2</p>
              </div>
              <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-[#A9B8BD]">
                ศูนย์กลาง IoT Telemetry
              </div>
            </div>

            {/* Node 4 */}
            <div className="p-4 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-[#062B45] font-black text-sm flex items-center justify-center mx-auto mb-2">
                  4
                </div>
                <h4 className="text-base font-bold text-white">Next.js Dashboard</h4>
                <p className="text-xs text-[#6FE3F5] font-medium mt-1">Deploy บน Vercel</p>
              </div>
              <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-[#A9B8BD]">
                เว็บแอปพลิเคชัน & กราฟ
              </div>
            </div>

            {/* Node 5 */}
            <div className="p-4 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-400 transition-all text-center">
              <div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-[#062B45] font-black text-sm flex items-center justify-center mx-auto mb-2">
                  5
                </div>
                <h4 className="text-base font-bold text-white">Gemini AI</h4>
                <p className="text-xs text-[#6FE3F5] font-medium mt-1">วิเคราะห์คุณภาพน้ำ</p>
              </div>
              <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-[#A9B8BD]">
                วิเคราะห์อัจฉริยะรายพันธุ์
              </div>
            </div>
          </div>

          {/* Web Output Showcase Section */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#062B45] via-[#0A3550] to-[#062B45] border border-cyan-400/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-[#6FE3F5]">
              <i className="fa-solid fa-desktop text-xl"></i>
              <h3 className="text-2xl font-bold">แสดงผลบนหน้าเว็บ</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Output 1: Real-time */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-lg text-white">Real-time</span>
                </div>
                <p className="text-xs text-slate-300">
                  แสดงผลค่าอุณหภูมิ, TDS, และ pH ล่าสุดที่อ่านได้จากเซนเซอร์ตู้ปลาสดใหม่ต่อเนื่อง
                </p>
              </div>

              {/* Output 2: กราฟย้อนหลัง */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold">
                  <i className="fa-solid fa-chart-line text-cyan-400"></i>
                  <span className="text-lg text-white">กราฟย้อนหลัง</span>
                </div>
                <p className="text-xs text-slate-300">
                  วิเคราะห์แนวโน้มการเปลี่ยนแปลงค่าน้ำ เลือกดูได้แบบรายนาที, ชั่วโมง, วัน, สัปดาห์ และเดือน
                </p>
              </div>

              {/* Output 3: คำแนะนำ AI */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/30 hover:border-cyan-400 transition-all">
                <div className="flex items-center gap-2 mb-2 text-[#FFD166] font-bold">
                  <i className="fa-solid fa-wand-magic-sparkles text-[#FFD166]"></i>
                  <span className="text-lg text-white">คำแนะนำ AI</span>
                </div>
                <p className="text-xs text-slate-300">
                  รายงานการประเมินสภาวะตู้ปลา แจ้งเตือนความเสี่ยง และแนะนำวิธีการปรับปรุงน้ำแบบละเอียด
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 6: PROBLEMS & INSPIRATION
    // ----------------------------------------
    case 5:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#FF8A5B] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>PROBLEM STATEMENT</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">ปัญหาและแรงบันดาลใจ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Problem 1 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-rose-500/30 backdrop-blur-md flex items-start gap-4 hover:border-rose-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white transition-all">
                1
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  ปัญหาที่พบ
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  คนเลี้ยงปลาไม่รู้สภาพน้ำจนกว่าปลาจะแสดงอาการผิดปกติ
                </h3>
                <p className="text-xs text-[#A9B8BD] mt-2">
                  เมื่อปลาเริ่มลอยหัว หายใจเร็ว หรือว่ายผิดปกติ สภาพน้ำมักวิกฤตไปแล้ว ทำให้แก้ไขไม่ทันท่วงทีและสูญเสียปลา
                </p>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-rose-500/30 backdrop-blur-md flex items-start gap-4 hover:border-rose-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white transition-all">
                2
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  ปัญหาที่พบ
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  การตรวจน้ำด้วยชุดทดสอบเองต้องทำบ่อยและใช้เวลา
                </h3>
                <p className="text-xs text-[#A9B8BD] mt-2">
                  ชุดทดสอบแบบหยดสารเคมีหรือกระดาษวัดยุ่งยาก สิ้นเปลือง และผู้เลี้ยงมักละเลยที่จะตรวจอย่างสม่ำเสมอ
                </p>
              </div>
            </div>

            {/* Problem 3 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-rose-500/30 backdrop-blur-md flex items-start gap-4 hover:border-rose-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white transition-all">
                3
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  ปัญหาที่พบ
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  ไม่มีเครื่องมือที่แสดงแนวโน้มค่าน้ำย้อนหลังให้ดูภาพรวม
                </h3>
                <p className="text-xs text-[#A9B8BD] mt-2">
                  การวัดค่าแบบครั้งคราวไม่แสดงให้เห็นการสะสมของของเสีย การเปลี่ยนแปลงตามสภาพอากาศ หรือผลจากการเปลี่ยนน้ำ
                </p>
              </div>
            </div>

            {/* Problem 4 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-rose-500/30 backdrop-blur-md flex items-start gap-4 hover:border-rose-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white transition-all">
                4
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  ปัญหาที่พบ
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  ขาดคำแนะนำที่เฉพาะเจาะจงกับชนิดปลาที่เลี้ยงจริง
                </h3>
                <p className="text-xs text-[#A9B8BD] mt-2">
                  ปลาแต่ละชนิดต้องการ pH, อุณหภูมิ และความกระด้างของน้ำต่างกันโดยสิ้นเชิง ไม่มีระบบใดวิเคราะห์แบบระบุพันธุ์ปลา
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 7: SOLUTION CONCEPT
    // ----------------------------------------
    case 6:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#36C28A] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-lightbulb"></i>
              <span>SOLUTION STRATEGY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">แนวคิดการแก้ปัญหา</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Solution 1: เซนเซอร์ */}
            <div className="p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-[#031B2E] flex items-center justify-center mb-4 text-xl font-bold shadow-md shadow-cyan-500/20">
                  <i className="fa-solid fa-microchip"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">เซนเซอร์</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ตรวจวัด pH, TDS, อุณหภูมิ แบบเรียลไทม์
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs text-cyan-300">
                Continuous Sensing 24/7
              </div>
            </div>

            {/* Solution 2: Blynk Cloud */}
            <div className="p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-[#031B2E] flex items-center justify-center mb-4 text-xl font-bold shadow-md shadow-emerald-500/20">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Blynk Cloud</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  ESP32 ส่งค่าขึ้น Cloud ผ่าน Virtual Pin
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs text-cyan-300">
                IoT Telemetry Everywhere
              </div>
            </div>

            {/* Solution 3: Dashboard */}
            <div className="p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-[#031B2E] flex items-center justify-center mb-4 text-xl font-bold shadow-md shadow-teal-500/20">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dashboard</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Next.js ดึงค่ามาแสดงกราฟย้อนหลังแบบเรียลไทม์
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs text-cyan-300">
                Instant Visual Insights
              </div>
            </div>

            {/* Solution 4: Gemini AI */}
            <div className="p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400 hover:-translate-y-1 transition-all shadow-xl group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FFD166] to-amber-500 text-[#031B2E] flex items-center justify-center mb-4 text-xl font-bold shadow-md shadow-amber-500/20">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gemini AI</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  วิเคราะห์คุณภาพน้ำให้เหมาะกับชนิดปลาที่เลี้ยง
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-cyan-500/20 text-xs text-amber-300">
                Tailored AI Fish Assistant
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 8: BENEFITS
    // ----------------------------------------
    case 7:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#36C28A] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-trophy"></i>
              <span>VALUE PROPOSITION</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">ประโยชน์ที่ได้</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Benefit 1 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-emerald-500/30 backdrop-blur-md flex items-start gap-4 hover:border-emerald-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-[#031B2E] transition-all">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">รู้ปัญหาก่อนปลาป่วย</h3>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                  ตรวจจับความเปลี่ยนแปลงของน้ำได้ทันที ไม่ต้องรอสังเกตปลา
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
                  <i className="fa-solid fa-shield-heart"></i>
                  <span>Early Warning Detection • ลดการสูญเสีย</span>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md flex items-start gap-4 hover:border-cyan-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#6FE3F5]">เห็นแนวโน้มย้อนหลัง</h3>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                  กราฟแสดงค่าน้ำแบบเรียลไทม์ ดูรูปแบบการเปลี่ยนแปลงได้
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-300">
                  <i className="fa-solid fa-chart-area"></i>
                  <span>Time Series Analytics • ปรับรอบการเปลี่ยนน้ำได้แม่นยำ</span>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md flex items-start gap-4 hover:border-cyan-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#6FE3F5]">เข้าถึงได้ทุกที่</h3>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                  Dashboard บนเว็บ เปิดดูจากมือถือหรือคอมได้ตลอดเวลา
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-300">
                  <i className="fa-solid fa-mobile-screen"></i>
                  <span>Any Device • ไม่ต้องติดตั้งแอพ ใช้งานผ่านเว็บบราวเซอร์</span>
                </div>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="p-6 rounded-2xl bg-[#062B45]/80 border border-cyan-500/30 backdrop-blur-md flex items-start gap-4 hover:border-cyan-400 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-[#031B2E] transition-all">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#6FE3F5]">คำแนะนำเฉพาะปลา</h3>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                  AI วิเคราะห์ตามชนิดปลาที่เลี้ยงจริง ไม่ใช่ค่ามาตรฐานทั่วไป
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-300">
                  <i className="fa-solid fa-dna"></i>
                  <span>Species-Specific Care • แม่นยำตามหลักชีววิทยาของปลา</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------
    // SLIDE 9: STANDARDS & ROADMAP / IMPROVEMENTS
    // ----------------------------------------
    case 8:
      return (
        <div className="space-y-6">
          {/* Slide Header */}
          <div className="border-b border-cyan-500/20 pb-4">
            <div className="text-xs uppercase tracking-widest text-[#FFD166] font-semibold flex items-center gap-2">
              <i className="fa-solid fa-sliders"></i>
              <span>BENCHMARKS & ROADMAP</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-1">ค่ามาตรฐานและสถานะที่ต้องปรับปรุง</h2>
          </div>

          {/* Section A: Standard Parameters Showcase */}
          <div className="p-6 rounded-2xl bg-[#062B45]/90 border border-cyan-500/30 backdrop-blur-md shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  ตัวอย่างค่าสำหรับปลาหมอสี (Cichlid)
                </span>
                <p className="text-xs text-[#A9B8BD] mt-0.5">
                  * ค่ามาตรฐานจะเปลี่ยนไปตามชนิดปลาที่เลือกในระบบผ่านคำแนะนำของ AI
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 w-max">
                Safe Range Metrics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* pH Range Card */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#6FE3F5]">pH</span>
                  <span className="text-xs font-mono text-[#A9B8BD]">ช่วงมาตรวัด 0 - 14</span>
                </div>
                <div className="text-3xl font-black text-white font-mono my-2">7.5 – 8.6</div>
                {/* Visual Gauge Bar */}
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-3">
                  {/* Safe zone: 7.5 to 8.6 out of 14 -> 53% to 61% */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{ left: "53%", width: "10%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6FE3F5] font-mono mt-1.5">
                  <span>0</span>
                  <span className="text-emerald-300 font-bold">Safe: 7.5 - 8.6</span>
                  <span>14</span>
                </div>
              </div>

              {/* TDS Range Card */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#6FE3F5]">TDS (PPM)</span>
                  <span className="text-xs font-mono text-[#A9B8BD]">ช่วงมาตรวัด 0 - 1000</span>
                </div>
                <div className="text-3xl font-black text-white font-mono my-2">250 – 450</div>
                {/* Visual Gauge Bar */}
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-3">
                  {/* Safe zone: 250 to 450 out of 1000 -> 25% to 45% */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{ left: "25%", width: "20%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6FE3F5] font-mono mt-1.5">
                  <span>0</span>
                  <span className="text-emerald-300 font-bold">Safe: 250 - 450</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Temp Range Card */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#6FE3F5]">อุณหภูมิ (°C)</span>
                  <span className="text-xs font-mono text-[#A9B8BD]">ช่วงมาตรวัด 15 - 35°C</span>
                </div>
                <div className="text-3xl font-black text-white font-mono my-2">25 – 28.5</div>
                {/* Visual Gauge Bar */}
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-3">
                  {/* Safe zone: 25 to 28.5 out of (35-15)=20 -> (10 to 13.5)/20 = 50% to 67.5% */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{ left: "50%", width: "17.5%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6FE3F5] font-mono mt-1.5">
                  <span>15°C</span>
                  <span className="text-emerald-300 font-bold">Safe: 25 - 28.5°C</span>
                  <span>35°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: สถานะที่ต้องแก้ไขเพิ่มเติม */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#062B45] via-[#08304E] to-[#062B45] border border-amber-400/40 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-[#FFD166]">
              <i className="fa-solid fa-wrench text-xl"></i>
              <h3 className="text-xl md:text-2xl font-bold">สถานะที่ต้องแก้ไขเพิ่มเติม</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Task 1 */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-amber-400/30 flex items-start gap-3 hover:border-amber-400 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-[#FFD166] flex items-center justify-center shrink-0 font-bold">
                  <i className="fa-solid fa-wifi"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    เชื่อมต่อ ESP32 กับ Blynk Cloud ให้ออนไลน์ตลอดเวลา
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1">
                    ปัจจุบันขึ้น Offline เป็นบางครั้ง — ปรับปรุงกลไก Reconnect loop ในเฟิร์มแวร์
                  </p>
                </div>
              </div>

              {/* Task 2 */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-amber-400/30 flex items-start gap-3 hover:border-amber-400 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-[#FFD166] flex items-center justify-center shrink-0 font-bold">
                  <i className="fa-solid fa-plug"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    ตรวจสอบการต่อสาย TDS Sensor
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1">
                    พบค่าอ่านได้ 0 PPM ผิดปกติ — เช็คขา Analog Pin และแรงดันไฟเลี้ยงเซนเซอร์
                  </p>
                </div>
              </div>

              {/* Task 3 */}
              <div className="p-4 rounded-xl bg-[#031B2E]/90 border border-amber-400/30 flex items-start gap-3 hover:border-amber-400 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-[#FFD166] flex items-center justify-center shrink-0 font-bold">
                  <i className="fa-solid fa-vial"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    Calibrate pH Sensor ด้วยน้ำยา Buffer มาตรฐาน
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1">
                    ปรับเทียบด้วยน้ำยา pH 4.0 / 6.86 / 9.18 เพื่อความแม่นยำสูงสุด
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

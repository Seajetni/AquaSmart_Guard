import "./globals.css";

export const metadata = {
  title: "ระบบติดตามตู้ปลาอัจฉริยะ & AI ผู้ช่วยดูแลปลา (AquaSmart Guard)",
  description: "ระบบติดตามสภาวะตู้ปลาและ AI วิเคราะห์การดูแล เชื่อมต่อเซ็นเซอร์ Blynk V0, V1, V2 และ Gemini AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="antialiased text-slate-100 relative min-h-screen">
        {children}
      </body>
    </html>
  );
}

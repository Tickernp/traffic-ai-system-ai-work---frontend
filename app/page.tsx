import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#f4f7fe] font-sans">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">Traffic Intelligence</h1>
      <p className="text-slate-500 mb-8">ระบบตรวจจับและนับปริมาณการจราจรด้วย AI</p>
      <Link 
        href="/dashboard" 
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-md"
      >
        เข้าสู่หน้า Dashboard
      </Link>
    </div>
  );
}

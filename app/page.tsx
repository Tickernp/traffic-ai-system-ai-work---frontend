import Link from "next/link"
import { ArrowRight, Radio, ShieldCheck } from "lucide-react"

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#fff4c2] px-6 py-14 text-[#111827] md:px-12">
      <div className="pointer-events-none fixed inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(#d9c98255 1px, transparent 1px), linear-gradient(90deg, #d9c98255 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div className="mb-8 inline-flex items-center gap-3 border-2 border-black bg-white px-5 py-3 font-mono text-xs font-black tracking-[0.16em] shadow-[3px_3px_0_#000]">
          <span className="h-3 w-3 rounded-full bg-[#22c55e]" /> CITY TRAFFIC CONTROL PLATFORM
        </div>
        <h1 className="text-7xl font-black leading-[.88] tracking-[-.075em] sm:text-8xl md:text-9xl">TRAFFIC<br /><span className="text-[#e94e38] [text-shadow:3px_4px_0_#111827]">SYSTEM</span></h1>
        <p className="mt-8 max-w-3xl text-base font-bold leading-8 text-slate-700 sm:text-lg md:text-xl">ระบบติดตาม วิเคราะห์ และจำลองการจราจร เพื่อช่วยให้ทุกแยกปลอดภัยและรถเคลื่อนตัวได้ดีขึ้น</p>
        <div className="mt-9 flex flex-wrap justify-center gap-5">
          <Link href="/dashboard" className="inline-flex min-h-14 items-center gap-3 border-4 border-black bg-[#fde047] px-6 font-mono text-sm font-black shadow-[5px_5px_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000]">
            <Radio size={15} /> เข้าสู่ระบบ <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-9 flex items-center gap-3 font-mono text-[11px] font-bold tracking-wide text-slate-600"><ShieldCheck size={17} className="text-emerald-700" /> SMART SIGNALS · SAFER STREETS</div>
      </section>
    </main>
  )
}

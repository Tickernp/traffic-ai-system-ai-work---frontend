"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"
import { usePathname } from "next/navigation"
import { ArrowLeft, Video, Activity, Home, BarChart2, Settings, Gamepad2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { DEFAULT_TRAFFIC_SETTINGS, loadTrafficSettings } from "@/lib/traffic-settings"
import { apiUrl } from "@/lib/api"

export default function LiveCCTVPage() {
  const pathname = usePathname()
  const [videoAI, setVideoAI] = useState(DEFAULT_TRAFFIC_SETTINGS.videoAI)

  useEffect(() => {
    setVideoAI(loadTrafficSettings().videoAI)
  }, [])

  const videoFeedUrl = apiUrl(`/api/video-feed?tracking=${videoAI.trackingEnabled}&confidence=${videoAI.confidence}`)
  return (
    <div className="flex h-dvh bg-[#fef3c7] overflow-hidden font-mono text-black">
      
            {/* Sidebar มาตรฐานเดียวกันทุกหน้า */}
      <aside className="w-64 bg-gray-900 flex flex-col py-8 px-4 gap-6 text-white shrink-0 border-r-4 border-black z-10 hidden lg:flex">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-300 border-2 border-white rounded-none shadow-[2px_2px_0_0_#fff]"></div>
          <h1 className="text-xl font-black tracking-widest uppercase">TRAFFIC<br/>SYSTEM</h1>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-gray-500 text-xs font-bold mb-2 uppercase">Main Menu</p>
          
          <Link href="/dashboard" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/dashboard" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Home className="w-5 h-5" /> Dashboard
          </Link>
          
          <Link href="/live" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/live" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Video className="w-5 h-5" /> Live CCTV
          </Link>
          
          <Link href="/reports" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/reports" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <BarChart2 className="w-5 h-5" /> Reports
          </Link>

          {/* ใช้คำว่า GAME SIMULATOR เหมือนกันทุกหน้า */}
          <Link href="/game" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/game" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Gamepad2 className="w-5 h-5" /> Game Simulator
          </Link>

          <Link href="/settings" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/settings" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <main className="min-h-0 min-w-0 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px] flex flex-col">
        <MobileNav />
        
        {/* แถบด้านบน (Header) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-red-400 p-3 border-4 border-black shadow-[4px_4px_0_0_#000]">
              <Video className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase">CCTV Monitor</h1>
              <div className="flex items-center gap-2 font-bold text-gray-600 mt-1 uppercase">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 border-2 border-black bg-red-500"></span>
                </span>
                Streaming Active
              </div>
            </div>
          </div>
          
          {/* ปุ่มกลับไปหน้า Dashboard */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 bg-blue-400 text-black px-6 py-3 font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>

        {/* กรอบแสดงวิดีโอ (Retro TV Style) */}
        <Card className="flex-1 rounded-none border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-gray-300 flex flex-col p-4 md:p-6">
          <div className="w-full h-full bg-black border-4 md:border-8 border-gray-800 relative flex items-center justify-center shadow-inner overflow-hidden">
            
            {/* ดึงภาพ Live Stream จาก FastAPI */}
            <img 
              src={videoFeedUrl}
              alt="Live Traffic Feed" 
              className="w-full h-full object-contain" 
            />
            
            {/* ป้ายกำกับสถานะ AI แบบ Pixel */}
            <div className="absolute top-2 right-2 md:top-6 md:right-6 bg-green-400 text-black text-[10px] md:text-sm px-2 md:px-4 py-1 md:py-2 font-black uppercase border-2 md:border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center gap-2 z-20">
               <Activity className="w-5 h-5" />
               {videoAI.trackingEnabled ? "YOLOv8 TRACKING" : "RAW VIDEO"}
            </div>
            
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-40 z-10"></div>
          </div>
          
          {/* แผงปุ่มด้านล่างจอทีวีจำลอง */}
          <div className="flex justify-between items-center mt-6 px-4">
            <div className="flex gap-4">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-black shadow-sm"></div>
              <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-black shadow-sm"></div>
            </div>
            <div className="flex gap-3">
               <div className="w-16 h-4 bg-gray-400 border-2 border-black shadow-[2px_2px_0_0_#000]"></div>
               <div className="w-16 h-4 bg-gray-400 border-2 border-black shadow-[2px_2px_0_0_#000]"></div>
            </div>
          </div>
        </Card>

      </main>
    </div>
  )
}

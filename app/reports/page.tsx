"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Home, BarChart2, Settings, Video, Calendar, FileText, FileSpreadsheet, Gamepad2 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"
import { usePathname } from "next/navigation"
import { apiUrl } from "@/lib/api"

type ChartPoint = { time: string, car: number, moto: number, truck: number };

export default function ReportsPage() {
  const pathname = usePathname()
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [timeRange, setTimeRange] = useState("WEEK"); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chartResponse = await fetch(apiUrl(`/api/chart-data?range=${timeRange}`));
        const chartDataResponse = await chartResponse.json();
        
        // ดัก Error ป้องกันกราฟพัง (.slice is not a function)
        if (Array.isArray(chartDataResponse)) {
          setChartData(chartDataResponse);
        } else {
          console.error("Backend ส่งข้อมูลมาผิดพลาด:", chartDataResponse);
          setChartData([]); // รีเซ็ตข้อมูลเป็นค่าว่าง
        }
      } catch (error) {
        console.error("เชื่อมต่อ Backend ไม่สำเร็จ:", error);
        setChartData([]); // รีเซ็ตข้อมูลเป็นค่าว่างกรณีต่อไม่ติด
      }
    };

    fetchData();
  }, [timeRange]);

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
      <main id="dashboard-content" className="min-h-0 min-w-0 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px]">
        <MobileNav />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase">Historical Reports</h2>
            <p className="font-bold text-gray-600 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> ระบบวิเคราะห์ข้อมูลย้อนหลัง
            </p>
          </div>
        </div>

        {/* เมนูเลือกดูข้อมูลย้อนหลัง */}
        <div className="mb-8 bg-white border-4 border-black p-2 inline-flex flex-wrap gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map((range) => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 sm:px-6 font-black uppercase border-4 border-transparent transition-all ${
                timeRange === range 
                  ? 'bg-black text-white border-black' 
                  : 'hover:border-black text-gray-500 hover:text-black'
              }`}
            >
              {range === 'DAY' ? 'วัน' : range === 'WEEK' ? 'สัปดาห์' : range === 'MONTH' ? 'เดือน' : 'ปี'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          
          {/* Area Chart - กราฟเส้นแบบ Pixel Step */}
          <Card className="rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="pt-6 h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase bg-black text-white inline-block px-4 py-2 border-2 border-black">แนวโน้มปริมาณรถสะสม ({timeRange})</h2>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" strokeWidth={2} />
                  <XAxis dataKey="time" axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={false} tick={{fill: '#000', fontFamily: 'monospace', fontWeight: 'bold'}} />
                  <YAxis axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={false} tick={{fill: '#000', fontFamily: 'monospace', fontWeight: 'bold'}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '0', border: '4px solid black', boxShadow: '4px 4px 0 0 black', fontWeight: 'bold', fontFamily: 'monospace' }} />
                  <Area type="step" dataKey="car" name="Car" stroke="#fde047" strokeWidth={6} fill="#fef08a" fillOpacity={0.8} isAnimationActive={false} />
                  <Area type="step" dataKey="moto" name="Moto" stroke="#f9a8d4" strokeWidth={6} fill="none" isAnimationActive={false} />
                  <Area type="step" dataKey="truck" name="Truck" stroke="#86efac" strokeWidth={6} fill="none" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ปุ่มโหลด Report เต็มรูปแบบ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <button onClick={() => window.open(apiUrl("/api/export/pdf"), "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-3 bg-red-400 text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[0_0_0_0_#000] font-black uppercase transition-all">
              <FileText className="w-6 h-6" /> EXPORT PDF REPORT
            </button>
            <button onClick={() => window.open(apiUrl("/api/export/pptx"), "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-3 bg-orange-400 text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[0_0_0_0_#000] font-black uppercase transition-all">
              <FileText className="w-6 h-6" /> EXPORT PPTX DECK
            </button>
            <button onClick={() => window.open(apiUrl("/api/export/summary"), "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-3 bg-green-400 text-black p-4 border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:shadow-[0_0_0_0_#000] font-black uppercase transition-all">
              <FileSpreadsheet className="w-6 h-6" /> EXPORT EXCEL DATA
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

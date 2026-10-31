"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Home, BarChart2, Settings, Car, Bike, Truck, Download, Video, Clock, Gamepad2 } from "lucide-react"
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"
import { usePathname } from "next/navigation"
import { loadTrafficSettings } from "@/lib/traffic-settings"
import { apiUrl } from "@/lib/api"

const COLORS = ['#fde047', '#f9a8d4', '#86efac']; 

type ChartPoint = { time: string, car: number, moto: number, truck: number };

export default function DashboardPage() {
  const pathname = usePathname()
  const [stats, setStats] = useState({ Car: 2681, Motorcycle: 642, Truck: 506, Total: 3829 });
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { time: "13:00", car: 160, moto: 40, truck: 20 },
    { time: "14:00", car: 950, moto: 260, truck: 180 },
    { time: "15:00", car: 620, moto: 150, truck: 110 },
    { time: "17:00", car: 100, moto: 30, truck: 40 },
    { time: "18:00", car: 170, moto: 40, truck: 25 },
    { time: "19:00", car: 640, moto: 140, truck: 90 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await fetch(apiUrl("/api/stats"));
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        const chartResponse = await fetch(apiUrl("/api/chart-data"));
        if (chartResponse.ok) {
          const chartDataResponse = await chartResponse.json();
          if (chartDataResponse && chartDataResponse.length > 0) {
            setChartData(chartDataResponse);
          }
        }
      } catch (error) {
        console.error("เชื่อมต่อ Backend ไม่สำเร็จ:", error);
      }
    };

    fetchData();
    const refreshMs = loadTrafficSettings().data.refreshIntervalSeconds * 1000;
    const interval = setInterval(fetchData, refreshMs);
    return () => clearInterval(interval);
  }, []);

  const vehicleProportion = [
    { name: 'CAR', value: stats.Car },
    { name: 'MOTO', value: stats.Motorcycle },
    { name: 'TRUCK', value: stats.Truck },
  ];

  const downloadSnapshot = async () => {
    setTimeout(async () => {
      const element = document.getElementById("dashboard-content");
      if (!element) return;
      try {
        const dataUrl = await toPng(element, { quality: 1, backgroundColor: '#fef3c7' });
        const pdf = new jsPDF("l", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("Traffic_System_Overview.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }, 300);
  };

  return (
    <div className="flex h-dvh bg-[#fef3c7] overflow-hidden font-mono text-black">
      
      {/* Sidebar ดีไซน์เดิมตามเรฟ */}
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
          <Link href="/game" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/game" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Gamepad2 className="w-5 h-5" /> Game Simulator
          </Link>
          <Link href="/settings" className={"flex items-center gap-3 p-3 border-4 cursor-pointer transition-all font-bold uppercase " + (pathname === "/settings" ? "bg-white text-black border-black shadow-[4px_4px_0_0_#fff] translate-x-2" : "hover:bg-gray-800 text-gray-300 border-transparent hover:border-white")}>
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </div>

        {/* ปุ่ม Export PDF มุมล่างซ้าย */}
        <div className="mt-auto">
          <button onClick={downloadSnapshot} className="w-full flex justify-center items-center gap-2 bg-purple-400 text-black p-3 border-4 border-black shadow-[4px_4px_0_0_#fff] hover:translate-y-1 hover:shadow-[0_0_0_0_#fff] font-black uppercase transition-all cursor-pointer">
            <Download className="w-5 h-5" /> Export PDF
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main id="dashboard-content" className="min-h-0 min-w-0 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px] bg-[#fef3c7]">
        <MobileNav />
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase">DATA OVERVIEW</h2>
            <p className="font-bold text-gray-600 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> ระบบแสดงผลข้อมูลแบบเรียลไทม์ (วันนี้)
            </p>
          </div>
          <div className="relative w-full md:w-auto flex">
            <input 
              type="text" 
              placeholder="SEARCH..." 
              className="px-4 py-2 border-4 border-black border-r-0 outline-none w-full md:w-64 font-bold bg-white uppercase text-sm"
            />
            <button className="bg-blue-400 border-4 border-black px-4 flex items-center justify-center hover:bg-blue-300 active:bg-blue-500 transition-none">
              <Search className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Top 3 Cards (Car, Moto, Truck) ตามเรฟ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#fde047]">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="font-black text-sm uppercase tracking-wider">CAR (รถยนต์)</p>
                <h3 className="text-5xl font-black mt-2">{stats.Car}</h3>
              </div>
              <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <Car className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#f9a8d4]">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="font-black text-sm uppercase tracking-wider">MOTO (มอเตอร์ไซค์)</p>
                <h3 className="text-5xl font-black mt-2">{stats.Motorcycle}</h3>
              </div>
              <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <Bike className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#86efac]">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="font-black text-sm uppercase tracking-wider">TRUCK (รถบรรทุก)</p>
                <h3 className="text-5xl font-black mt-2">{stats.Truck}</h3>
              </div>
              <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <Truck className="w-8 h-8 text-black" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section (Area Chart & Pie Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Area Chart */}
          <Card className="lg:col-span-2 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="pt-6 h-[400px] flex flex-col">
              <div className="mb-4">
                <span className="text-sm font-black uppercase bg-black text-white px-3 py-1 border-2 border-black">ปริมาณรถสะสม (วันนี้)</span>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" strokeWidth={2} />
                    <XAxis dataKey="time" axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={false} tick={{fill: '#000', fontFamily: 'monospace', fontWeight: 'bold'}} />
                    <YAxis axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={false} tick={{fill: '#000', fontFamily: 'monospace', fontWeight: 'bold'}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '0', border: '4px solid black', boxShadow: '4px 4px 0 0 black', fontWeight: 'bold', fontFamily: 'monospace' }} />
                    <Area type="step" dataKey="car" name="Car" stroke="#fde047" strokeWidth={5} fill="#fef08a" fillOpacity={0.8} />
                    <Area type="step" dataKey="moto" name="Moto" stroke="#f9a8d4" strokeWidth={5} fill="none" />
                    <Area type="step" dataKey="truck" name="Truck" stroke="#86efac" strokeWidth={5} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#e9d5ff]">
            <CardContent className="pt-6 h-[400px] flex flex-col items-center justify-between">
              <div className="w-full text-left">
                <span className="text-sm font-black uppercase bg-white text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">สัดส่วนประเภทรถ</span>
              </div>
              <div className="w-full h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vehicleProportion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} stroke="#000" strokeWidth={3} label>
                      {vehicleProportion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '0', border: '4px solid black', fontWeight: 'bold', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border-2 border-black p-2 flex gap-4 shadow-[4px_4px_0_0_#000]">
                <div className="flex items-center gap-1 font-bold text-xs"><div className="w-3 h-3 bg-[#fde047] border border-black"></div> CAR</div>
                <div className="flex items-center gap-1 font-bold text-xs"><div className="w-3 h-3 bg-[#f9a8d4] border border-black"></div> MOTO</div>
                <div className="flex items-center gap-1 font-bold text-xs"><div className="w-3 h-3 bg-[#86efac] border border-black"></div> TRUCK</div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}

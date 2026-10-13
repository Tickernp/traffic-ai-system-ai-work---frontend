"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity, BarChart2, Check, CloudRain, Database, Gamepad2, Home,
  RotateCcw, Save, Settings, SlidersHorizontal, Video,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  DEFAULT_TRAFFIC_SETTINGS,
  loadTrafficSettings,
  saveTrafficSettings,
  type TrafficSettings,
} from "@/lib/traffic-settings"

type SettingsTab = "simulation" | "vehicleMix" | "videoAI" | "data"

const tabItems: { id: SettingsTab; label: string; description: string; icon: typeof SlidersHorizontal }[] = [
  { id: "simulation", label: "Simulation", description: "ความเร็ว ปริมาณรถ และสภาพอากาศ", icon: SlidersHorizontal },
  { id: "vehicleMix", label: "Vehicle Mix", description: "สัดส่วนรถแต่ละประเภทในเกมจำลอง", icon: Activity },
  { id: "videoAI", label: "Video & AI", description: "วิดีโอ CCTV และการตรวจจับรถ", icon: Video },
  { id: "data", label: "Data", description: "การอัปเดตข้อมูลและแหล่งจัดเก็บ", icon: Database },
]

export default function SettingsPage() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<SettingsTab>("simulation")
  const [settings, setSettings] = useState<TrafficSettings>(DEFAULT_TRAFFIC_SETTINGS)
  const [saved, setSaved] = useState(true)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    setSettings(loadTrafficSettings())
  }, [])

  const updateSection = <K extends keyof TrafficSettings>(section: K, patch: Partial<TrafficSettings[K]>) => {
    setSettings(previous => ({ ...previous, [section]: { ...previous[section], ...patch } } as TrafficSettings))
    setSaved(false)
    setNotice("")
  }

  const save = () => {
    try {
      saveTrafficSettings(settings)
      setSaved(true)
      setNotice("บันทึกการตั้งค่าสำเร็จ")
    } catch {
      setSaved(false)
      setNotice("บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บเบราว์เซอร์")
    }
  }

  const reset = () => {
    setSettings(DEFAULT_TRAFFIC_SETTINGS)
    try {
      saveTrafficSettings(DEFAULT_TRAFFIC_SETTINGS)
      setSaved(true)
      setNotice("คืนค่าเริ่มต้นเรียบร้อย")
    } catch {
      setSaved(false)
      setNotice("คืนค่าในหน้านี้แล้ว แต่บันทึกลงเบราว์เซอร์ไม่สำเร็จ")
    }
  }

  return (
    <div className="flex h-screen bg-[#fef3c7] overflow-hidden font-mono text-black">
      {/* Sidebar ธีมเดียวกับหน้า Dashboard */}
      <aside className="w-64 bg-gray-900 flex flex-col py-8 px-4 gap-6 text-white shrink-0 border-r-4 border-black z-10 hidden md:flex">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-300 border-2 border-white rounded-none shadow-[2px_2px_0_0_#fff]" />
          <h1 className="text-xl font-black tracking-widest uppercase">TRAFFIC<br />SYSTEM</h1>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-gray-500 text-xs font-bold mb-2 uppercase">Main Menu</p>
          <Link href="/dashboard" className="flex items-center gap-3 hover:bg-gray-800 text-gray-300 p-3 border-4 border-transparent hover:border-white cursor-pointer transition-all font-bold uppercase">
            <Home className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/live" className="flex items-center gap-3 hover:bg-gray-800 text-gray-300 p-3 border-4 border-transparent hover:border-white cursor-pointer transition-all font-bold uppercase">
            <Video className="w-5 h-5" /> Live CCTV
          </Link>
          <Link href="/reports" className="flex items-center gap-3 hover:bg-gray-800 text-gray-300 p-3 border-4 border-transparent hover:border-white cursor-pointer transition-all font-bold uppercase">
            <BarChart2 className="w-5 h-5" /> Reports
          </Link>
          <Link href="/game" className="flex items-center gap-3 hover:bg-gray-800 text-gray-300 p-3 border-4 border-transparent hover:border-white cursor-pointer transition-all font-bold uppercase">
            <Gamepad2 className="w-5 h-5" /> Game Simulator
          </Link>
          <div className="flex items-center gap-3 bg-white text-black p-3 border-4 border-black shadow-[4px_4px_0_0_#fff] cursor-pointer font-bold uppercase translate-x-2">
            <Settings className="w-5 h-5" /> Settings
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-8 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px]">
        <div className="mx-auto max-w-5xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black uppercase">Settings Center</h2>
              <p className="font-bold text-gray-600 mt-1">จัดการและปรับแต่งค่าระบบทั้งหมดของ Traffic Lab</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={reset} 
                className="flex items-center gap-2 bg-white text-black px-4 py-2 border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-gray-100 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button 
                onClick={save} 
                className="flex items-center gap-2 bg-black text-cyan-300 px-5 py-2 border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#fff] hover:bg-gray-800 transition-all cursor-pointer"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </div>

          {/* Notice Bar */}
          <div className="mb-6 flex items-center justify-between bg-white border-4 border-black p-3 shadow-[4px_4px_0_0_#000]">
            <span className={`text-sm font-black ${saved ? "text-green-700" : "text-orange-600"}`}>
              {notice || (saved ? "✔ บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว" : "⚠ มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก")}
            </span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 border-2 border-black">Browser Storage</span>
          </div>

          {/* Navigation Tabs & Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Tabs */}
            <div className="flex flex-col gap-2 lg:col-span-1">
              {tabItems.map(({ id, label, description, icon: Icon }) => (
                <button 
                  key={id} 
                  onClick={() => setActiveTab(id)} 
                  className={`p-4 text-left border-4 border-black transition-all cursor-pointer ${
                    activeTab === id 
                      ? "bg-cyan-300 shadow-[4px_4px_0_0_#000] translate-x-1" 
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black uppercase text-sm">
                    <Icon className="w-4 h-4 text-black" /> {label}
                  </div>
                  <div className="text-xs font-bold text-gray-600 mt-1">{description}</div>
                </button>
              ))}
            </div>

            {/* Right Content Card */}
            <Card className="lg:col-span-3 rounded-none border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
              <CardContent className="p-6 md:p-8">
                
                {activeTab === "simulation" && (
                  <div>
                    <h3 className="text-xl font-black uppercase border-b-4 border-black pb-3 mb-6">Simulation Settings</h3>
                    <div className="space-y-6">
                      <div className="border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000]">
                        <label className="block text-sm font-black uppercase mb-2">
                          Vehicle Speed Multiplier: <span className="text-cyan-700">{settings.simulation.speedMultiplier.toFixed(1)}×</span>
                        </label>
                        <input 
                          type="range" min="0.5" max="2.5" step="0.1" 
                          value={settings.simulation.speedMultiplier} 
                          onChange={e => updateSection("simulation", { speedMultiplier: Number(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                          <span>0.5× (ช้า)</span><span>2.5× (เร็ว)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000]">
                          <label className="block text-sm font-black uppercase mb-2">Traffic Density</label>
                          <select 
                            value={settings.simulation.trafficDensity} 
                            onChange={e => updateSection("simulation", { trafficDensity: e.target.value as any })}
                            className="w-full border-2 border-black p-2 bg-white font-bold outline-none"
                          >
                            <option value="LOW">Low (รถน้อย)</option>
                            <option value="NORMAL">Normal (ปกติ)</option>
                            <option value="HIGH">High (รถหนาแน่น)</option>
                          </select>
                        </div>
                        <div className="border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000]">
                          <label className="block text-sm font-black uppercase mb-2">Starting Weather</label>
                          <select 
                            value={settings.simulation.startingWeather} 
                            onChange={e => updateSection("simulation", { startingWeather: e.target.value as any })}
                            className="w-full border-2 border-black p-2 bg-white font-bold outline-none"
                          >
                            <option value="NORMAL">Normal (ปกติ)</option>
                            <option value="RUSH HOUR">Rush Hour (ช่วงเร่งด่วน)</option>
                            <option value="HEAVY RAIN">Heavy Rain (ฝนตกหนัก)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "vehicleMix" && (
                  <div>
                    <h3 className="text-xl font-black uppercase border-b-4 border-black pb-3 mb-3">Vehicle Mix</h3>
                    <p className="mb-6 text-sm font-bold text-gray-600">กำหนดสัดส่วนรถที่เกิดใน Game Simulator โดยรวมทุกประเภทเป็น 100%</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MixCard title="Motorcycles" percent={settings.vehicleMix.motorcyclePercent} max={100 - settings.vehicleMix.truckPercent} color="bg-pink-200" onChange={motorcyclePercent => updateSection("vehicleMix", { motorcyclePercent })} />
                      <MixCard title="Trucks" percent={settings.vehicleMix.truckPercent} max={100 - settings.vehicleMix.motorcyclePercent} color="bg-orange-200" onChange={truckPercent => updateSection("vehicleMix", { truckPercent })} />
                      <div className="border-4 border-black bg-yellow-200 p-4 sm:col-span-2">
                        <p className="font-black uppercase">Cars · {100 - settings.vehicleMix.motorcyclePercent - settings.vehicleMix.truckPercent}%</p>
                        <p className="mt-1 text-xs font-bold text-gray-700">สัดส่วนรถยนต์คำนวณจากเปอร์เซ็นต์ที่เหลือโดยอัตโนมัติ</p>
                      </div>
                    </div>
                    <p className="mt-4 border-l-4 border-cyan-600 bg-cyan-50 p-3 text-xs font-bold text-gray-700">การตั้งค่านี้มีผลกับการสุ่มประเภทรถเมื่อเริ่ม Game Simulator รอบใหม่</p>
                  </div>
                )}

                {activeTab === "videoAI" && (
                  <div>
                    <h3 className="text-xl font-black uppercase border-b-4 border-black pb-3 mb-6">Video & AI Settings</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000]">
                        <div>
                          <div className="font-black uppercase text-sm">YOLO Vehicle Tracking</div>
                          <div className="text-xs font-bold text-gray-600 mt-0.5">เปิด/ปิด การตรวจจับรถด้วย AI ในหน้า Live CCTV</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settings.videoAI.trackingEnabled} 
                          onChange={e => updateSection("videoAI", { trackingEnabled: e.target.checked })}
                          className="w-6 h-6 accent-black cursor-pointer border-2 border-black"
                        />
                      </div>

                      <div className={`border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000] ${settings.videoAI.trackingEnabled ? "" : "opacity-50"}`}>
                        <label className="block text-sm font-black uppercase mb-2">
                          Detection Confidence: <span className="bg-cyan-200 border-2 border-black px-2 py-0.5">{settings.videoAI.confidence.toFixed(2)}</span>
                        </label>
                        <input 
                          type="range" min="0.1" max="0.9" step="0.05" 
                          disabled={!settings.videoAI.trackingEnabled}
                          value={settings.videoAI.confidence} 
                          onChange={e => updateSection("videoAI", { confidence: Number(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "data" && (
                  <div>
                    <h3 className="text-xl font-black uppercase border-b-4 border-black pb-3 mb-6">Data Refresh Settings</h3>
                    <div className="border-4 border-black bg-gray-50 p-4 shadow-[4px_4px_0_0_#000]">
                      <label className="block text-sm font-black uppercase mb-2">
                        Dashboard Refresh Interval: <span className="bg-pink-300 border-2 border-black px-2 py-0.5">{settings.data.refreshIntervalSeconds}s</span>
                      </label>
                      <input 
                        type="range" min="3" max="60" step="1" 
                        value={settings.data.refreshIntervalSeconds} 
                        onChange={e => updateSection("data", { refreshIntervalSeconds: Number(e.target.value) })}
                        className="w-full accent-black cursor-pointer"
                      />
                      <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
                        <span>3 วินาที</span><span>60 วินาที</span>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
  )
}

function MixCard({ title, percent, max, color, onChange }: { title: string; percent: number; max: number; color: string; onChange: (value: number) => void }) {
  return (
    <label className={`block border-4 border-black ${color} p-4 shadow-[4px_4px_0_0_#000]`}>
      <span className="mb-3 flex items-center justify-between text-sm font-black uppercase"><span>{title}</span><span>{percent}%</span></span>
      <input aria-label={`${title} percentage`} type="range" min="0" max={max} step="1" value={percent} onChange={event => onChange(Number(event.target.value))} className="w-full cursor-pointer accent-black" />
      <span className="mt-1 flex justify-between text-xs font-bold text-gray-600"><span>0%</span><span>{max}% available</span></span>
    </label>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"
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
    <div className="flex h-dvh bg-[#fef3c7] overflow-hidden font-mono text-black">
      {/* Sidebar ธีมเดียวกับหน้า Dashboard */}
      <aside className="w-64 bg-gray-900 flex flex-col py-8 px-4 gap-6 text-white shrink-0 border-r-4 border-black z-10 hidden lg:flex">
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

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#fef3c7] bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px] p-4 sm:p-6 lg:p-8">
        <MobileNav />
        <div className="mx-auto max-w-6xl">
          <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center border-4 border-black bg-yellow-300 shadow-[4px_4px_0_0_#000]">
                <Settings className="h-7 w-7" />
              </div>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-gray-600">Traffic System / Control Center</p>
                <h2 className="text-3xl font-black uppercase leading-none md:text-4xl">Settings</h2>
                <p className="mt-2 max-w-2xl text-sm font-bold text-gray-600">ปรับการจำลอง สัดส่วนยานพาหนะ ระบบตรวจจับ และการอัปเดตข้อมูล</p>
              </div>
            </div>
            <div className="flex gap-3 pl-[4.5rem] xl:pl-0">
              <button onClick={reset} className="flex items-center gap-2 border-4 border-black bg-white px-4 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-gray-100">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button onClick={save} className="flex items-center gap-2 border-4 border-black bg-yellow-300 px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] transition hover:-translate-y-0.5 hover:bg-yellow-200">
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save Changes
              </button>
            </div>
          </header>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-4 border-black bg-[#111827] px-4 py-3 text-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 border-2 border-white ${saved ? "bg-green-400" : "bg-pink-400"}`} />
              <span className="text-sm font-black">{notice || (saved ? "การตั้งค่าถูกบันทึกแล้ว" : "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก")}</span>
            </div>
            <span className="flex items-center gap-2 border-2 border-white/60 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-300">
              <Database className="h-3.5 w-3.5" /> Browser Storage
            </span>
          </div>

          <nav className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Settings categories">
            {tabItems.map(({ id, label, description, icon: Icon }, index) => (
              <button key={id} onClick={() => setActiveTab(id)} aria-pressed={activeTab === id}
                className={`min-h-24 border-4 border-black p-3 text-left transition sm:p-4 ${activeTab === id ? "-translate-y-1 bg-yellow-300 shadow-[4px_5px_0_0_#000]" : "bg-white shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 hover:bg-yellow-50"}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase sm:text-sm"><Icon className="h-4 w-4 shrink-0" /> {label}</span>
                  <span className="font-mono text-[10px] font-black text-gray-600">0{index + 1}</span>
                </div>
                <span className="block text-[10px] font-bold leading-snug text-gray-700 sm:text-xs">{description}</span>
              </button>
            ))}
          </nav>

          <Card className="rounded-none border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 border-b-4 border-black pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Configuration / {tabItems.find(item => item.id === activeTab)?.label}</p>
                  <h3 className="text-2xl font-black uppercase md:text-3xl">{tabItems.find(item => item.id === activeTab)?.label}</h3>
                  <p className="mt-1 text-sm font-bold text-gray-600">{tabItems.find(item => item.id === activeTab)?.description}</p>
                </div>
                <span className="w-fit border-2 border-black bg-[#111827] px-3 py-1 font-mono text-xs font-black text-yellow-300">LIVE SETTINGS</span>
              </div>

              {activeTab === "simulation" && (
                <div className="space-y-5">
                  <section className="border-4 border-black bg-[#111827] p-5 text-white shadow-[4px_4px_0_0_#000] sm:p-6">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-yellow-300">Driving pace</p>
                        <h4 className="mt-1 text-lg font-black uppercase">Vehicle Speed Multiplier</h4>
                        <p className="mt-1 text-xs font-bold text-gray-300">ปรับความเร็วรถที่ใช้ใน Game Simulator</p>
                      </div>
                      <span className="border-2 border-black bg-yellow-300 px-3 py-1 font-mono text-2xl font-black text-black shadow-[3px_3px_0_0_#fff]">{settings.simulation.speedMultiplier.toFixed(1)}×</span>
                    </div>
                    <input type="range" min="0.5" max="2.5" step="0.1" value={settings.simulation.speedMultiplier}
                      onChange={e => updateSection("simulation", { speedMultiplier: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-yellow-300" aria-label="Vehicle speed multiplier" />
                    <div className="mt-2 flex justify-between text-[10px] font-black uppercase text-gray-300"><span>0.5× · Slower</span><span>2.5× · Faster</span></div>
                  </section>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="block border-4 border-black bg-pink-100 p-5 shadow-[4px_4px_0_0_#000]">
                      <span className="mb-3 flex items-center gap-2 text-sm font-black uppercase"><Activity className="h-4 w-4" /> Traffic Density</span>
                      <select value={settings.simulation.trafficDensity} onChange={e => updateSection("simulation", { trafficDensity: e.target.value as TrafficSettings["simulation"]["trafficDensity"] })}
                        className="w-full border-4 border-black bg-white p-3 font-bold outline-none focus:bg-yellow-50">
                        <option value="LOW">Low (รถน้อย)</option><option value="NORMAL">Normal (ปกติ)</option><option value="HIGH">High (รถหนาแน่น)</option>
                      </select>
                      <span className="mt-2 block text-xs font-bold text-gray-600">กำหนดจำนวนรถที่เข้าสู่แยก</span>
                    </label>
                    <label className="block border-4 border-black bg-green-100 p-5 shadow-[4px_4px_0_0_#000]">
                      <span className="mb-3 flex items-center gap-2 text-sm font-black uppercase"><CloudRain className="h-4 w-4" /> Starting Weather</span>
                      <select value={settings.simulation.startingWeather} onChange={e => updateSection("simulation", { startingWeather: e.target.value as TrafficSettings["simulation"]["startingWeather"] })}
                        className="w-full border-4 border-black bg-white p-3 font-bold outline-none focus:bg-yellow-50">
                        <option value="NORMAL">Normal (ปกติ)</option><option value="RUSH HOUR">Rush Hour (ช่วงเร่งด่วน)</option><option value="HEAVY RAIN">Heavy Rain (ฝนตกหนัก)</option>
                      </select>
                      <span className="mt-2 block text-xs font-bold text-gray-600">กำหนดสภาพแวดล้อมเมื่อเริ่มจำลอง</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "vehicleMix" && (
                <div>
                  <div className="mb-5 flex items-center justify-between border-2 border-black bg-yellow-50 p-3">
                    <span className="text-xs font-black uppercase">Total vehicle mix</span>
                    <span className="bg-black px-3 py-1 font-mono text-sm font-black text-yellow-300">100%</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex min-h-40 flex-col justify-between border-4 border-black bg-yellow-200 p-5 shadow-[4px_4px_0_0_#000]">
                      <div className="flex items-center justify-between"><span className="text-sm font-black uppercase">Cars</span><span className="text-3xl">🚗</span></div>
                      <div><span className="text-4xl font-black">{100 - settings.vehicleMix.motorcyclePercent - settings.vehicleMix.truckPercent}%</span><p className="mt-1 text-xs font-bold text-gray-700">สัดส่วนรถยนต์ที่เหลือ</p></div>
                    </div>
                    <MixCard title="Motorcycles" percent={settings.vehicleMix.motorcyclePercent} max={100 - settings.vehicleMix.truckPercent} color="bg-pink-200" onChange={motorcyclePercent => updateSection("vehicleMix", { motorcyclePercent })} />
                    <MixCard title="Trucks" percent={settings.vehicleMix.truckPercent} max={100 - settings.vehicleMix.motorcyclePercent} color="bg-green-200" onChange={truckPercent => updateSection("vehicleMix", { truckPercent })} />
                  </div>
                  <p className="mt-5 border-l-4 border-yellow-500 bg-yellow-50 p-3 text-xs font-bold text-gray-700">สัดส่วนมีผลกับการสุ่มประเภทรถเมื่อเริ่ม Game Simulator รอบใหม่</p>
                </div>
              )}

              {activeTab === "videoAI" && (
                <div className="space-y-5">
                  <label className="flex cursor-pointer items-center justify-between gap-4 border-4 border-black bg-[#111827] p-5 text-white shadow-[4px_4px_0_0_#000]">
                    <span className="flex items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center border-2 border-black bg-pink-200 text-black"><Video className="h-6 w-6" /></span>
                      <span><span className="block font-black uppercase">YOLO Vehicle Tracking</span><span className="mt-1 block text-xs font-bold text-gray-300">เปิด/ปิดการตรวจจับรถด้วย AI ในหน้า Live CCTV</span></span>
                    </span>
                    <input type="checkbox" checked={settings.videoAI.trackingEnabled} onChange={e => updateSection("videoAI", { trackingEnabled: e.target.checked })}
                      className="h-6 w-6 shrink-0 cursor-pointer accent-yellow-300" />
                  </label>

                  <section className={`border-4 border-black bg-pink-50 p-5 shadow-[4px_4px_0_0_#000] transition-opacity ${settings.videoAI.trackingEnabled ? "" : "opacity-50"}`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div><h4 className="font-black uppercase">Detection Confidence</h4><p className="mt-1 text-xs font-bold text-gray-600">กำหนดค่าความมั่นใจขั้นต่ำสำหรับการตรวจจับ</p></div>
                      <span className="border-2 border-black bg-pink-200 px-3 py-1 font-mono text-xl font-black">{settings.videoAI.confidence.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0.1" max="0.9" step="0.05" disabled={!settings.videoAI.trackingEnabled} value={settings.videoAI.confidence}
                      onChange={e => updateSection("videoAI", { confidence: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-black disabled:cursor-not-allowed" aria-label="Detection confidence" />
                    <div className="mt-2 flex justify-between text-[10px] font-black text-gray-600"><span>0.10 · More detections</span><span>0.90 · Higher confidence</span></div>
                  </section>
                </div>
              )}

              {activeTab === "data" && (
                <section className="border-4 border-black bg-green-50 p-5 shadow-[4px_4px_0_0_#000] sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div><p className="text-xs font-black uppercase tracking-widest text-green-800">Data refresh</p><h4 className="mt-1 font-black uppercase">Dashboard Refresh Interval</h4><p className="mt-1 text-xs font-bold text-gray-600">กำหนดช่วงเวลาที่ Dashboard จะดึงข้อมูลใหม่</p></div>
                    <span className="border-2 border-black bg-pink-200 px-3 py-1 font-mono text-2xl font-black">{settings.data.refreshIntervalSeconds}s</span>
                  </div>
                  <input type="range" min="3" max="60" step="1" value={settings.data.refreshIntervalSeconds}
                    onChange={e => updateSection("data", { refreshIntervalSeconds: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-black" aria-label="Dashboard refresh interval" />
                  <div className="mt-2 flex justify-between text-[10px] font-black text-gray-600"><span>3 seconds</span><span>60 seconds</span></div>
                </section>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function MixCard({ title, percent, max, color, onChange }: { title: string; percent: number; max: number; color: string; onChange: (value: number) => void }) {
  return (
    <label className={`flex min-h-40 flex-col justify-between border-4 border-black ${color} p-5 shadow-[4px_4px_0_0_#000]`}>
      <span className="mb-3 flex items-center justify-between text-sm font-black uppercase"><span>{title}</span><span>{percent}%</span></span>
      <input aria-label={`${title} percentage`} type="range" min="0" max={max} step="1" value={percent} onChange={event => onChange(Number(event.target.value))} className="w-full cursor-pointer accent-black" />
      <span className="mt-1 flex justify-between text-xs font-bold text-gray-600"><span>0%</span><span>{max}% available</span></span>
    </label>
  )
}

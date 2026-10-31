"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, BarChart2, Clock3, Gamepad2, Heart, Home, Info, Pause, Play, RotateCcw, Settings, Trophy, Video, Volume2, VolumeX, X } from "lucide-react"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"
import { usePathname } from "next/navigation"
import { DEFAULT_TRAFFIC_SETTINGS, loadTrafficSettings } from "@/lib/traffic-settings"

type Axis = "A" | "B"
type Approach = "NW" | "SE" | "SW" | "NE"
type Car = { id: number; from: Approach; progress: number; wait: number; color: string; kind: "car" | "van" | "bus" }
type FinishReason = "collision" | "impatience" | "time" | null

const axisFor = (from: Approach): Axis => from === "NW" || from === "SE" ? "A" : "B"
const axisNames: Record<Axis, string> = { A: "NW ↘ SE", B: "SW ↗ NE" }
const starts: Record<Approach, [number, number]> = { NW: [115, 70], SE: [845, 530], SW: [115, 530], NE: [845, 70] }
const ends: Record<Approach, [number, number]> = { NW: [845, 530], SE: [115, 70], SW: [845, 70], NE: [115, 530] }
// Progress values stop each approach just before its crosswalk, leaving room for the vehicle body.
const stopLines: Record<Approach, number> = { NW: 0.34, SE: 0.417, SW: 0.35, NE: 0.408 }

export default function TrafficCommand() {
  const pathname = usePathname()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screen, setScreen] = useState<"menu" | "playing" | "paused" | "over">("menu")
  const [showRules, setShowRules] = useState(false)
  const [lights, setLights] = useState<Record<Axis, boolean>>({ A: true, B: false })
  const [cars, setCars] = useState<Car[]>([])
  const [timeLeft, setTimeLeft] = useState(120)
  const [score, setScore] = useState(0)
  const [lostDrivers, setLostDrivers] = useState(0)
  const [level, setLevel] = useState(1)
  const [reason, setReason] = useState<FinishReason>(null)
  const [soundOn, setSoundOn] = useState(true)
  const [simulationSettings, setSimulationSettings] = useState(DEFAULT_TRAFFIC_SETTINGS.simulation)
  const [banner, setBanner] = useState("KEEP THE CITY MOVING")
  const carsRef = useRef<Car[]>([])
  const lightsRef = useRef(lights)
  const screenRef = useRef(screen)
  const missedRef = useRef(0)
  const idRef = useRef(0)
  const timeRef = useRef(120)

  useEffect(() => { setSimulationSettings(loadTrafficSettings().simulation) }, [])
  useEffect(() => { carsRef.current = cars }, [cars])
  useEffect(() => { lightsRef.current = lights }, [lights])
  useEffect(() => { screenRef.current = screen }, [screen])

  const finish = useCallback((why: FinishReason) => {
    screenRef.current = "over"
    setReason(why)
    setScreen("over")
    setBanner(why === "collision" ? "COLLISION! KEEP THE LIGHTS IN SYNC" : why === "impatience" ? "THE DRIVERS LOST THEIR PATIENCE" : "SHIFT COMPLETE")
  }, [])

  const startGame = () => {
    setSimulationSettings(loadTrafficSettings().simulation)
    carsRef.current = []
    missedRef.current = 0
    setCars([])
    setLights({ A: true, B: false })
    timeRef.current = 120
    setTimeLeft(120)
    setScore(0)
    setLostDrivers(0)
    setLevel(1)
    setReason(null)
    setBanner("KEEP THE CITY MOVING")
    screenRef.current = "playing"
    setScreen("playing")
  }

  const toggleLight = (axis: Axis) => {
    if (screenRef.current !== "playing") return
    const nextIsGreen = !lightsRef.current[axis]
    playClickSound(soundOn, nextIsGreen)
    setLights(current => ({ ...current, [axis]: !current[axis] }))
  }

  useEffect(() => {
    if (screen !== "playing") return
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, timeRef.current - 1)
      timeRef.current = remaining
      setTimeLeft(remaining)
      if (remaining === 0) {
        finish("time")
        return
      }
      setLevel(Math.min(8, 1 + Math.floor((120 - remaining) / 16)))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [screen, finish])

  useEffect(() => {
    if (screen !== "playing") return
    const densityMultiplier = simulationSettings.trafficDensity === "LOW" ? 1.45 : simulationSettings.trafficDensity === "HIGH" ? 0.68 : 1
    const conditionMultiplier = simulationSettings.startingWeather === "RUSH HOUR" ? 0.68 : simulationSettings.startingWeather === "HEAVY RAIN" ? 1.12 : 1
    const interval = Math.max(350, (1450 - level * 100) * densityMultiplier * conditionMultiplier)
    const spawner = window.setInterval(() => {
      if (screenRef.current !== "playing") return
      const approach = (["NW", "SE", "SW", "NE"] as Approach[])[Math.floor(Math.random() * 4)]
      if (carsRef.current.some(car => car.from === approach && car.progress < 0.16)) return
      idRef.current += 1
      const roll = Math.random()
      const next: Car = {
        id: idRef.current,
        from: approach,
        progress: 0,
        wait: 0,
        color: ["#e54b3d", "#f2bb3e", "#2784cf", "#55b94f", "#eee8d8", "#8d64bd"][Math.floor(Math.random() * 6)],
        kind: roll > 0.92 ? "bus" : roll > 0.78 ? "van" : "car",
      }
      carsRef.current = [...carsRef.current, next]
      setCars(carsRef.current)
    }, interval)
    return () => window.clearInterval(spawner)
  }, [screen, level, simulationSettings.trafficDensity, simulationSettings.startingWeather])

  useEffect(() => {
    if (screen !== "playing") return
    const loop = window.setInterval(() => {
      if (screenRef.current !== "playing") return
      const sorted = [...carsRef.current].sort((a, b) => b.progress - a.progress)
      const next: Car[] = []
      let cleared = 0
      let impatienceEvents = 0
      for (const car of sorted) {
        const stopLine = stopLines[car.from]
        const axisGreen = lightsRef.current[axisFor(car.from)]
        const hasEnteredJunction = car.progress > stopLine
        const canEnter = axisGreen || hasEnteredJunction
        const leader = next.find(other => other.from === car.from)
        const weatherSpeed = simulationSettings.startingWeather === "HEAVY RAIN" ? 0.78 : 1
        const step = (0.006 + level * 0.0003) * simulationSettings.speedMultiplier * weatherSpeed
        let progress = canEnter
          ? Math.min(1.12, car.progress + step)
          : Math.min(stopLine, car.progress + step)
        if (leader) progress = Math.max(0, Math.min(progress, leader.progress - 0.095))
        const waitingAtRed = !axisGreen && progress >= stopLine
        const waitingBehindLeader = leader !== undefined && progress <= car.progress
        const waiting = waitingAtRed || waitingBehindLeader
        const wait = waiting ? car.wait + 1 : Math.max(0, car.wait - 2)
        if (wait >= 125) {
          impatienceEvents += 1
          continue
        }
        if (progress >= 1.08) {
          cleared += 1
          continue
        }
        next.push({ ...car, progress, wait })
      }

      const crossing = next.filter(car => car.progress >= 0.475 && car.progress <= 0.535)
      if (crossing.some(car => axisFor(car.from) === "A") && crossing.some(car => axisFor(car.from) === "B")) {
        carsRef.current = next
        setCars(next)
        finish("collision")
        return
      }

      carsRef.current = next
      setCars(next)
      if (cleared) setScore(value => value + cleared)
      if (impatienceEvents) {
        missedRef.current += impatienceEvents
        setLostDrivers(missedRef.current)
        if (missedRef.current >= 3) finish("impatience")
      }
    }, 80)
    return () => window.clearInterval(loop)
  }, [screen, level, finish, simulationSettings.speedMultiplier, simulationSettings.startingWeather])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let frame = 0
    const draw = () => {
      paintScene(ctx, carsRef.current, lightsRef.current, screenRef.current)
      frame = window.requestAnimationFrame(draw)
    }
    draw()
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const pause = () => {
    screenRef.current = "paused"
    setScreen("paused")
  }
  const resume = () => {
    screenRef.current = "playing"
    setScreen("playing")
  }
  const waiting = cars.filter(car => car.wait > 35).length
  const gameOverTitle = reason === "collision" ? "CRASH!" : reason === "impatience" ? "TRAFFIC JAM!" : "SHIFT COMPLETE"

  return (
    <div className="flex h-dvh bg-[#fef3c7] overflow-hidden font-mono text-black">
      {/* Sidebar ให้เหมือนหน้า Dashboard ทุกประการ */}
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
          <div className="flex items-center gap-3 bg-white text-black p-3 border-4 border-black shadow-[4px_4px_0_0_#fff] cursor-pointer font-bold uppercase translate-x-2">
            <Gamepad2 className="w-5 h-5" /> Game Simulator
          </div>
          <Link href="/settings" className="flex items-center gap-3 hover:bg-gray-800 text-gray-300 p-3 border-4 border-transparent hover:border-white cursor-pointer transition-all font-bold uppercase">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px]">
        <MobileNav />

        <section className="traffic-command-screen flex items-center justify-center">
          <div className="arcade-shell">
            <header className="arcade-header">
              <Link href="/dashboard" className="back-button" aria-label="Back to dashboard"><ArrowLeft size={19} /></Link>
              <div className="brand-lockup"><span className="brand-light">TRAFFIC</span><span className="brand-dark">COMMAND</span></div>
              <div className="camera-status"><i /> CAMERA 01 ONLINE</div>
            </header>

            <section className="arcade-board" aria-label="Traffic Command game board">
              <canvas ref={canvasRef} width={960} height={600} className="city-canvas" />
              {simulationSettings.startingWeather === "HEAVY RAIN" && <div className="weather-rain" aria-hidden="true" />}
              <div className="weather-indicator">{simulationSettings.startingWeather === "NORMAL" ? "NORMAL CONDITIONS" : simulationSettings.startingWeather === "RUSH HOUR" ? "RUSH HOUR · HIGH FLOW" : "HEAVY RAIN · SLOW TRAFFIC"}</div>
              <div className="hud-bar">
                <HudCell label="CARS CLEARED" value={String(score).padStart(3, "0")} /><HudCell label="TIME LEFT" value={`${timeLeft}s`} /><HudCell label="LEVEL" value={String(level).padStart(2, "0")} />
                <HudCell label="DRIVERS LOST" value={`${lostDrivers}/3`} danger={lostDrivers > 0} />
              </div>
              <div className="live-banner">{banner}</div>

              <SignalButton axis="A" active={lights.A} label={axisNames.A} className="signal-nw" onClick={() => toggleLight("A")} disabled={screen !== "playing"} />
              <SignalButton axis="A" active={lights.A} label={axisNames.A} className="signal-se" onClick={() => toggleLight("A")} disabled={screen !== "playing"} />
              <SignalButton axis="B" active={lights.B} label={axisNames.B} className="signal-sw" onClick={() => toggleLight("B")} disabled={screen !== "playing"} />
              <SignalButton axis="B" active={lights.B} label={axisNames.B} className="signal-ne" onClick={() => toggleLight("B")} disabled={screen !== "playing"} />

              {screen === "menu" && <div className="game-overlay menu-overlay">
                <div className="menu-card">
                  <p className="eyebrow">CITY TRAFFIC CONTROL</p>
                  <h1>TRAFFIC<br /><span>COMMAND</span></h1>
                  <p className="menu-copy">คุณคือคนคุมสี่แยก จัดจังหวะไฟให้รถไหลผ่าน<br />ระวังรถชน และอย่าปล่อยให้คนขับรอนาน</p>
                  <div className="menu-actions">
                    <button className="arcade-button primary-button" onClick={startGame}><Play size={19} fill="currentColor" /> START GAME</button>
                    <button className="arcade-button secondary-button" onClick={() => setShowRules(true)}><Info size={18} /> INSTRUCTIONS</button>
                  </div>
                </div>
              </div>}

              {screen === "paused" && <div className="game-overlay"><div className="result-card"><p className="eyebrow">TRAFFIC CONTROL</p><h2>PAUSED</h2><button className="arcade-button primary-button" onClick={resume}><Play size={18} fill="currentColor" /> RESUME GAME</button></div></div>}
              {screen === "over" && <div className="game-overlay"><div className={`result-card ${reason === "collision" ? "crash-card" : ""}`}><p className="eyebrow">SHIFT REPORT · SCORE {score}</p><h2>{gameOverTitle}</h2><p>{reason === "collision" ? "รถจากสองเส้นทางเข้าชนกัน!" : reason === "impatience" ? "คนขับรอนานเกินไปจนหมดความอดทน" : "หมดเวลากะแล้ว มาดูว่าคุมรถผ่านได้กี่คัน"}</p><button className="arcade-button primary-button" onClick={startGame}><RotateCcw size={18} /> PLAY AGAIN</button></div></div>}

              {showRules && <div className="rules-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowRules(false) }}><div className="rules-card" role="dialog" aria-modal="true" aria-labelledby="rules-title"><button className="close-rules" onClick={() => setShowRules(false)} aria-label="Close instructions"><X /></button><p className="eyebrow">FIELD MANUAL</p><h2 id="rules-title">HOW TO PLAY</h2><ol><li>กดสัญญาณไฟที่ถนนเพื่อสลับไฟแดงและไฟเขียวให้รถสองฝั่งของถนนนั้น</li><li>สลับไฟเป็นแดงก่อนเปิดอีกแนว รถในแยกจะได้ออกไปอย่างปลอดภัย</li><li>ถ้ารถจากถนนที่ตัดกันเข้าพร้อมกัน จะเกิดอุบัติเหตุและจบเกมทันที</li><li>รถที่รอไฟแดงนานเกินไปจะเสียความอดทน เสียคนขับครบ 3 คันจะแพ้</li><li>ทุก 16 วินาที ระดับสูงขึ้นและรถจะเข้ามาถี่ขึ้น</li></ol><button className="arcade-button secondary-button" onClick={() => setShowRules(false)}>GOT IT</button></div></div>}
            </section>

            <footer className="arcade-controls">
              <div className="control-hint"><span className="key-cap">CLICK</span><span>TRAFFIC LIGHTS TO CHANGE THEIR COLOR</span></div>
              <div className="control-stats"><span><Trophy size={16} /> SCORE <b>{score}</b></span><span><Clock3 size={16} /> WAITING <b>{waiting}</b></span><span><Heart size={16} /> LOST <b>{lostDrivers}/3</b></span></div>
              <div className="control-actions"><button aria-label={soundOn ? "Mute sound" : "Enable sound"} onClick={() => setSoundOn(value => !value)} title="Sound"><SoundIcon on={soundOn} /></button>{screen === "playing" ? <button onClick={pause} title="Pause"><Pause size={18} /></button> : screen === "paused" ? <button onClick={resume} title="Resume"><Play size={18} /></button> : null}{screen !== "menu" && <button onClick={startGame} title="Restart"><RotateCcw size={18} /></button>}</div>
            </footer>
            <div className="arcade-credit"><span>TRAFFIC SYSTEM · CITY CONTROL SIMULATION</span><span>SAFE STREETS · SMART SIGNALS</span></div>
          </div>
        </section>
      </main>
      <style jsx global>{`
        .arcade-shell{width:min(1180px,100%);padding:13px;background:#fde047;border:5px solid #000;box-shadow:inset 0 0 0 3px #fef3c7,8px 8px 0 #000;position:relative}
        .arcade-shell:before{content:"";position:absolute;inset:7px;border:1px dashed #0008;pointer-events:none;z-index:5}
        .arcade-header{height:55px;background:#111827;border:2px solid #000;display:flex;align-items:center;gap:14px;padding:0 13px;position:relative;z-index:8}
        .back-button{width:30px;height:30px;display:grid;place-items:center;color:#000;border:2px solid #000;background:#fde047;box-shadow:2px 2px 0 #fff}
        .brand-lockup{display:flex;gap:6px;align-items:center;font-weight:1000;letter-spacing:.02em;font-size:clamp(17px,3vw,28px);text-shadow:2px 3px 0 #000,-1px -1px #fff}
        .brand-light{color:#fde047;-webkit-text-stroke:1px #fff}.brand-dark{color:#f9a8d4;-webkit-text-stroke:1px #000}
        .camera-status{margin-left:auto;color:#50fb68;font:700 12px ui-monospace,monospace;letter-spacing:.08em;display:flex;align-items:center;gap:7px}.camera-status i{width:8px;height:8px;border-radius:50%;background:#55ff64;box-shadow:0 0 9px #4f5}
        .arcade-board{height:clamp(420px,65vw,690px);min-height:420px;position:relative;overflow:hidden;border:3px solid #000;background:#477d35;isolation:isolate}
        .city-canvas{width:100%;height:100%;display:block;image-rendering:pixelated}
        .weather-indicator{position:absolute;left:10px;top:10px;z-index:6;padding:5px 8px;background:#111827e8;color:#fde047;border:2px solid #000;box-shadow:2px 2px 0 #000;font:900 9px ui-monospace,monospace;letter-spacing:.04em}
        .weather-rain{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(180deg,#11253b24,#10233b46),repeating-linear-gradient(108deg,transparent 0 18px,#d7ecff8c 19px,#d7ecff8c 20px,transparent 21px 38px);background-size:auto,100px 145px;animation:rainfall .42s linear infinite}
        @keyframes rainfall{to{background-position:0 0,0 145px}}
        .hud-bar{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:6;max-width:calc(100% - 18px)}
        .hud-cell{min-width:85px;padding:5px 8px;background:#fef3c7;color:#000;border:2px solid #000;box-shadow:2px 2px 0 #000;text-align:center;font-family:ui-monospace,monospace}
        .hud-cell small{display:block;font-size:8px;font-weight:900;letter-spacing:.06em;white-space:nowrap}.hud-cell strong{display:block;font-size:16px;line-height:1.05}.hud-cell.danger strong{color:#c83222}
        .live-banner{position:absolute;top:66px;left:50%;transform:translateX(-50%);z-index:7;padding:5px 10px;background:#111827e8;color:#fde047;border:2px solid #000;text-align:center;white-space:nowrap;font-weight:1000;font-size:clamp(12px,2vw,22px);text-shadow:2px 2px #000}
        .signal-control{position:absolute;z-index:8;width:38px;min-height:73px;border:3px solid #d6c9a8;background:#171817;padding:5px 4px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;gap:3px;box-shadow:3px 4px 0 #0009;cursor:pointer;transform:translate(-50%,-50%);transition:filter .1s,scale .1s}
        .signal-control:hover:not(:disabled){filter:brightness(1.25);scale:1.08}.signal-control:disabled{cursor:default}.signal-control .bulb{height:14px;width:14px;border-radius:50%;background:#241d19;border:2px solid #0a0a0a}.signal-control .red-on{background:#ff4235;box-shadow:0 0 10px #ff3925}.signal-control .green-on{background:#64ff58;box-shadow:0 0 12px #55ff46}.signal-name{position:absolute;white-space:nowrap;top:-20px;left:50%;transform:translateX(-50%);background:#111c;padding:2px 4px;color:white;font:900 8px ui-monospace,monospace}
        .signal-nw{left:41%;top:42%}.signal-se{left:59%;top:58%}.signal-sw{left:41%;top:58%}.signal-ne{left:59%;top:42%}
        .game-overlay{position:absolute;inset:0;z-index:20;background:#0808069c;display:grid;place-items:center;padding:18px}.menu-overlay{background:linear-gradient(110deg,#0a1008b5,#13100959 60%,#0c0b08a8)}
        .menu-card{width:min(570px,96%);padding:25px 28px 26px;text-align:center;border:5px solid #fde047;background:linear-gradient(145deg,#111827f5,#1f2937f2);box-shadow:0 0 0 4px #000,8px 10px 0 #0009;position:relative}
        .menu-card:before,.menu-card:after{content:"";height:8px;position:absolute;left:0;right:0;background:repeating-linear-gradient(135deg,#fde047 0 10px,#111827 10px 20px)}.menu-card:before{top:-15px}.menu-card:after{bottom:-15px}
        .eyebrow{margin:0;color:#fde047;font:900 11px ui-monospace,monospace;letter-spacing:.22em}.menu-card h1{margin:8px 0 0;font-size:clamp(38px,9vw,76px);line-height:.82;letter-spacing:-.06em;font-weight:1000;color:#fef3c7;text-shadow:4px 4px 0 #000,-2px -2px 0 #fde047}.menu-card h1 span{color:#f9a8d4;text-shadow:4px 4px 0 #000,-2px -2px 0 #fef3c7}
        .menu-copy{margin:19px 0 0;color:#e9dfc8;font-weight:700;font-size:14px;line-height:1.7;text-shadow:1px 2px #111}
        .menu-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:23px}.arcade-button{min-height:48px;padding:9px 16px;border:4px solid #000;box-shadow:inset 0 0 0 2px #ffffff87,0 4px 0 #000;color:#000;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:1000;font-size:clamp(12px,2vw,17px);letter-spacing:.025em;cursor:pointer;transition:transform .1s,filter .1s}.arcade-button:hover{filter:brightness(1.1);transform:translateY(-2px)}.arcade-button:active{transform:translateY(2px);box-shadow:inset 0 0 0 2px #ffffff87,0 1px 0 #000}.primary-button{background:linear-gradient(#fde047,#facc15)}.secondary-button{background:linear-gradient(#f9a8d4,#e879b9)}
        .result-card{width:min(470px,96%);padding:30px;text-align:center;background:#111827f5;color:#fef3c7;border:6px solid #fde047;box-shadow:0 8px 0 #000}.result-card h2{margin:7px 0;font-size:clamp(35px,8vw,60px);font-weight:1000;color:#fde047;text-shadow:3px 4px #000}.result-card p:not(.eyebrow){margin:10px 0 20px;font-weight:700}.crash-card{border-color:#f87171}.crash-card h2{color:#f87171}
        .rules-backdrop{position:absolute;inset:0;z-index:35;display:grid;place-items:center;padding:15px;background:#080706cf}.rules-card{width:min(550px,100%);padding:23px 25px;background:#111827;color:#fef3c7;border:5px solid #fde047;box-shadow:0 8px 0 #000;position:relative}.rules-card h2{margin:7px 0 16px;font-size:32px;font-weight:1000;color:#fde047}.rules-card ol{padding-left:24px;margin:0 0 21px;color:#fef3c7;line-height:1.65;font-size:14px}.rules-card li{padding-left:4px;margin:7px 0}.close-rules{position:absolute;right:10px;top:10px;padding:4px;color:#fde047}
        .arcade-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:53px;padding:8px 11px;background:#111827;border:3px solid #000;color:#fef3c7}.control-hint,.control-stats,.control-stats span,.control-actions{display:flex;align-items:center;gap:8px}.control-hint{font:900 10px ui-monospace,monospace;letter-spacing:.03em}.key-cap{padding:4px 6px;background:#fde047;color:#000;border:2px solid #000}.control-stats{gap:12px;font:800 9px ui-monospace,monospace}.control-stats span{gap:4px}.control-stats svg{color:#fde047}.control-stats b{color:#fff}.control-actions{gap:6px}.control-actions button{width:31px;height:31px;display:grid;place-items:center;background:#1f2937;border:2px solid #fde047;color:#fef3c7}.arcade-credit{display:flex;justify-content:space-between;padding:5px 3px 0;color:#000;font:900 8px ui-monospace,monospace;letter-spacing:.08em}
        @media(max-width:640px){
          .arcade-shell{padding:7px;border-width:3px;box-shadow:inset 0 0 0 2px #fef3c7,4px 4px 0 #000}
          .arcade-header{height:44px;gap:7px;padding:0 7px}.back-button{width:26px;height:26px}.brand-lockup{gap:3px;font-size:clamp(14px,4.4vw,20px)}.camera-status{font-size:7px;letter-spacing:0}
          .arcade-board{height:min(58vh,430px);min-height:300px}.hud-bar{top:6px;gap:2px;max-width:calc(100% - 10px)}.hud-cell{min-width:0;padding:3px 4px}.hud-cell small{font-size:6px;letter-spacing:0}.hud-cell strong{font-size:12px}
          .weather-indicator{left:5px;top:auto;bottom:6px;padding:3px 4px;font-size:6px}.live-banner{top:57px;max-width:82%;white-space:normal;font-size:clamp(10px,3vw,14px)}
          .signal-control{width:30px;min-height:59px;padding:3px 2px;gap:2px;border-width:2px}.signal-control .bulb{height:11px;width:11px}.signal-name{top:-16px;font-size:6px;padding:1px 2px}
          .menu-card{padding:19px 14px}.menu-copy{font-size:12px}.menu-actions{gap:8px;margin-top:17px}.arcade-button{min-height:42px;padding:7px 10px;font-size:11px;border-width:3px}
          .arcade-controls{flex-wrap:wrap;justify-content:center;padding:7px;gap:7px}.control-hint{justify-content:center;flex:1 1 100%;font-size:8px}.control-stats{justify-content:center;gap:7px;font-size:7px}.control-actions{margin-left:auto}.arcade-credit{font-size:6px;letter-spacing:0}
        }
      `}</style>
    </div>
  )
}

function HudCell({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`hud-cell ${danger ? "danger" : ""}`}><small>{label}</small><strong>{value}</strong></div>
}

function SignalButton({ axis, active, label, className, onClick, disabled }: { axis: Axis; active: boolean; label: string; className: string; onClick: () => void; disabled: boolean }) {
  return <button className={`signal-control ${className}`} onClick={onClick} disabled={disabled} aria-label={`Toggle ${axisNames[axis]} signal; currently ${active ? "green" : "red"}`} title={`${label}: click to change signal`}><span className="signal-name">{label}</span><span className={`bulb ${active ? "" : "red-on"}`} /><span className={`bulb ${active ? "green-on" : ""}`} /></button>
}

function SoundIcon({ on }: { on: boolean }) { return on ? <Volume2 size={18} /> : <VolumeX size={18} /> }

function playClickSound(enabled: boolean, green: boolean) {
  if (!enabled || typeof window === "undefined") return
  const audio = new window.AudioContext()
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = "square"
  oscillator.frequency.value = green ? 740 : 390
  gain.gain.setValueAtTime(0.035, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + 0.08)
  oscillator.onended = () => { void audio.close() }
}

function paintScene(ctx: CanvasRenderingContext2D, cars: Car[], lights: Record<Axis, boolean>, screen: string) {
  const w = 960, h = 600
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = "#54863d"; ctx.fillRect(0, 0, w, h)
  drawPixelGround(ctx)
  drawBlock(ctx, 30, 34, 185, 115, "#d7c8a0", "#b8a37d")
  drawBlock(ctx, 738, 32, 176, 113, "#bba88b", "#93806d")
  drawPark(ctx, 32, 420, 185, 145)
  drawPark(ctx, 742, 421, 181, 142)
  drawRoad(ctx, [[-90, -42], [58, -42], [1050, 615], [902, 615]], 11)
  drawRoad(ctx, [[-90, 642], [55, 642], [1050, -30], [904, -30]], 11)
  drawCrosswalk(ctx, 387, 245, 90, 8, -34)
  drawCrosswalk(ctx, 483, 245, 90, 8, 34)
  drawCrosswalk(ctx, 387, 347, 90, 8, 34)
  drawCrosswalk(ctx, 483, 347, 90, 8, -34)
  drawMedianDetails(ctx)
  drawStreetLight(ctx, 366, 216, lights.B)
  drawStreetLight(ctx, 594, 384, lights.B)
  drawStreetLight(ctx, 590, 216, lights.A)
  drawStreetLight(ctx, 370, 384, lights.A)
  drawTree(ctx, 246, 161, 1.15); drawTree(ctx, 712, 160, .95); drawTree(ctx, 255, 454, 1.1); drawTree(ctx, 701, 451, .9)
  drawCarSet(ctx, cars)
  if (screen === "menu") {
    drawCar(ctx, 168, 104, -34, "#2483ca", "car", false)
    drawCar(ctx, 795, 483, -34, "#e5a629", "van", false)
    drawCar(ctx, 170, 483, 34, "#e4503f", "car", false)
    drawCar(ctx, 795, 105, 34, "#56aa4e", "car", false)
  }
  drawSceneFrame(ctx)
}

function drawPixelGround(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < 600; y += 18) for (let x = 0; x < 960; x += 18) {
    if ((x / 18 + y / 18) % 2 === 0) { ctx.fillStyle = "#ffffff08"; ctx.fillRect(x, y, 18, 18) }
    if ((x * 7 + y * 3) % 41 === 0) { ctx.fillStyle = "#c7db6b"; ctx.fillRect(x + 7, y + 8, 3, 3) }
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, points: [number, number][], curb: number) {
  ctx.save(); ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath()
  ctx.fillStyle = "#35393a"; ctx.fill(); ctx.lineWidth = curb; ctx.strokeStyle = "#d9d2b5"; ctx.stroke()
  ctx.lineWidth = 3; ctx.strokeStyle = "#7b805f"; ctx.stroke()
  ctx.setLineDash([22, 18]); ctx.lineWidth = 3; ctx.strokeStyle = "#f0d94c"; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); ctx.lineTo(points[2][0], points[2][1]); ctx.stroke()
  ctx.setLineDash([10, 13]); ctx.lineWidth = 2; ctx.strokeStyle = "#e8e6dcaa"
  const dx = points[2][0] - points[0][0], dy = points[2][1] - points[0][1]
  for (const offset of [-45, 45]) { ctx.beginPath(); ctx.moveTo(points[0][0] + offset, points[0][1] - offset * dx / dy); ctx.lineTo(points[2][0] + offset, points[2][1] - offset * dx / dy); ctx.stroke() }
  ctx.setLineDash([]); ctx.restore()
}

function drawCrosswalk(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, width: number, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180); ctx.fillStyle = "#f1efe2"
  for (let i = 0; i < count; i += 12) ctx.fillRect(i, 0, 7, width)
  ctx.restore()
}

function drawMedianDetails(ctx: CanvasRenderingContext2D) {
  for (const [x, y] of [[424, 255], [536, 255], [424, 345], [536, 345]]) {
    ctx.fillStyle = "#b3a98e"; ctx.fillRect(x - 10, y - 5, 20, 10)
    ctx.fillStyle = "#6c9e4c"; ctx.fillRect(x - 6, y - 3, 12, 6)
    ctx.fillStyle = "#dbe5b3"; ctx.fillRect(x - 2, y - 2, 4, 4)
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, front: string, side: string) {
  ctx.fillStyle = "#34332a"; ctx.fillRect(x + 9, y + h - 2, w + 16, 15)
  ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(x + w, y + 10); ctx.lineTo(x + w + 15, y); ctx.lineTo(x + w + 15, y + h - 5); ctx.lineTo(x + w, y + h); ctx.fill()
  ctx.fillStyle = front; ctx.fillRect(x, y + 9, w, h - 9)
  ctx.fillStyle = "#efe3c6"; ctx.fillRect(x - 4, y + 4, w + 8, 9)
  ctx.fillStyle = "#554f41"; ctx.fillRect(x - 5, y + h - 2, w + 22, 8)
  for (let wy = y + 24; wy < y + h - 18; wy += 24) for (let wx = x + 14; wx < x + w - 12; wx += 27) {
    ctx.fillStyle = "#857e67"; ctx.fillRect(wx - 2, wy - 2, 17, 17)
    ctx.fillStyle = "#8cc3c2"; ctx.fillRect(wx, wy, 13, 13)
    ctx.fillStyle = "#d4d2b8"; ctx.fillRect(wx + 5, wy, 2, 13); ctx.fillRect(wx, wy + 6, 13, 2)
  }
  ctx.fillStyle = "#729c43"; ctx.fillRect(x + 3, y + h - 15, w - 6, 7)
}

function drawPark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#bea987"; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = "#d7c9a4"; ctx.fillRect(x + 7, y + 8, w - 14, h - 16)
  ctx.fillStyle = "#8c775c"; ctx.fillRect(x + 7, y + h / 2 - 5, w - 14, 10); ctx.fillRect(x + w / 2 - 5, y + 8, 10, h - 16)
  ctx.fillStyle = "#5d923e"; ctx.fillRect(x + 12, y + 12, w - 24, h - 24)
  for (let i = 0; i < 10; i++) drawTree(ctx, x + 22 + (i * 37) % (w - 44), y + 22 + (i * 53) % (h - 44), .42 + (i % 3) * .08)
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
  ctx.fillStyle = "#59442a"; ctx.fillRect(-3, -3, 6, 21); ctx.fillRect(-7, 14, 14, 4)
  ctx.fillStyle = "#1b522d"; ctx.fillRect(-15, -21, 30, 17); ctx.fillRect(-11, -30, 22, 12); ctx.fillRect(-6, -36, 12, 9)
  ctx.fillStyle = "#328140"; ctx.fillRect(-12, -24, 24, 13); ctx.fillRect(-8, -32, 16, 11)
  ctx.fillStyle = "#65a74a"; ctx.fillRect(-5, -32, 4, 4); ctx.fillRect(7, -22, 4, 4); ctx.fillRect(-11, -15, 4, 4)
  ctx.restore()
}

function drawStreetLight(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean) {
  ctx.fillStyle = "#1c201c"; ctx.fillRect(x - 3, y, 6, 30); ctx.fillRect(x - 11, y + 28, 22, 4)
  ctx.fillStyle = "#ded5bd"; ctx.fillRect(x - 6, y - 23, 12, 23); ctx.fillStyle = "#292824"; ctx.fillRect(x - 4, y - 21, 8, 19)
  ctx.fillStyle = "#f04c36"; ctx.fillRect(x - 2, y - 19, 4, 4); ctx.fillStyle = active ? "#7bff56" : "#42342b"; ctx.fillRect(x - 2, y - 11, 4, 4)
  ctx.fillStyle = "#fff2a0"; ctx.fillRect(x - 2, y - 3, 4, 3)
}

function drawCarSet(ctx: CanvasRenderingContext2D, cars: Car[]) {
  for (const car of cars) {
    const [sx, sy] = starts[car.from], [ex, ey] = ends[car.from]
    const x = sx + (ex - sx) * car.progress
    const y = sy + (ey - sy) * car.progress
    const angle = Math.atan2(ey - sy, ex - sx)
    drawCar(ctx, x, y, angle * 180 / Math.PI, car.color, car.kind, car.wait > 45)
  }
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, kind: Car["kind"], angry: boolean) {
  const length = kind === "bus" ? 42 : kind === "van" ? 34 : 28
  const height = kind === "bus" ? 20 : 17
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180)
  ctx.fillStyle = "#141713"; ctx.fillRect(-length / 2 + 2, -height / 2 + 5, length, height)
  ctx.fillStyle = "#161616"; ctx.fillRect(-length / 2 + 5, -height / 2 - 2, 8, 5); ctx.fillRect(length / 2 - 13, -height / 2 - 2, 8, 5); ctx.fillRect(-length / 2 + 5, height / 2 - 2, 8, 5); ctx.fillRect(length / 2 - 13, height / 2 - 2, 8, 5)
  ctx.fillStyle = "#202321"; ctx.fillRect(-length / 2, -height / 2, length, height)
  ctx.fillStyle = color; ctx.fillRect(-length / 2 + 2, -height / 2 - 2, length - 4, height - 3); ctx.fillRect(-length / 2 + 5, -height / 2 - 4, length - 11, 3)
  ctx.fillStyle = "#8fd6df"; ctx.fillRect(-length / 2 + 7, -height / 2 + 1, Math.floor(length * .24), height - 8); ctx.fillRect(1, -height / 2 + 1, Math.floor(length * .24), height - 8)
  ctx.fillStyle = "#eff2ce"; ctx.fillRect(length / 2 - 4, -height / 2 + 2, 3, 3); ctx.fillRect(length / 2 - 4, height / 2 - 5, 3, 3)
  ctx.fillStyle = "#f44336"; ctx.fillRect(-length / 2 + 1, -height / 2 + 2, 3, 3); ctx.fillRect(-length / 2 + 1, height / 2 - 5, 3, 3)
  ctx.fillStyle = "#ffffff30"; ctx.fillRect(-length / 2 + 3, -height / 2 - 2, length - 8, 2)
  if (angry) { ctx.fillStyle = "#fff5c8"; ctx.fillRect(-3, -height / 2 - 13, 13, 9); ctx.fillStyle = "#cf3328"; ctx.font = "bold 8px monospace"; ctx.fillText("!", 1, -height / 2 - 6) }
  ctx.restore()
}

function drawSceneFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#1f1711"; ctx.lineWidth = 7; ctx.strokeRect(3, 3, 954, 594)
  ctx.strokeStyle = "#c18a53"; ctx.lineWidth = 2; ctx.strokeRect(9, 9, 942, 582)
}

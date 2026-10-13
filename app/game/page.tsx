"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Video, BarChart2, Gamepad2, Settings, CloudRain, Cpu, Activity, TrafficCone, Play, Square, Timer, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { loadTrafficSettings } from "@/lib/traffic-settings"

type Direction = 'N' | 'S' | 'W' | 'E';
type Turn = 'STRAIGHT' | 'LEFT' | 'RIGHT';
type SignalPhase =
  | 'NS_STRAIGHT' | 'NS_STRAIGHT_YELLOW'
  | 'N_LEFT' | 'N_LEFT_YELLOW' | 'S_LEFT' | 'S_LEFT_YELLOW'
  | 'NS_RIGHT' | 'NS_RIGHT_YELLOW' | 'CLEAR_1'
  | 'EW_STRAIGHT' | 'EW_STRAIGHT_YELLOW'
  | 'W_LEFT' | 'W_LEFT_YELLOW' | 'E_LEFT' | 'E_LEFT_YELLOW'
  | 'EW_RIGHT' | 'EW_RIGHT_YELLOW' | 'CLEAR_2';

type CarType = {
  id: number;
  dir: Direction;
  turn: Turn;
  lane: 'LEFT' | 'RIGHT';
  pos: number;
  speed: number;
  maxSpeed: number;
  color: string;
  kind: 'CAR' | 'MOTORCYCLE' | 'TRUCK';
  length: number;
};

export default function GameSimulatorPage() {
  const pathname = usePathname()
  // กำหนดเวลามาตรฐานตามหลักวิศวกรรมการจราจร[span_4](start_span)[span_4](end_span)
  const [phaseTimes, setPhaseTimes] = useState({
    nsStraight: 16,
    nsLeft: 5,
    nsRight: 5,
    ewStraight: 16,
    ewLeft: 5,
    ewRight: 5,
    yellow: 3,
    allRed: 2,
  });

  const [weather, setWeather] = useState("NORMAL");
  const [junctionType, setJunctionType] = useState("4-WAY");
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [trafficDensity, setTrafficDensity] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [vehicleMix, setVehicleMix] = useState({ motorcyclePercent: 22, truckPercent: 12 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameTime, setGameTime] = useState(180); 
  const [currentPhase, setCurrentPhase] = useState<SignalPhase>('NS_STRAIGHT');
  const [timeLeft, setTimeLeft] = useState(16);
  const [score, setScore] = useState(0);

  const phaseRef = useRef(currentPhase);
  useEffect(() => { phaseRef.current = currentPhase; }, [currentPhase]);

  const [cars, setCars] = useState<CarType[]>([]);
  const carsRef = useRef<CarType[]>([]);
  const carIdCounter = useRef(0);

  useEffect(() => {
    const settings = loadTrafficSettings();
    setWeather(settings.simulation.startingWeather);
    setSpeedMultiplier(settings.simulation.speedMultiplier);
    setTrafficDensity(settings.simulation.trafficDensity);
    setVehicleMix(settings.vehicleMix);
  }, []);

  const nsQueue = cars.filter(c => (c.dir === 'N' || c.dir === 'S') && c.pos < 35).length;
  const ewQueue = cars.filter(c => (c.dir === 'E' || c.dir === 'W') && c.pos < 35).length;
  const queueFor = (axis: 'NS' | 'EW', turn: Turn) => cars.filter(car => {
    const carAxis = car.dir === 'N' || car.dir === 'S' ? 'NS' : 'EW';
    return carAxis === axis && car.turn === turn && car.pos < 35;
  }).length;
  const movementQueues = {
    nsStraight: queueFor('NS', 'STRAIGHT'),
    nsLeft: queueFor('NS', 'LEFT'),
    nsRight: queueFor('NS', 'RIGHT'),
    ewStraight: queueFor('EW', 'STRAIGHT'),
    ewLeft: queueFor('EW', 'LEFT'),
    ewRight: queueFor('EW', 'RIGHT'),
  };
  const suggestGreen = (queue: number, turn: Turn) => Math.min(35, Math.max(5, Math.round((turn === 'STRAIGHT' ? 8 : 5) + queue * 2.5)));
  const recommended = {
    nsStraight: suggestGreen(movementQueues.nsStraight, 'STRAIGHT'),
    nsLeft: suggestGreen(movementQueues.nsLeft, 'LEFT'),
    nsRight: suggestGreen(movementQueues.nsRight, 'RIGHT'),
    ewStraight: suggestGreen(movementQueues.ewStraight, 'STRAIGHT'),
    ewLeft: suggestGreen(movementQueues.ewLeft, 'LEFT'),
    ewRight: suggestGreen(movementQueues.ewRight, 'RIGHT'),
  };

  useEffect(() => {
    carsRef.current = [];
    setCars([]);
  }, [junctionType]);

  // --- Logic การเปลี่ยนเฟสสัญญาณไฟตามมาตราฐาน 4 แยก / 3 แยก ---
  const nextPhase: Record<SignalPhase, SignalPhase> = {
    NS_STRAIGHT: 'NS_STRAIGHT_YELLOW',
    NS_STRAIGHT_YELLOW: 'N_LEFT',
    N_LEFT: 'N_LEFT_YELLOW',
    N_LEFT_YELLOW: 'S_LEFT',
    S_LEFT: 'S_LEFT_YELLOW',
    S_LEFT_YELLOW: 'NS_RIGHT',
    NS_RIGHT: 'NS_RIGHT_YELLOW',
    NS_RIGHT_YELLOW: 'CLEAR_1',
    CLEAR_1: 'EW_STRAIGHT',
    EW_STRAIGHT: 'EW_STRAIGHT_YELLOW',
    EW_STRAIGHT_YELLOW: 'W_LEFT',
    W_LEFT: 'W_LEFT_YELLOW',
    W_LEFT_YELLOW: 'E_LEFT',
    E_LEFT: 'E_LEFT_YELLOW',
    E_LEFT_YELLOW: 'EW_RIGHT',
    EW_RIGHT: 'EW_RIGHT_YELLOW',
    EW_RIGHT_YELLOW: 'CLEAR_2',
    CLEAR_2: 'NS_STRAIGHT',
  };

  const durationForPhase = (phase: SignalPhase) => {
    if (phase.endsWith('_YELLOW')) return phaseTimes.yellow;
    if (phase === 'CLEAR_1' || phase === 'CLEAR_2') return phaseTimes.allRed;
    if (phase === 'NS_STRAIGHT') return phaseTimes.nsStraight;
    if (phase === 'N_LEFT' || phase === 'S_LEFT') return phaseTimes.nsLeft;
    if (phase === 'NS_RIGHT') return phaseTimes.nsRight;
    if (phase === 'EW_STRAIGHT') return phaseTimes.ewStraight;
    if (phase === 'W_LEFT' || phase === 'E_LEFT') return phaseTimes.ewLeft;
    return phaseTimes.ewRight;
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (timeLeft > 1) {
        setTimeLeft(timeLeft - 1);
        return;
      }

      const isClearance = currentPhase.endsWith('_YELLOW') || currentPhase === 'CLEAR_1' || currentPhase === 'CLEAR_2';
      const intersectionOccupied = carsRef.current.some(car => {
        const halfLength = car.length / 2;
        const exitDistance = car.turn === 'LEFT' ? 72 + halfLength : car.turn === 'RIGHT' ? 53 + halfLength : 62 + halfLength;
        return car.pos + halfLength > 35 && car.pos < exitDistance;
      });
      if (isClearance && intersectionOccupied) {
        setTimeLeft(1);
        return;
      }

      let next = nextPhase[currentPhase];
      if (junctionType === '3-WAY') {
        const unavailablePhases: SignalPhase[] = ['EW_STRAIGHT', 'EW_STRAIGHT_YELLOW', 'N_LEFT', 'N_LEFT_YELLOW', 'E_LEFT', 'E_LEFT_YELLOW'];
        while (unavailablePhases.includes(next)) next = nextPhase[next];
      }
      setCurrentPhase(next);
      setTimeLeft(durationForPhase(next));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft, currentPhase, phaseTimes, junctionType]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setGameTime(previous => Math.max(0, previous - 1)), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (gameTime === 0) setIsPlaying(false);
  }, [gameTime]);

  // Fixed-step car-following model with acceleration, safe headway, and signal stopping.
  useEffect(() => {
    let gameLoop: NodeJS.Timeout;
    let spawnTimer: NodeJS.Timeout;

    if (isPlaying) {
      const densityInterval = trafficDensity === 'HIGH' ? 500 : trafficDensity === 'LOW' ? 1300 : 850;
      const spawnInterval = weather === 'RUSH HOUR' ? Math.min(densityInterval, 500) : weather === 'HEAVY RAIN' ? Math.round(densityInterval * 1.3) : densityInterval;

      spawnTimer = setInterval(() => {
        const availableDirs: Direction[] = junctionType === '3-WAY' ? ['N', 'S', 'W'] : ['N', 'S', 'W', 'E'];
        const dir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
        let availableTurns: Turn[] = ['STRAIGHT', 'LEFT', 'RIGHT'];
        if (junctionType === '3-WAY') {
          if (dir === 'N') availableTurns = ['STRAIGHT', 'RIGHT'];
          if (dir === 'S') availableTurns = ['STRAIGHT', 'LEFT'];
          if (dir === 'W') availableTurns = ['LEFT', 'RIGHT'];
        }
        const turn = availableTurns[Math.floor(Math.random() * availableTurns.length)];
        const lane: CarType['lane'] = turn === 'LEFT' ? 'LEFT' : 'RIGHT';
        const vehicleRoll = Math.random();
        const motorcycleThreshold = vehicleMix.motorcyclePercent / 100;
        const truckThreshold = 1 - vehicleMix.truckPercent / 100;
        const vehicle = vehicleRoll < motorcycleThreshold
          ? { kind: 'MOTORCYCLE' as const, color: 'bg-cyan-300', length: 5, maxSpeed: 65 }
          : vehicleRoll >= truckThreshold
            ? { kind: 'TRUCK' as const, color: 'bg-orange-400', length: 10, maxSpeed: 42 }
            : { kind: 'CAR' as const, color: ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-purple-500', 'bg-white'][Math.floor(Math.random() * 5)], length: 7, maxSpeed: 55 };

        const previous = carsRef.current;
        if (previous.some(car => car.dir === dir && car.lane === lane && car.pos < 10)) return;
        carIdCounter.current += 1;
        const nextCars = [...previous, {
            id: carIdCounter.current,
            dir,
            turn,
            lane,
            pos: -10,
            speed: 0,
            ...vehicle,
          }];
        carsRef.current = nextCars;
        setCars(nextCars);
      }, spawnInterval);

      gameLoop = setInterval(() => {
        const previousCars = carsRef.current;
        let passedCarsCount = 0;
          const dt = 0.05;
          const stopLine = 35;
          const phase = phaseRef.current;

          const updatedCars = previousCars.map(car => {
            const axis = car.dir === 'N' || car.dir === 'S' ? 'NS' : 'EW';
            const canEnter = car.turn === 'LEFT' ? phase === car.dir + '_LEFT' : phase === axis + '_' + car.turn;
            const leaders = previousCars
              .filter(other => other.id !== car.id && other.dir === car.dir && other.lane === car.lane && other.pos > car.pos)
              .sort((a, b) => a.pos - b.pos);
            const leader = leaders[0];

            const rainFactor = weather === 'HEAVY RAIN' ? 0.82 : 1;
            const turnFactor = car.turn !== 'STRAIGHT' && car.pos >= 40 && car.pos <= 60 ? 0.78 : 1;
            const desiredSpeed = car.maxSpeed * speedMultiplier * rainFactor * turnFactor;
            const acceleration = 20;
            const comfortableBrake = 8;
            let accel = acceleration * (1 - Math.pow(car.speed / desiredSpeed, 4));

            const applyFollowing = (gap: number, leaderSpeed: number) => {
              const minimumGap = car.kind === 'MOTORCYCLE' ? 4 : 6;
              const headway = weather === 'HEAVY RAIN' ? 1.8 : 1.35;
              const desiredGap = minimumGap + Math.max(
                0,
                car.speed * headway +
                (car.speed * (car.speed - leaderSpeed)) / (2 * Math.sqrt(acceleration * comfortableBrake))
              );
              accel -= acceleration * Math.pow(desiredGap / Math.max(gap, 0.5), 2);
            };

            if (leader) {
              const gap = leader.pos - car.pos - (leader.length + car.length) / 2;
              applyFollowing(gap, leader.speed);
            }

            const stopDistance = stopLine - car.length / 2 - car.pos;
            const hasCrossedStopLine = car.pos + car.length / 2 >= stopLine;
            if (!canEnter && !hasCrossedStopLine && stopDistance > 0) applyFollowing(stopDistance, 0);

            let speed = Math.max(0, Math.min(desiredSpeed, car.speed + accel * dt));
            let pos = car.pos + speed * dt;
            if (!canEnter && !hasCrossedStopLine && pos + car.length / 2 > stopLine) {
              pos = stopLine - car.length / 2;
              speed = 0;
            }

            return { ...car, pos, speed };
          }).filter(car => {
            const exitDistance = car.turn === 'STRAIGHT' ? 115 : car.turn === 'RIGHT' ? 96 : 116;
            if (car.pos >= exitDistance) {
              passedCarsCount += 1;
              return false;
            }
            return true;
          });

        carsRef.current = updatedCars;
        setCars(updatedCars);
        if (passedCarsCount > 0) setScore(previous => previous + passedCarsCount);
      }, 50);
    }

    return () => {
      clearInterval(gameLoop);
      clearInterval(spawnTimer);
    };
  }, [isPlaying, weather, junctionType, speedMultiplier, trafficDensity, vehicleMix]);

  const toggleSimulation = () => {
    if (!isPlaying && gameTime === 0) return;
    setIsPlaying(playing => !playing);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameTime(180);
    setScore(0);
    carsRef.current = [];
    setCars([]);
    phaseRef.current = 'NS_STRAIGHT';
    setCurrentPhase('NS_STRAIGHT');
    setTimeLeft(phaseTimes.nsStraight);
  };

  const updatePhaseTime = (key: keyof typeof phaseTimes, delta: number) => {
    setPhaseTimes(prev => ({
      ...prev,
      [key]: Math.max(2, prev[key] + delta)
    }));
  };

  const renderCarStyle = (car: CarType): React.CSSProperties => {
    let x = 0;
    let y = 0;
    let rotation = 0;
    const pos = car.pos;
    const curves: Record<string, { p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number]; start: number; delta: number }> = {
      N_RIGHT: { p0: [42, 40], p1: [42, 44], p2: [34, 42], p3: [30, 42], start: 180, delta: 90 },
      N_LEFT: { p0: [47, 40], p1: [47, 47], p2: [50, 53], p3: [50, 53], start: 180, delta: -90 },
      S_RIGHT: { p0: [58, 60], p1: [58, 56], p2: [66, 58], p3: [70, 58], start: 0, delta: 90 },
      S_LEFT: { p0: [53, 60], p1: [53, 53], p2: [50, 47], p3: [50, 47], start: 0, delta: -90 },
      W_RIGHT: { p0: [40, 58], p1: [44, 58], p2: [42, 66], p3: [42, 70], start: 90, delta: 90 },
      W_LEFT: { p0: [40, 53], p1: [47, 53], p2: [53, 50], p3: [53, 50], start: 90, delta: -90 },
      E_RIGHT: { p0: [60, 42], p1: [56, 42], p2: [58, 34], p3: [58, 30], start: -90, delta: 90 },
      E_LEFT: { p0: [60, 47], p1: [53, 47], p2: [47, 50], p3: [47, 50], start: -90, delta: -90 },
    };

    const curve = curves[car.dir + '_' + car.turn];
    if (car.turn === 'STRAIGHT' || !curve) {
      if (car.dir === 'N') { x = car.lane === 'LEFT' ? 47 : 42; y = pos; rotation = 180; }
      else if (car.dir === 'S') { x = car.lane === 'LEFT' ? 53 : 58; y = 100 - pos; rotation = 0; }
      else if (car.dir === 'W') { x = pos; y = car.lane === 'LEFT' ? 53 : 58; rotation = 90; }
      else { x = 100 - pos; y = car.lane === 'LEFT' ? 47 : 42; rotation = -90; }
    } else if (pos < 40) {
      if (car.dir === 'N') { x = car.lane === 'LEFT' ? 47 : 42; y = pos; rotation = 180; }
      else if (car.dir === 'S') { x = car.lane === 'LEFT' ? 53 : 58; y = 100 - pos; rotation = 0; }
      else if (car.dir === 'W') { x = pos; y = car.lane === 'LEFT' ? 53 : 58; rotation = 90; }
      else { x = 100 - pos; y = car.lane === 'LEFT' ? 47 : 42; rotation = -90; }
    } else if (pos <= 60) {
      const t = (pos - 40) / 20;
      const u = 1 - t;
      x = u * u * u * curve.p0[0] + 3 * u * u * t * curve.p1[0] + 3 * u * t * t * curve.p2[0] + t * t * t * curve.p3[0];
      y = u * u * u * curve.p0[1] + 3 * u * u * t * curve.p1[1] + 3 * u * t * t * curve.p2[1] + t * t * t * curve.p3[1];
      rotation = curve.start + curve.delta * t;
    } else if (car.dir === 'N' && car.turn === 'RIGHT') {
      x = 90 - pos; y = 42; rotation = 270;
    } else if (car.dir === 'N' && car.turn === 'LEFT') {
      x = pos - 10; y = 53; rotation = 90;
    } else if (car.dir === 'S' && car.turn === 'RIGHT') {
      x = pos + 10; y = 58; rotation = 90;
    } else if (car.dir === 'S' && car.turn === 'LEFT') {
      x = 110 - pos; y = 47; rotation = -90;
    } else if (car.dir === 'W' && car.turn === 'RIGHT') {
      x = 42; y = pos + 10; rotation = 180;
    } else if (car.dir === 'W' && car.turn === 'LEFT') {
      x = 53; y = 110 - pos; rotation = 0;
    } else if (car.dir === 'E' && car.turn === 'RIGHT') {
      x = 58; y = 90 - pos; rotation = 0;
    } else {
      x = 47; y = pos; rotation = 180;
    }

    return {
      width: car.kind === 'MOTORCYCLE' ? '0.9rem' : car.kind === 'TRUCK' ? '1.8rem' : '1.3rem',
      height: car.kind === 'MOTORCYCLE' ? '1.7rem' : car.kind === 'TRUCK' ? '3.2rem' : '2.4rem',
      position: 'absolute',
      top: `${y}%`,
      left: `${x}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      transition: 'top 0.05s linear, left 0.05s linear, transform 0.05s linear',
      borderRadius: car.kind === 'MOTORCYCLE' ? '999px' : '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    };
  };

  const getArrowStatus = (dir: Direction, action: Turn) => {
    if (!isPlaying || gameTime === 0) return 'bg-red-500';
    const isNS = dir === 'N' || dir === 'S';
    const axis = isNS ? 'NS' : 'EW';
    const movementPhase = action === 'LEFT' ? dir + '_LEFT' : axis + '_' + action;
    if (currentPhase === movementPhase) return 'bg-green-500 shadow-[0_0_8px_#22c55e]';
    if (currentPhase === movementPhase + '_YELLOW') return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    return 'bg-red-500';
  };

  return (
    <div className="flex h-dvh min-h-[600px] bg-[#fef3c7] overflow-hidden font-mono text-black">
      
            {/* Sidebar มาตรฐานเดียวกันทุกหน้า */}
      <aside className="w-64 bg-gray-900 flex flex-col py-8 px-4 gap-6 text-white shrink-0 border-r-4 border-black z-10 hidden md:flex">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-300 border-2 border-white rounded-none shadow-[2px_2px_0_0_#fff]"></div>
          <h1 className="text-xl font-black tracking-widest uppercase">TRAFFIC<br/>LAB</h1>
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
      <main className="min-w-0 flex-1 p-4 md:p-6 overflow-y-auto relative bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:20px_20px] flex flex-col gap-6">
        
        {/* TOP COMMAND BAR (ตั้งเวลาเฟสสัญญาณไฟ) */}
        <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-4 flex flex-wrap items-center gap-4 z-20 relative text-xs">
          
          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">N-S STRAIGHT</span>
            <div className="flex items-center gap-2 justify-between">
              <span>เวลา:</span>
              <div className="flex items-center gap-1">
                <button disabled={isPlaying} onClick={() => updatePhaseTime('nsStraight', -5)} className="bg-white px-1 border border-black">-</button>
                <span className="font-bold w-6 text-center">{phaseTimes.nsStraight}s</span>
                <button disabled={isPlaying} onClick={() => updatePhaseTime('nsStraight', 5)} className="bg-white px-1 border border-black">+</button>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">N-S LEFT TURN</span>
            <div className="flex items-center gap-2 justify-between"><span>Time:</span><div className="flex items-center gap-1">
              <button disabled={isPlaying} onClick={() => updatePhaseTime('nsLeft', -2)} className="bg-white px-1 border border-black">-</button>
              <span className="font-bold w-6 text-center">{phaseTimes.nsLeft}s</span>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('nsLeft', 2)} className="bg-white px-1 border border-black">+</button>
            </div></div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">N-S RIGHT TURN</span>
            <div className="flex items-center gap-2 justify-between">
              <span>เวลา:</span>
              <div className="flex items-center gap-1">
                <button disabled={isPlaying} onClick={() => updatePhaseTime('nsRight', -2)} className="bg-white px-1 border border-black">-</button>
                <span className="font-bold w-6 text-center">{phaseTimes.nsRight}s</span>
                <button disabled={isPlaying} onClick={() => updatePhaseTime('nsRight', 2)} className="bg-white px-1 border border-black">+</button>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">E-W STRAIGHT</span>
            <div className="flex items-center gap-2 justify-between">
              <span>เวลา:</span>
              <div className="flex items-center gap-1">
                <button disabled={isPlaying} onClick={() => updatePhaseTime('ewStraight', -5)} className="bg-white px-1 border border-black">-</button>
                <span className="font-bold w-6 text-center">{phaseTimes.ewStraight}s</span>
                <button disabled={isPlaying} onClick={() => updatePhaseTime('ewStraight', 5)} className="bg-white px-1 border border-black">+</button>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">E-W LEFT TURN</span>
            <div className="flex items-center gap-2 justify-between"><span>Time:</span><div className="flex items-center gap-1">
              <button disabled={isPlaying} onClick={() => updatePhaseTime('ewLeft', -2)} className="bg-white px-1 border border-black">-</button>
              <span className="font-bold w-6 text-center">{phaseTimes.ewLeft}s</span>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('ewLeft', 2)} className="bg-white px-1 border border-black">+</button>
            </div></div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">E-W RIGHT TURN</span>
            <div className="flex items-center gap-2 justify-between">
              <span>เวลา:</span>
              <div className="flex items-center gap-1">
                <button disabled={isPlaying} onClick={() => updatePhaseTime('ewRight', -2)} className="bg-white px-1 border border-black">-</button>
                <span className="font-bold w-6 text-center">{phaseTimes.ewRight}s</span>
                <button disabled={isPlaying} onClick={() => updatePhaseTime('ewRight', 2)} className="bg-white px-1 border border-black">+</button>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-2 border-2 border-black flex flex-col gap-1">
            <span className="font-black uppercase text-center border-b border-black pb-0.5">YELLOW / ALL RED</span>
            <div className="flex items-center gap-2">
              <span>Y {phaseTimes.yellow}s</span>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('yellow', -1)} className="bg-white px-1 border border-black">-</button>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('yellow', 1)} className="bg-white px-1 border border-black">+</button>
              <span>R {phaseTimes.allRed}s</span>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('allRed', -1)} className="bg-white px-1 border border-black">-</button>
              <button disabled={isPlaying} onClick={() => updatePhaseTime('allRed', 1)} className="bg-white px-1 border border-black">+</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-blue-300 p-2 border-2 border-black flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-black" />
              <select className="bg-transparent font-black text-xs uppercase outline-none cursor-pointer" value={weather} onChange={(e) => setWeather(e.target.value)} disabled={isPlaying}>
                <option value="NORMAL">Normal</option>
                <option value="RUSH HOUR">Rush Hour</option>
                <option value="HEAVY RAIN">Heavy Rain</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-orange-300 p-2 border-2 border-black flex items-center gap-2">
              <TrafficCone className="w-4 h-4 text-black" />
              <select className="bg-transparent font-black text-xs uppercase outline-none cursor-pointer" value={junctionType} onChange={(e) => setJunctionType(e.target.value)} disabled={isPlaying}>
                <option value="4-WAY">4-WAY</option>
                <option value="3-WAY">3-WAY</option>
              </select>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
             <div className="text-xl font-black bg-black text-yellow-400 px-3 py-1 border-2 border-black">
                {gameTime}s
             </div>
             <button onClick={resetGame} className="bg-gray-300 p-2 border-2 border-black hover:bg-gray-200">
                <RotateCcw className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[560px]">
          
          <Card className="lg:col-span-2 min-h-[520px] rounded-none border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[#4ade80] relative overflow-hidden flex flex-col">
            <div className="p-4 bg-black text-white flex justify-between items-center border-b-4 border-black z-30">
               <div className="flex items-center gap-4">
                 <h2 className="font-black uppercase flex items-center gap-2"><Gamepad2 className="w-5 h-5" /> SIMULATION</h2>
                 <div className="flex items-center gap-2 text-yellow-400 font-bold bg-gray-800 px-3 py-1 border-2 border-yellow-400 text-xs">
                   <Timer className={isPlaying ? "w-4 h-4 animate-spin-slow" : "w-4 h-4"} />
                   {isPlaying ? "PHASE" : gameTime === 180 && score === 0 ? "READY" : "PAUSED"}: {currentPhase.replaceAll('_', ' ')} ({timeLeft}s)
                 </div>
               </div>
               
               <button 
                  onClick={toggleSimulation}
                  disabled={gameTime === 0}
                  className={`${isPlaying ? 'bg-red-500' : 'bg-green-500'} disabled:opacity-50 text-black px-4 py-2 border-4 border-white font-black hover:opacity-80 flex items-center gap-2 transition-colors`}
                >
                 {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />} 
                 {isPlaying ? 'STOP SIM' : 'RUN SIM'}
               </button>
            </div>
            
            <div className="flex-1 min-h-[420px] relative bg-[#3f6212] overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[30%] bg-gray-800 border-x-4 border-yellow-500 z-0">
                 <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white border-dashed border-y-8 border-y-gray-800"></div>
                 <div className="absolute top-0 h-[35%] left-[33.33%] border-l-2 border-dashed border-white/80"></div>
                 <div className="absolute bottom-0 h-[35%] left-[66.66%] border-l-2 border-dashed border-white/80"></div>
                 <div className="absolute top-[35%] left-0 w-1/2 h-2 bg-white"></div>
                 <div className="absolute bottom-[35%] right-0 w-1/2 h-2 bg-white"></div>
              </div>
              
              {junctionType === '4-WAY' && (
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[30%] bg-gray-800 border-y-4 border-yellow-500 z-0">
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-white border-dashed border-x-4 border-x-gray-800"></div>
                  <div className="absolute left-0 w-[35%] top-[33.33%] border-t-2 border-dashed border-white/80"></div>
                  <div className="absolute right-0 w-[35%] top-[66.66%] border-t-2 border-dashed border-white/80"></div>
                  <div className="absolute left-[35%] bottom-0 w-2 h-1/2 bg-white"></div>
                  <div className="absolute right-[35%] top-0 w-2 h-1/2 bg-white"></div>
                </div>
              )}

              {junctionType === '3-WAY' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[30%] bg-gray-800 border-y-4 border-yellow-500 z-0 w-[65%]">
                  <div className="absolute left-0 right-0 top-[33%] h-0.5 bg-white border-dashed border-x-4 border-x-gray-800 w-full"></div>
                  <div className="absolute left-0 right-0 top-[66%] border-t-2 border-dashed border-white/80"></div>
                  <div className="absolute left-[35%] bottom-0 w-2 h-1/2 bg-white"></div>
                </div>
              )}

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-gray-800 z-0 border-l-4 border-gray-800"></div>

              {cars.map(car => (
                <div key={car.id} className={`${car.color} border-2 border-black z-10`} style={renderCarStyle(car)}>
                   <div className="absolute top-[22%] left-[14%] right-[14%] h-[25%] rounded-sm bg-sky-100/70 border border-black/40"></div>
                </div>
              ))}

              {/* สัญญาณไฟลูกศร 3 ช่อง[span_9](start_span)[span_9](end_span) */}
              <div className="absolute top-[28%] left-[26%] w-6 h-16 bg-black border-2 border-white flex flex-col items-center justify-evenly z-20 shadow-lg">
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('N', 'STRAIGHT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('N', 'LEFT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('N', 'RIGHT')}`}></div>
              </div>
              <div className="absolute bottom-[28%] right-[26%] w-6 h-16 bg-black border-2 border-white flex flex-col items-center justify-evenly z-20 shadow-lg">
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('S', 'STRAIGHT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('S', 'LEFT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('S', 'RIGHT')}`}></div>
              </div>
              <div className="absolute bottom-[26%] left-[28%] w-16 h-6 bg-black border-2 border-white flex items-center justify-evenly z-20 shadow-lg">
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('W', 'STRAIGHT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('W', 'LEFT')}`}></div>
                <div className={`w-3 h-3 rounded-full ${getArrowStatus('W', 'RIGHT')}`}></div>
              </div>
              {junctionType === '4-WAY' && (
                <div className="absolute top-[26%] right-[28%] w-16 h-6 bg-black border-2 border-white flex items-center justify-evenly z-20 shadow-lg">
                  <div className={`w-3 h-3 rounded-full ${getArrowStatus('E', 'STRAIGHT')}`}></div>
                  <div className={`w-3 h-3 rounded-full ${getArrowStatus('E', 'LEFT')}`}></div>
                  <div className={`w-3 h-3 rounded-full ${getArrowStatus('E', 'RIGHT')}`}></div>
                </div>
              )}

              {gameTime === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
                  <div className="bg-yellow-400 p-8 border-8 border-black text-center shadow-[8px_8px_0_0_#000]">
                    <h1 className="text-5xl font-black mb-2 uppercase">TIME'S UP!</h1>
                    <p className="text-xl font-bold">Vehicles cleared: {score}.</p>
                    <button onClick={resetGame} className="mt-6 bg-black text-white px-6 py-3 font-black text-xl hover:bg-gray-800">PLAY AGAIN</button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* TRAFFIC OPERATIONS PANEL */}
          <div className="flex flex-col gap-6">
            <Card className="rounded-none border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-cyan-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-xs uppercase tracking-widest">Vehicles cleared</p>
                    <h3 className="font-black text-4xl leading-none mt-2">{score}</h3>
                  </div>
                  <Activity className="w-10 h-10 text-black" />
                </div>
                <p className="font-bold text-xs mt-3 bg-white border-2 border-black p-2 inline-block">IN NETWORK: {cars.length}</p>
              </CardContent>
            </Card>

            <Card className="rounded-none border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-white flex-1">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="bg-black text-white p-3 border-b-4 border-black flex justify-between">
                  <h3 className="font-black uppercase flex items-center gap-2"><BarChart2 className="w-5 h-5" /> LIVE TRAFFIC</h3>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
                    <span className="font-bold text-gray-500">🚙 Queue (N-S)</span>
                    <span className="font-black text-xl">{nsQueue}</span>
                  </div>
                  <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
                    <span className="font-bold text-gray-500">🚙 Queue (E-W)</span>
                    <span className="font-black text-xl">{ewQueue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-cyan-200 hover:-translate-y-1 transition-transform">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-6 h-6 animate-pulse text-black" />
                  <h3 className="font-black uppercase text-lg text-black">QUEUE-BASED PLAN</h3>
                </div>
                
                <div className="bg-white border-2 border-black p-3 mb-4 grid grid-cols-2 gap-2 text-xs font-bold">
                  {([
                    ['N-S STRAIGHT', movementQueues.nsStraight, recommended.nsStraight],
                    ['N-S LEFT', movementQueues.nsLeft, recommended.nsLeft],
                    ['N-S RIGHT', movementQueues.nsRight, recommended.nsRight],
                    ['E-W STRAIGHT', movementQueues.ewStraight, recommended.ewStraight],
                    ['E-W LEFT', movementQueues.ewLeft, recommended.ewLeft],
                    ['E-W RIGHT', movementQueues.ewRight, recommended.ewRight],
                  ] as const).map(([label, count, seconds]) => (
                    <div key={label} className="border-b border-dashed border-gray-300 pb-1">
                      <p className="text-gray-600">{label}</p>
                      <p className="text-black">QUEUE {junctionType === '3-WAY' && label === 'E-W STRAIGHT' ? '—' : count} · <span className="text-green-700">{junctionType === '3-WAY' && label === 'E-W STRAIGHT' ? 'N/A' : `${seconds}s`}</span></p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => { 
                    setPhaseTimes(prev => ({
                      ...prev,
                      nsStraight: recommended.nsStraight,
                      nsLeft: recommended.nsLeft,
                      nsRight: recommended.nsRight,
                      ewStraight: junctionType === '3-WAY' ? prev.ewStraight : recommended.ewStraight,
                      ewLeft: recommended.ewLeft,
                      ewRight: recommended.ewRight,
                    }));
                    if (currentPhase === 'NS_STRAIGHT') setTimeLeft(recommended.nsStraight);
                    if (currentPhase === 'N_LEFT' || currentPhase === 'S_LEFT') setTimeLeft(recommended.nsLeft);
                    if (currentPhase === 'NS_RIGHT') setTimeLeft(recommended.nsRight);
                    if (currentPhase === 'EW_STRAIGHT') setTimeLeft(recommended.ewStraight);
                    if (currentPhase === 'W_LEFT' || currentPhase === 'E_LEFT') setTimeLeft(recommended.ewLeft);
                    if (currentPhase === 'EW_RIGHT') setTimeLeft(recommended.ewRight);
                  }}
                  disabled={isPlaying}
                  className="w-full bg-black text-cyan-400 p-3 border-4 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase shadow-[4px_4px_0_0_#fff] active:translate-y-1 active:shadow-none"
                >
                  APPLY ALL GREEN TIMES
                </button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}

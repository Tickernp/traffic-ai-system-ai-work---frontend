"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart2, Gamepad2, Home, Settings, Video } from "lucide-react"

const items = [
  { href: "/dashboard", label: "Dashboard", short: "Dash", icon: Home },
  { href: "/live", label: "Live CCTV", short: "Live", icon: Video },
  { href: "/reports", label: "Reports", short: "Reports", icon: BarChart2 },
  { href: "/game", label: "Game", short: "Game", icon: Gamepad2 },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-4 grid grid-cols-5 border-4 border-black bg-gray-900 p-1.5 text-white shadow-[3px_3px_0_#000] sm:p-2 lg:hidden" aria-label="Main menu">
      {items.map(({ href, label, short, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 border-2 px-0.5 py-1 text-[9px] font-black uppercase leading-none transition-colors sm:flex-row sm:gap-1.5 sm:text-[10px] ${active ? "border-black bg-white text-black shadow-[2px_2px_0_#fff]" : "border-transparent text-gray-300 hover:border-white hover:bg-gray-800"}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{short}</span>
          </Link>
        )
      })}
    </nav>
  )
}

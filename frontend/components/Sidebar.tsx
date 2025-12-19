'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Calculator,
  FileText,
  Settings,
  Building2,
  HelpCircle,
  RefreshCw
} from 'lucide-react'

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Calculadoras', href: '/calculator', icon: Calculator },
  { name: 'Documentos', href: '/documents', icon: FileText },
  { name: 'Admin RAG', href: '/admin', icon: RefreshCw },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-santander-red rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-santander-red">BRIS</h1>
            <p className="text-xs text-gray-500">Banking Regulation IS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-santander-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Global Asset Desk</span>
          <Link href="/help" className="hover:text-santander-red">
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-400">v1.0.0</p>
      </div>
    </div>
  )
}

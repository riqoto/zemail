'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, Users, FileText, Send, BarChart3, X, ScrollText } from 'lucide-react'

export type View = 'events' | 'attendees' | 'email-builder' | 'email-sender' | 'stats' | 'logs'

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  open: boolean
  onClose: () => void
}

const navItems: { view: View; label: string; icon: React.ElementType }[] = [
  { view: 'events', label: 'Events', icon: Calendar },
  { view: 'attendees', label: 'Attendees', icon: Users },
  { view: 'email-builder', label: 'Email Builder', icon: FileText },
  { view: 'email-sender', label: 'Email Sender', icon: Send },
  { view: 'stats', label: 'Stats', icon: BarChart3 },
  { view: 'logs', label: 'Logs', icon: ScrollText },
]

export function Sidebar({ currentView, onViewChange, open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-semibold text-sidebar-foreground">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ view, label, icon: Icon }) => (
            <Button
              key={view}
              variant={currentView === view ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                currentView === view && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
              onClick={() => {
                onViewChange(view)
                onClose()
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>
      </aside>
    </>
  )
}

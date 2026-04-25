'use client'

import * as React from 'react'
import { Header } from '@/components/dashboard/header'
import { Sidebar, type View } from '@/components/dashboard/sidebar'
import { EventsView } from '@/components/dashboard/events-view'
import { AttendeesView } from '@/components/dashboard/attendees-view'
import { EmailBuilderView } from '@/components/dashboard/email-builder-view'
import { EmailSenderView } from '@/components/dashboard/email-sender-view'
import { StatsView } from '@/components/dashboard/stats-view'
import { LogsView } from '@/components/dashboard/logs-view'

export default function DashboardPage() {
  const [currentView, setCurrentView] = React.useState<View>('events')
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const renderView = () => {
    switch (currentView) {
      case 'events':
        return <EventsView />
      case 'attendees':
        return <AttendeesView />
      case 'email-builder':
        return <EmailBuilderView />
      case 'email-sender':
        return <EmailSenderView />
      case 'stats':
        return <StatsView />
      case 'logs':
        return <LogsView />
      default:
        return <EventsView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-auto md:ml-0">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

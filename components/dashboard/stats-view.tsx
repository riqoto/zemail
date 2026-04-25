'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, Users, Mail, TrendingUp, Send, MousePointer, Eye } from 'lucide-react'
import { mockEvents, mockAttendees, mockCampaigns } from '@/lib/mock-data'

export function StatsView() {
  const [isLoading, setIsLoading] = React.useState(false) // placeholder for useSWR
  const totalEvents = mockEvents.length
  const activeEvents = mockEvents.filter(e => e.status === 'active').length
  const totalAttendees = mockAttendees.length
  const totalEmailsSent = mockCampaigns.reduce((sum, c) => sum + c.recipientCount, 0)
  const avgOpenRate = Math.round(
    mockCampaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.openRate, 0) /
      mockCampaigns.filter(c => c.status === 'sent').length
  )
  const avgClickRate = Math.round(
    mockCampaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.clickRate, 0) /
      mockCampaigns.filter(c => c.status === 'sent').length
  )

  const stats = [
    {
      title: 'Total Events',
      value: totalEvents,
      subtitle: `${activeEvents} active`,
      icon: Calendar,
      color: 'text-primary',
    },
    {
      title: 'Total Attendees',
      value: totalAttendees,
      subtitle: 'Across all events',
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Emails Sent',
      value: totalEmailsSent,
      subtitle: 'This month',
      icon: Mail,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Avg. Open Rate',
      value: `${avgOpenRate}%`,
      subtitle: '+5% from last month',
      icon: TrendingUp,
      color: 'text-sky-600 dark:text-sky-400',
    },
  ]

  const performanceMetrics = [
    { label: 'Open Rate', value: avgOpenRate, icon: Eye },
    { label: 'Click Rate', value: avgClickRate, icon: MousePointer },
    { label: 'Delivery Rate', value: 98, icon: Send },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Stats Overview</h1>
        <p className="text-muted-foreground">Monitor your email marketing performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Performance</CardTitle>
            <CardDescription>Key metrics for your email campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Summary of key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-muted rounded-lg text-center flex flex-col items-center justify-center space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">{mockCampaigns.length}</div>
                    <div className="text-sm text-muted-foreground">Total Campaigns</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {mockCampaigns.filter(c => c.status === 'sent').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Sent Campaigns</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {mockCampaigns.filter(c => c.status === 'scheduled').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {mockCampaigns.filter(c => c.status === 'draft').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Drafts</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <CardDescription>Overview of your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="hidden sm:table-cell">Recipients</TableHead>
                  <TableHead className="hidden md:table-cell">Open Rate</TableHead>
                  <TableHead className="hidden lg:table-cell">Click Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  mockCampaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div>{campaign.name}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {campaign.recipientCount} recipients
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{campaign.recipientCount}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {campaign.status === 'sent' ? `${campaign.openRate}%` : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {campaign.status === 'sent' ? `${campaign.clickRate}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            campaign.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : campaign.status === 'scheduled'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : ''
                          }
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

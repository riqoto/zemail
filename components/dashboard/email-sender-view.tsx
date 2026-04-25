'use client'
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Send, FileText, Loader2, Search, X } from 'lucide-react'
import useSWR from 'swr'
import type { Event, Attendee, EmailTemplate } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'An error occurred while fetching the data.')
  return json
}

export function EmailSenderView() {
  const [selectedEventId, setSelectedEventId] = React.useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>('')
  const [selectedAttendees, setSelectedAttendees] = React.useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)

  const { data: events } = useSWR<Event[]>('/api/events', fetcher)
  const { data: templates } = useSWR<EmailTemplate[]>('/api/templates', fetcher)
  const { data: attendees, isLoading: isAttendeesLoading } = useSWR<Attendee[]>(selectedEventId ? `/api/attendees?eventId=${selectedEventId}` : null, fetcher)

  const groupedTemplates = React.useMemo(() => {
    if (!templates) return []
    const latestByName = new Map<string, EmailTemplate>()
    templates.forEach(t => {
      if (!latestByName.has(t.name)) {
        latestByName.set(t.name, t)
      } else {
        const existing = latestByName.get(t.name)!
        // @ts-ignore
        const currentDT = new Date(t.createdAt || t.created_at || 0)
        // @ts-ignore
        const existingDT = new Date(existing.createdAt || existing.created_at || 0)
        if (currentDT > existingDT) {
          latestByName.set(t.name, t)
        }
      }
    })
    return Array.from(latestByName.values())
  }, [templates])

  React.useEffect(() => {
    setSelectedAttendees(new Set())
    setSearchQuery('')
  }, [selectedEventId])

  const filteredAttendees = React.useMemo(() => {
    if (!attendees) return []
    if (!searchQuery.trim()) return attendees
    const q = searchQuery.toLowerCase()
    return attendees.filter(a =>
      a.first_name?.toLowerCase().includes(q) ||
      a.last_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.title?.toLowerCase().includes(q)
    )
  }, [attendees, searchQuery])

  const handleSelectAll = (checked: boolean | string) => {
    const newSelected = new Set(selectedAttendees)
    if (checked === true) {
      filteredAttendees.forEach(a => newSelected.add(a.id))
    } else {
      filteredAttendees.forEach(a => newSelected.delete(a.id))
    }
    setSelectedAttendees(newSelected)
  }

  const handleSelectAttendee = (id: string, checked: boolean | string) => {
    const newSelected = new Set(selectedAttendees)
    if (checked === true) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedAttendees(newSelected)
  }

  const handleSendEmails = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select an email template')
      return
    }
    if (selectedAttendees.size === 0) {
      toast.error('Please select at least one attendee')
      return
    }

    setIsSending(true)

    try {
      const res = await fetch('/api/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          templateId: selectedTemplateId,
          attendeeIds: Array.from(selectedAttendees),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      toast.success(`Emails sent to ${data.summary?.sent || selectedAttendees.size} recipients`)

      if (data.summary?.failed > 0) {
        toast.error(`Failed to send ${data.summary.failed} emails`)
      }

      setSelectedAttendees(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSending(false)
    }
  }

  const selectedFilteredCount = filteredAttendees.filter(a => selectedAttendees.has(a.id)).length
  const allSelected = filteredAttendees.length > 0 && selectedFilteredCount === filteredAttendees.length
  const someSelected = selectedFilteredCount > 0 && selectedFilteredCount < filteredAttendees.length

  const selectAllState = allSelected ? true : someSelected ? 'indeterminate' : false

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Email Sender</h1>
        <p className="text-muted-foreground">Send bulk emails to event attendees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Event</CardTitle>
            <CardDescription>Choose an event to see its attendees</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {events?.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Template</CardTitle>
            <CardDescription>Choose an email template to send</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {groupedTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Recipients</CardTitle>
                {selectedAttendees.size > 0 && (
                  <Badge variant="secondary" className="px-1.5 font-normal">
                    {selectedAttendees.size} selected
                  </Badge>
                )}
                {selectedAttendees.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAttendees(new Set())}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <CardDescription>
                {selectedAttendees.size > 0
                  ? 'Ready to send emails to selected attendees'
                  : 'Select attendees to send emails'}
              </CardDescription>
            </div>
            <Button
              onClick={handleSendEmails}
              disabled={isSending || selectedAttendees.size === 0 || !selectedTemplateId}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Emails
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedEventId && (
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attendees by name, email, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!selectedEventId ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select an event to view attendees
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendees found for this event
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAllState}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Title</TableHead>
                      <TableHead>Attachment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAttendeesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      filteredAttendees.map(attendee => (
                        <TableRow
                          key={attendee.id}
                          className="cursor-pointer"
                          onClick={() => {
                            handleSelectAttendee(attendee.id, !selectedAttendees.has(attendee.id))
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedAttendees.has(attendee.id)}
                              onCheckedChange={(checked) =>
                                handleSelectAttendee(attendee.id, checked)
                              }
                              aria-label={`Select ${attendee.first_name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              {attendee.first_name} {attendee.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground sm:hidden">
                              {attendee.email}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{attendee.email}</TableCell>
                          <TableCell className="hidden md:table-cell">{attendee.title}</TableCell>
                          <TableCell>
                            {attendee.attachment_url ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="gap-1 cursor-help">
                                    <FileText className="h-3 w-3" />
                                    <span className="hidden sm:inline">Has file</span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{attendee.attachment_name || 'Attachment'}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

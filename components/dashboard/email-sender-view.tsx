'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { Send, FileText, Loader2 } from 'lucide-react'
import { mockAttendees, mockEvents, mockTemplates, type Attendee } from '@/lib/mock-data'

export function EmailSenderView() {
  const [selectedEventId, setSelectedEventId] = React.useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>('')
  const [selectedAttendees, setSelectedAttendees] = React.useState<Set<string>>(new Set())
  const [isSending, setIsSending] = React.useState(false)

  const filteredAttendees = selectedEventId
    ? mockAttendees.filter(a => a.eventId === selectedEventId)
    : []

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(new Set(filteredAttendees.map(a => a.id)))
    } else {
      setSelectedAttendees(new Set())
    }
  }

  const handleSelectAttendee = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedAttendees)
    if (checked) {
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
    
    // Simulate API call to Resend
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const template = mockTemplates.find(t => t.id === selectedTemplateId)
    toast.success(`Emails sent to ${selectedAttendees.size} recipients using "${template?.name}" template`)
    
    setSelectedAttendees(new Set())
    setIsSending(false)
  }

  const allSelected = filteredAttendees.length > 0 && selectedAttendees.size === filteredAttendees.length
  const someSelected = selectedAttendees.size > 0 && selectedAttendees.size < filteredAttendees.length

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
                {mockEvents.map(event => (
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
                {mockTemplates.map(template => (
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
            <div>
              <CardTitle className="text-lg">Recipients</CardTitle>
              <CardDescription>
                {selectedAttendees.size > 0
                  ? `${selectedAttendees.size} of ${filteredAttendees.length} selected`
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
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          {...(someSelected ? { "data-state": "indeterminate" } : {})}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Title</TableHead>
                      <TableHead>Attachment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.map(attendee => (
                      <TableRow key={attendee.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAttendees.has(attendee.id)}
                            onCheckedChange={(checked) =>
                              handleSelectAttendee(attendee.id, checked as boolean)
                            }
                            aria-label={`Select ${attendee.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            {attendee.name} {attendee.surname}
                          </div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {attendee.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{attendee.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{attendee.title}</TableCell>
                        <TableCell>
                          {attendee.attachment ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="gap-1 cursor-help">
                                  <FileText className="h-3 w-3" />
                                  <span className="hidden sm:inline">Has file</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{attendee.attachmentName}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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

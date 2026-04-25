'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
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
import { toast } from 'sonner'
import { FileText, Eye, X } from 'lucide-react'
import { mockAttendees, mockEvents, type Attendee } from '@/lib/mock-data'

export function AttendeesView() {
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all')
  const [attendees, setAttendees] = React.useState<Attendee[]>(mockAttendees)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [pdfModalOpen, setPdfModalOpen] = React.useState(false)
  const [editingAttendee, setEditingAttendee] = React.useState<Attendee | null>(null)
  const [viewingPdf, setViewingPdf] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    surname: '',
    phone: '',
    title: '',
    email: '',
  })

  const filteredAttendees =
    selectedEventId === 'all'
      ? attendees
      : attendees.filter(a => a.eventId === selectedEventId)

  const getEventName = (eventId: string) => {
    return mockEvents.find(e => e.id === eventId)?.name || 'Unknown Event'
  }

  const openEditModal = (attendee: Attendee) => {
    setEditingAttendee(attendee)
    setFormData({
      name: attendee.name,
      surname: attendee.surname,
      phone: attendee.phone,
      title: attendee.title,
      email: attendee.email,
    })
    setEditModalOpen(true)
  }

  const openPdfViewer = (attachmentName: string) => {
    setViewingPdf(attachmentName)
    setPdfModalOpen(true)
  }

  const handleSave = () => {
    if (!editingAttendee) return
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }
    setAttendees(prev =>
      prev.map(a =>
        a.id === editingAttendee.id ? { ...a, ...formData } : a
      )
    )
    toast.success('Attendee updated successfully')
    setEditModalOpen(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendees</h1>
          <p className="text-muted-foreground">View and manage event attendees</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {mockEvents.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedEventId === 'all' ? 'All Attendees' : getEventName(selectedEventId)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Title</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attendees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map(attendee => (
                    <TableRow
                      key={attendee.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEditModal(attendee)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          {attendee.name} {attendee.surname}
                        </div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {attendee.phone}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{attendee.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{attendee.title}</TableCell>
                      <TableCell className="hidden lg:table-cell">{attendee.email}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {attendee.attachment ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="h-3 w-3" />
                              <span className="hidden sm:inline">{attendee.attachmentName}</span>
                              <span className="sm:hidden">File</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openPdfViewer(attendee.attachmentName || '')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ResponsiveModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Attendee"
        description="Update attendee information"
        footer={<Button onClick={handleSave}>Save Changes</Button>}
      >
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Last Name</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={e => setFormData(prev => ({ ...prev, surname: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        title="Document Viewer"
        description={viewingPdf || 'Viewing attachment'}
      >
        <div className="py-4">
          <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              PDF viewer simulation for: <strong>{viewingPdf}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              In production, this would fetch from Supabase Storage
            </p>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}

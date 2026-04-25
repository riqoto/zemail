'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
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
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Eye, Upload, Search, Plus, Loader2, ExternalLink } from 'lucide-react'
import useSWR from 'swr'
import type { Attendee, Event } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'An error occurred while fetching the data.')
  return json
}

export function AttendeesView() {
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: attendeesData, isLoading: isAttendeesLoading, mutate: mutateAttendees } = useSWR<Attendee[]>('/api/attendees', fetcher)
  const { data: eventsData } = useSWR<Event[]>('/api/events', fetcher)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const modalFileInputRef = React.useRef<HTMLInputElement>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [editingAttendee, setEditingAttendee] = React.useState<Attendee | null>(null)
  const [viewingPdf, setViewingPdf] = React.useState<{ url: string; name: string } | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    first_name: '',
    last_name: '',
    phone: '',
    title: '',
    email: '',
    event_id: '',
    attachment_url: '',
    attachment_name: ''
  })

  const filteredAttendees = (attendeesData || []).filter(a => {
    const matchesEvent = selectedEventId === 'all' || a.event_id === selectedEventId
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query || 
      (a.first_name || '').toLowerCase().includes(query) || 
      (a.last_name || '').toLowerCase().includes(query) || 
      (a.email || '').toLowerCase().includes(query)
    
    return matchesEvent && matchesSearch
  })

  const getEventName = (eventId: string) => {
    return eventsData?.find(e => e.id === eventId)?.name || 'Unknown Event'
  }

  const openEditModal = (attendee: Attendee) => {
    setEditingAttendee(attendee)
    setFormData({
      first_name: attendee.first_name || '',
      last_name: attendee.last_name || '',
      phone: attendee.phone || '',
      title: attendee.title || '',
      email: attendee.email || '',
      event_id: attendee.event_id || '',
      attachment_url: attendee.attachment_url || '',
      attachment_name: attendee.attachment_name || ''
    })
    setEditModalOpen(true)
  }

  const openPdfViewer = (url: string, name: string) => {
    setViewingPdf({ url, name })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size exceeds the 50MB limit')
      return
    }

    const type = file.type
    if (type !== 'text/csv' && !type.includes('spreadsheetml') && !type.includes('excel')) {
      toast.error('Only CSV or Excel (XLSX) files are allowed for import')
      return
    }

    toast.success(`${file.name} imported successfully (mock)`)
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
       const form = new FormData()
       form.append('file', file)
       const res = await fetch('/api/upload', {
         method: 'POST',
         body: form
       })
       if (!res.ok) throw new Error('Upload failed')
       const data = await res.json()
       setFormData(prev => ({ ...prev, attachment_url: data.url, attachment_name: data.name }))
       toast.success('File uploaded successfully')
    } catch (err) {
       toast.error('Failed to upload file')
    } finally {
       setIsUploading(false)
       if (modalFileInputRef.current) modalFileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!formData.first_name || !formData.email || !formData.event_id) {
      toast.error('First name, email and event are required')
      return
    }
    
    setIsSaving(true)
    try {
      if (editingAttendee) {
        const res = await fetch(`/api/attendees/${editingAttendee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update attendee')
        toast.success('Attendee updated successfully')
      } else {
        const res = await fetch('/api/attendees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create attendee')
        toast.success('Attendee created successfully')
      }
      mutateAttendees()
      setEditModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingAttendee) return
    if (!confirm('Are you sure you want to delete this attendee?')) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/attendees/${editingAttendee.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete attendee')
      toast.success('Attendee deleted successfully')
      mutateAttendees()
      setEditModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendees</h1>
          <p className="text-muted-foreground">View and manage event attendees</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventsData?.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
          />
          <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button className="w-full sm:w-auto gap-2" onClick={() => {
            setEditingAttendee(null)
            setFormData({ first_name: '', last_name: '', phone: '', title: '', email: '', event_id: selectedEventId === 'all' ? '' : selectedEventId, attachment_url: '', attachment_name: '' })
            setEditModalOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            Add Attendee
          </Button>
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
                {isAttendeesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attendees found matching your criteria.
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
                          {attendee.first_name} {attendee.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {attendee.phone}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{attendee.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{attendee.title}</TableCell>
                      <TableCell className="hidden lg:table-cell">{attendee.email}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {attendee.attachment_url ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <FileText className="h-3 w-3" />
                              <span className="hidden sm:inline">{attendee.attachment_name || 'File'}</span>
                              <span className="sm:hidden">File</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openPdfViewer(attendee.attachment_url || '', attendee.attachment_name || '')}
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
        title={editingAttendee ? "Edit Attendee" : "Add Attendee"}
        description={editingAttendee ? "Update attendee information" : "Add a new attendee to your event"}
        footer={
          <div className="flex gap-2 w-full">
            {editingAttendee && (
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingAttendee ? 'Save Changes' : 'Create Attendee'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="event_id">Event *</Label>
            <Select value={formData.event_id} onValueChange={v => setFormData(p => ({ ...p, event_id: v }))}>
              <SelectTrigger id="event_id"><SelectValue placeholder="Select event..." /></SelectTrigger>
              <SelectContent>
                {eventsData?.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
            <Label htmlFor="title">Title / Role</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2 pt-2 border-t mt-4">
            <Label>Attendee Specific Attachment</Label>
            <div className="text-xs text-muted-foreground mb-2">Upload a specific file for this attendee (e.g. ticket PDF, itinerary)</div>
            
            <input 
              type="file" 
              ref={modalFileInputRef} 
              onChange={handleAttachmentUpload} 
              className="hidden" 
            />
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={(e) => { e.preventDefault(); modalFileInputRef.current?.click(); }}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
              {formData.attachment_name && (
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="secondary" className="max-w-[200px] truncate">
                    {formData.attachment_name}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, attachment_url: '', attachment_name: '' }))}>Remove</Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </ResponsiveModal>

      {/* PDF Viewer Drawer */}
      <Sheet open={!!viewingPdf} onOpenChange={(open) => !open && setViewingPdf(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl flex flex-col p-0 gap-0"
        >
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-sm leading-tight truncate">
                    {viewingPdf?.name || 'Document'}
                  </SheetTitle>
                  <SheetDescription className="text-xs mt-0.5">Attachment preview</SheetDescription>
                </div>
              </div>
              {viewingPdf?.url && (
                <a
                  href={viewingPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </a>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 p-4">
            {viewingPdf?.url ? (
              <iframe
                src={viewingPdf.url}
                className="w-full h-full rounded-lg border bg-white"
                title={viewingPdf?.name}
              />
            ) : (
              <div className="bg-muted h-full rounded-lg flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Document not available</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

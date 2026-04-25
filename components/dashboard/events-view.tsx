'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar, MapPin, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Event, EventStatus } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'An error occurred while fetching the data.')
  return json
}

const statusOrder: Record<EventStatus, number> = { active: 0, upcoming: 1, past: 2 }
const statusStyles: Record<EventStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  upcoming: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-400',
  past: 'bg-muted text-muted-foreground',
}

export function EventsView() {
  const { data: events, error, isLoading, mutate } = useSWR<Event[]>('/api/events', fetcher)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'upcoming' as EventStatus,
    description: '',
  })

  const sortedEvents = React.useMemo(() => {
    if (!Array.isArray(events)) return []
    return [...events].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }, [events])

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormData({ name: '', start_date: '', end_date: '', location: '', status: 'upcoming', description: '' })
    setModalOpen(true)
  }

  const openEditModal = (event: Event) => {
    if (event.status === 'past') {
      toast.info('Past events cannot be edited')
      return
    }
    setEditingEvent(event)
    setFormData({
      name: event.name,
      start_date: event.start_date.slice(0, 16), // local datetime string
      end_date: event.end_date.slice(0, 16),
      location: event.location,
      status: event.status,
      description: event.description || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      if (editingEvent) {
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to update event')
        toast.success('Event updated successfully')
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to create event')
        toast.success('Event created successfully')
      }
      mutate()
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingEvent) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event')
      toast.success('Event deleted successfully')
      mutate()
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  // Treat error as an empty state so the user can still add events
  const isEmptyOrError = error || sortedEvents.length === 0
  console.log(error)
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>
        <p className="text-muted-foreground">Manage your events and view attendee information</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : isEmptyOrError ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-lg bg-card/50">
          <div className="h-16 w-16 mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground mb-6">Get started by creating your very first event.</p>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors group"
            onClick={openCreateModal}
          >
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground group-hover:text-primary transition-colors">
              <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-medium">Add New Event</span>
            </CardContent>
          </Card>

          {sortedEvents.map(event => (
            <Card
              key={event.id}
              className={`cursor-pointer transition-all hover:shadow-md ${event.status === 'past' ? 'opacity-70' : ''}`}
              onClick={() => openEditModal(event)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                  <Badge variant="secondary" className={statusStyles[event.status] + "flex items-center"}>
                    {event.status == "active" ? <span className="relative flex h-1.5 w-1.5 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span> : null}
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResponsiveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        description={editingEvent ? 'Update the event details below' : 'Fill in the details for your new event'}
        footer={
          <div className="flex gap-2 w-full">
            {editingEvent && (
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter event name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date & Time *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date & Time *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: EventStatus) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}

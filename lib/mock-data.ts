export type EventStatus = 'active' | 'upcoming' | 'past'

export interface Event {
  id: string
  name: string
  date: string
  location: string
  status: EventStatus
  attendeeCount: number
  description: string
}

export interface Attendee {
  id: string
  eventId: string
  name: string
  surname: string
  phone: string
  title: string
  email: string
  attachment?: string
  attachmentName?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  blocks: EmailBlock[]
  createdAt: string
}

export interface EmailBlock {
  id: string
  type: 'header' | 'text' | 'button' | 'image' | 'footer'
  content: string
}

export interface Campaign {
  id: string
  name: string
  eventId: string
  templateId: string
  sentAt: string
  recipientCount: number
  openRate: number
  clickRate: number
  status: 'sent' | 'scheduled' | 'draft'
}

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Tech Conference 2026',
    date: '2026-05-15',
    location: 'San Francisco, CA',
    status: 'active',
    attendeeCount: 234,
    description: 'Annual technology conference featuring the latest innovations.'
  },
  {
    id: '2',
    name: 'Product Launch Summit',
    date: '2026-06-20',
    location: 'New York, NY',
    status: 'upcoming',
    attendeeCount: 156,
    description: 'Exclusive product launch event for industry leaders.'
  },
  {
    id: '3',
    name: 'Developer Workshop',
    date: '2026-04-10',
    location: 'Austin, TX',
    status: 'past',
    attendeeCount: 89,
    description: 'Hands-on workshop for developers.'
  },
  {
    id: '4',
    name: 'Marketing Masterclass',
    date: '2026-07-05',
    location: 'Chicago, IL',
    status: 'upcoming',
    attendeeCount: 120,
    description: 'Learn marketing strategies from industry experts.'
  },
  {
    id: '5',
    name: 'Startup Networking Night',
    date: '2026-03-22',
    location: 'Seattle, WA',
    status: 'past',
    attendeeCount: 67,
    description: 'Networking event for startup founders.'
  }
]

export const mockAttendees: Attendee[] = [
  { id: '1', eventId: '1', name: 'John', surname: 'Doe', phone: '+1 555-0101', title: 'CEO', email: 'john.doe@example.com', attachment: '/files/resume.pdf', attachmentName: 'resume.pdf' },
  { id: '2', eventId: '1', name: 'Jane', surname: 'Smith', phone: '+1 555-0102', title: 'CTO', email: 'jane.smith@example.com', attachment: '/files/portfolio.pdf', attachmentName: 'portfolio.pdf' },
  { id: '3', eventId: '1', name: 'Mike', surname: 'Johnson', phone: '+1 555-0103', title: 'Developer', email: 'mike.j@example.com' },
  { id: '4', eventId: '2', name: 'Sarah', surname: 'Williams', phone: '+1 555-0104', title: 'Marketing Director', email: 'sarah.w@example.com', attachment: '/files/presentation.pdf', attachmentName: 'presentation.pdf' },
  { id: '5', eventId: '2', name: 'David', surname: 'Brown', phone: '+1 555-0105', title: 'Product Manager', email: 'david.b@example.com' },
  { id: '6', eventId: '3', name: 'Emily', surname: 'Davis', phone: '+1 555-0106', title: 'Designer', email: 'emily.d@example.com', attachment: '/files/design-specs.pdf', attachmentName: 'design-specs.pdf' },
  { id: '7', eventId: '3', name: 'Chris', surname: 'Miller', phone: '+1 555-0107', title: 'Engineer', email: 'chris.m@example.com' },
  { id: '8', eventId: '4', name: 'Lisa', surname: 'Wilson', phone: '+1 555-0108', title: 'Sales Manager', email: 'lisa.w@example.com' },
  { id: '9', eventId: '5', name: 'Tom', surname: 'Anderson', phone: '+1 555-0109', title: 'Founder', email: 'tom.a@example.com', attachment: '/files/pitch-deck.pdf', attachmentName: 'pitch-deck.pdf' },
  { id: '10', eventId: '5', name: 'Amy', surname: 'Taylor', phone: '+1 555-0110', title: 'Investor', email: 'amy.t@example.com' },
]

export const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Event Reminder',
    subject: 'Don\'t forget: {{event_name}} is coming up!',
    blocks: [
      { id: '1', type: 'header', content: 'Event Reminder' },
      { id: '2', type: 'text', content: 'Hi {{name}}, we wanted to remind you about the upcoming event.' },
      { id: '3', type: 'button', content: 'View Event Details' },
      { id: '4', type: 'footer', content: 'Best regards, The EventMail Team' }
    ],
    createdAt: '2026-04-01'
  },
  {
    id: '2',
    name: 'Thank You',
    subject: 'Thank you for attending {{event_name}}!',
    blocks: [
      { id: '1', type: 'header', content: 'Thank You!' },
      { id: '2', type: 'text', content: 'We appreciate your participation in our event.' },
      { id: '3', type: 'footer', content: 'See you next time!' }
    ],
    createdAt: '2026-04-05'
  }
]

export const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Tech Conference Reminder', eventId: '1', templateId: '1', sentAt: '2026-04-20', recipientCount: 234, openRate: 68, clickRate: 24, status: 'sent' },
  { id: '2', name: 'Product Launch Invite', eventId: '2', templateId: '1', sentAt: '2026-04-22', recipientCount: 156, openRate: 72, clickRate: 31, status: 'sent' },
  { id: '3', name: 'Workshop Follow-up', eventId: '3', templateId: '2', sentAt: '2026-04-12', recipientCount: 89, openRate: 54, clickRate: 18, status: 'sent' },
  { id: '4', name: 'Marketing Masterclass Promo', eventId: '4', templateId: '1', sentAt: '', recipientCount: 120, openRate: 0, clickRate: 0, status: 'scheduled' },
]

export type EventStatus = "active" | "upcoming" | "past"

export interface Event {
  id: string
  name: string
  start_date: string
  end_date: string
  location: string
  status: EventStatus
  description: string | null
  created_at: string
  updated_at: string
}

export interface Attendee {
  id: string
  event_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  title: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  updated_at: string
  events?: { name: string }
}

export interface EmailBlock {
  id: string
  type: "header" | "text" | "button" | "image" | "footer"
  content: string
  styles?: {
    fontSize?: number
    textAlign?: "left" | "center" | "right" | "justify"
    color?: string
  }
  url?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  blocks: EmailBlock[]
  created_at: string
  updated_at: string
}

export interface ASTStyle {
  color?: string
  size?: number
  textAlign?: "left" | "center" | "right" | "justify"
}

export interface ASTBlock {
  id: string // format: block_type_[content_as_base64]
  style: ASTStyle
  url?: string
}

export interface EmailAST {
  id: string // format: event_id_templatename
  block: ASTBlock[]
}

export interface SentEmail {
  id: string
  event_id: string | null
  template_id: string | null
  attendee_id: string | null
  recipient_email: string
  subject: string
  status: "pending" | "sent" | "failed" | "delivered" | "bounced"
  resend_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface Stats {
  events: {
    total: number
    active: number
    upcoming: number
    past: number
  }
  attendees: {
    total: number
  }
  emails: {
    total: number
    sent: number
    failed: number
    deliveryRate: number
  }
  recentCampaigns: Array<{
    name: string
    sent: number
    failed: number
    total: number
    date: string
    status: string
  }>
}

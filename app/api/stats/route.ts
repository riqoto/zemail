import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Get events count by status
  const { data: events } = await supabase.from("events").select("id, status")
  const activeEvents = events?.filter((e) => e.status === "active").length || 0
  const upcomingEvents = events?.filter((e) => e.status === "upcoming").length || 0
  const pastEvents = events?.filter((e) => e.status === "past").length || 0
  const totalEvents = events?.length || 0

  // Get total attendees
  const { count: totalAttendees } = await supabase
    .from("attendees")
    .select("*", { count: "exact", head: true })

  // Get email stats
  const { data: emails } = await supabase.from("sent_emails").select("status")
  const totalEmails = emails?.length || 0
  const sentEmails = emails?.filter((e) => e.status === "sent" || e.status === "delivered").length || 0
  const failedEmails = emails?.filter((e) => e.status === "failed" || e.status === "bounced").length || 0
  const deliveryRate = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0

  // Get recent campaigns (emails grouped by template)
  const { data: recentEmails } = await supabase
    .from("sent_emails")
    .select("*, email_templates(name)")
    .order("created_at", { ascending: false })
    .limit(50)

  // Group by template to create "campaigns"
  const campaignMap = new Map<string, { 
    name: string
    sent: number
    failed: number
    date: string
  }>()

  recentEmails?.forEach((email) => {
    const templateName = (email.email_templates as { name: string } | null)?.name || "Unknown Template"
    const dateKey = new Date(email.created_at).toLocaleDateString()
    const key = `${email.template_id}-${dateKey}`
    
    const existing = campaignMap.get(key)
    if (existing) {
      if (email.status === "sent" || email.status === "delivered") {
        existing.sent++
      } else {
        existing.failed++
      }
    } else {
      campaignMap.set(key, {
        name: templateName,
        sent: email.status === "sent" || email.status === "delivered" ? 1 : 0,
        failed: email.status === "failed" || email.status === "bounced" ? 1 : 0,
        date: dateKey,
      })
    }
  })

  const recentCampaigns = Array.from(campaignMap.values())
    .slice(0, 5)
    .map((c) => ({
      ...c,
      total: c.sent + c.failed,
      status: c.failed === 0 ? "completed" : c.sent === 0 ? "failed" : "partial",
    }))

  return NextResponse.json({
    events: {
      total: totalEvents,
      active: activeEvents,
      upcoming: upcomingEvents,
      past: pastEvents,
    },
    attendees: {
      total: totalAttendees || 0,
    },
    emails: {
      total: totalEmails,
      sent: sentEmails,
      failed: failedEmails,
      deliveryRate,
    },
    recentCampaigns,
  })
}

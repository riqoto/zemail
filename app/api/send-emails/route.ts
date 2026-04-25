import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailBlock {
  id: string
  type: "header" | "text" | "button" | "image" | "footer"
  content: string
}

function renderEmailHtml(blocks: EmailBlock[], attendeeName: string): string {
  const renderedBlocks = blocks.map((block) => {
    const content = block.content.replace("{{name}}", attendeeName)
    
    switch (block.type) {
      case "header":
        return `<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1a1a2e;">${content}</h1>`
      case "text":
        return `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #333;">${content}</p>`
      case "button":
        return `<a href="#" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0;">${content}</a>`
      case "image":
        return `<img src="${content}" alt="Email image" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px;" />`
      case "footer":
        return `<footer style="font-size: 12px; color: #666; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">${content}</footer>`
      default:
        return `<p>${content}</p>`
    }
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${renderedBlocks.join("\n")}
        </div>
      </body>
    </html>
  `
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { eventId, templateId, attendeeIds } = await request.json()

  if (!eventId || !templateId || !attendeeIds?.length) {
    return NextResponse.json(
      { error: "Missing required fields: eventId, templateId, attendeeIds" },
      { status: 400 }
    )
  }

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", templateId)
    .single()

  if (templateError || !template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    )
  }

  // Fetch attendees
  const { data: attendees, error: attendeesError } = await supabase
    .from("attendees")
    .select("*")
    .in("id", attendeeIds)

  if (attendeesError || !attendees?.length) {
    return NextResponse.json(
      { error: "Attendees not found" },
      { status: 404 }
    )
  }

  const results: Array<{ email: string; success: boolean; error?: string; resendId?: string }> = []

  for (const attendee of attendees) {
    const attendeeName = `${attendee.first_name} ${attendee.last_name}`
    const subject = template.subject.replace("{{name}}", attendeeName)
    const html = renderEmailHtml(template.blocks as EmailBlock[], attendeeName)

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "EventMail Pro <onboarding@resend.dev>",
        to: attendee.email,
        subject,
        html,
        attachments: attendee.attachment_url
          ? [{ path: attendee.attachment_url, filename: attendee.attachment_name || "attachment" }]
          : undefined,
      })

      // Log to database
      await supabase.from("sent_emails").insert({
        event_id: eventId,
        template_id: templateId,
        attendee_id: attendee.id,
        recipient_email: attendee.email,
        subject,
        status: emailError ? "failed" : "sent",
        resend_id: emailData?.id || null,
        error_message: emailError?.message || null,
        sent_at: emailError ? null : new Date().toISOString(),
      })

      results.push({
        email: attendee.email,
        success: !emailError,
        error: emailError?.message,
        resendId: emailData?.id,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      
      await supabase.from("sent_emails").insert({
        event_id: eventId,
        template_id: templateId,
        attendee_id: attendee.id,
        recipient_email: attendee.email,
        subject,
        status: "failed",
        error_message: errorMessage,
      })

      results.push({
        email: attendee.email,
        success: false,
        error: errorMessage,
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return NextResponse.json({
    success: true,
    summary: {
      total: results.length,
      sent: successCount,
      failed: failCount,
    },
    results,
  })
}

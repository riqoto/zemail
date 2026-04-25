import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { decodeFromAST, renderEmailHtml } from "@/lib/ast"
import type { EmailBlock } from "@/lib/types"

const resend = new Resend(process.env.RESEND_API_KEY)



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

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Event not found" },
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
    const vars = {
      name: attendee.first_name || '',
      surname: attendee.last_name || '',
      event_name: event.name || '',
      ticket_link: `https://zemail.io/t/${attendee.id.slice(0, 8)}`
    }

    const subject = template.subject
      .replace(/{{name}}/g, vars.name)
      .replace(/{{surname}}/g, vars.surname)
      .replace(/{{event_name}}/g, vars.event_name)
      .replace(/{{ticket_link}}/g, vars.ticket_link);

    const blocksArray = Array.isArray(template.blocks) 
      ? template.blocks as EmailBlock[] 
      : typeof template.blocks === 'object' && template.blocks.block 
        ? decodeFromAST(template.blocks as any)
        : [];
        
    if (blocksArray.length === 0) {
      return NextResponse.json(
        { error: "Template has no content" },
        { status: 422 }
      )
    }

    const html = renderEmailHtml(blocksArray, vars)

    let attachmentContent;
    if (attendee.attachment_url?.startsWith("/uploads/")) {
      try {
        const fs = require('fs/promises');
        const path = require('path');
        const buf = await fs.readFile(path.join(process.cwd(), 'public', attendee.attachment_url));
        attachmentContent = buf.toString('base64');
      } catch (e) {
        console.error("Failed to read attachment", e);
      }
    }

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Movood <info@movood.com>",
        to: attendee.email,
        subject,
        html,
        attachments: attendee.attachment_url
          ? [{ 
              content: attachmentContent, 
              path: attachmentContent ? undefined : attendee.attachment_url,
              filename: attendee.attachment_name || "attachment" 
            }]
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

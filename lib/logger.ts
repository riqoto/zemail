/**
 * App-wide logger utility.
 * Writes a log entry to /api/logs (which persists to Supabase).
 * Fire-and-forget: errors are swallowed so logging never breaks app flow.
 */

export type LogType = 'email' | 'template' | 'attendee' | 'event' | 'upload' | 'system'
export type LogEvent =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'sent'
  | 'failed'
  | 'uploaded'
  | 'fetched'
  | 'saved'
  | 'loaded'
  | 'error'
export type LogStatus = 'success' | 'error' | 'warning' | 'info'

export interface LogPayload {
  log_type: LogType
  event_type: LogEvent
  status: LogStatus
  message?: string
  metadata?: Record<string, unknown>
}

export async function writeLog(payload: LogPayload): Promise<void> {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // intentionally silent — logging must not break the app
  }
}

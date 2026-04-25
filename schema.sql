-- schema.sql
-- Run this in your Supabase SQL Editor

-- 1. Create Events Table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT CHECK (status IN ('active', 'upcoming', 'past')) DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Attendees Table
CREATE TABLE public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Email Templates Table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Sent Emails Logs
CREATE TABLE public.sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES public.attendees(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'bounced')) DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
-- Modify these policies if you want to implement proper authentication
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (if you have no auth)
-- WARNING: This allows anyone to read/write. If you add Auth, you MUST rewrite these policies.
CREATE POLICY "Public Access Events" ON public.events FOR ALL USING (true);
CREATE POLICY "Public Access Attendees" ON public.attendees FOR ALL USING (true);
CREATE POLICY "Public Access Email Templates" ON public.email_templates FOR ALL USING (true);
CREATE POLICY "Public Access Sent Emails" ON public.sent_emails FOR ALL USING (true);

-- Create a storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- Create storage bucket policies (Warning: Public access)
CREATE POLICY "Public Download Attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Public Upload Attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Public Update Attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'attachments');
CREATE POLICY "Public Delete Attachments" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');

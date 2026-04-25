import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    
    // Safe filename handling
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
    const baseName = file.name.substring(0, file.name.length - ext.length)
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-]/g, '-')
    const filename = `${cleanBaseName}-${uniqueSuffix}${ext}`

    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from("attachments")
      .upload(filename, buffer, {
        contentType: file.type || "application/octet-stream",
      })

    if (error) {
      console.error("Supabase Storage error:", error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from("attachments")
      .getPublicUrl(filename)

    return NextResponse.json({ 
      url: publicUrl,
      name: file.name
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

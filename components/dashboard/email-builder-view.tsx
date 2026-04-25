'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, AlignLeft, AlignCenter, AlignRight, AlignJustify, GripVertical, Trash2, Plus, Heading, Type, Square, Image as ImageIcon, ChevronDown, ChevronUp, Upload, Link } from 'lucide-react'
import { type EmailBlock, type EmailTemplate, mockTemplates, mockEvents, mockAttendees } from '@/lib/mock-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { encodeToAST, decodeFromAST } from '@/lib/ast'
import { writeLog } from '@/lib/logger'
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'An error occurred while fetching the data.')
  return json
}

const blockTypes = [
  { type: 'header' as const, label: 'Header', icon: Heading },
  { type: 'text' as const, label: 'Text', icon: Type },
  { type: 'button' as const, label: 'Button', icon: Square },
  { type: 'image' as const, label: 'Image', icon: ImageIcon },
  { type: 'footer' as const, label: 'Footer', icon: AlignLeft },
]

export function EmailBuilderView() {
  const { data: dbTemplates, mutate: mutateTemplates } = useSWR<EmailTemplate[]>('/api/templates', fetcher)
  
  const templates = React.useMemo(() => {
    const list = dbTemplates || []
    const latestByName = new Map<string, EmailTemplate>()
    list.forEach(t => {
      if (!latestByName.has(t.name)) {
        latestByName.set(t.name, t)
      } else {
        const existing = latestByName.get(t.name)!
        // @ts-ignore
        const currentDT = new Date(t.createdAt || t.created_at || 0)
        // @ts-ignore
        const existingDT = new Date(existing.createdAt || existing.created_at || 0)
        if (currentDT > existingDT) {
          latestByName.set(t.name, t)
        }
      }
    })
    return Array.from(latestByName.values())
  }, [dbTemplates])

  const [currentTemplate, setCurrentTemplate] = React.useState<EmailTemplate | null>(null)
  const [subject, setSubject] = React.useState('')
  const [blocks, setBlocks] = React.useState<EmailBlock[]>([])
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [templateName, setTemplateName] = React.useState('')
  const [selectedEventId, setSelectedEventId] = React.useState<string>(mockEvents[0]?.id || '')
  const [isSaving, setIsSaving] = React.useState(false)
  const [expandedBlockId, setExpandedBlockId] = React.useState<string | null>(null)
  const [uploadingBlockId, setUploadingBlockId] = React.useState<string | null>(null)
  // Track whether each image block is in 'url' or 'upload' tab mode
  const [imageInputMode, setImageInputMode] = React.useState<Record<string, 'url' | 'upload'>>({})

  const loadTemplate = (templateId: string) => {
    if (templateId === 'new') {
      startNewTemplate()
      return
    }
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setCurrentTemplate(template)
      setSubject(template.subject)
      setTemplateName(template.name)
      setExpandedBlockId(null)
      setImageInputMode({})
      // blocks is stored as an AST object from the API; decode it back to EmailBlock[]
      try {
        const raw = template.blocks as any
        if (Array.isArray(raw)) {
          setBlocks([...raw])
        } else if (raw && raw.block) {
          setBlocks(decodeFromAST(raw))
        } else {
          setBlocks([])
        }
      } catch (e) {
        console.error('Failed to decode template blocks:', e)
        setBlocks([])
      }
    }
  }

  const addBlock = (type: EmailBlock['type']) => {
    const id = String(Date.now())
    const newBlock: EmailBlock = {
      id,
      type,
      content: type === 'header' ? 'New Header' : type === 'button' ? 'Click Here' : type === 'image' ? '' : 'New content...',
      styles: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'left'
      }
    }
    setBlocks(prev => [...prev, newBlock])
    setExpandedBlockId(id)
  }

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)))
  }

  const updateBlockStyle = (id: string, styleKey: 'fontSize' | 'color' | 'textAlign', value: string | number) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, styles: { ...b.styles, [styleKey]: value } } : b)))
  }

  const updateBlockUrl = (id: string, url: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, url } : b)))
  }

  const handleImageUpload = async (blockId: string, file: File) => {
    if (!file) return
    setUploadingBlockId(blockId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      updateBlockUrl(blockId, json.url)
      toast.success('Image uploaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setUploadingBlockId(null)
    }
  }

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (expandedBlockId === id) setExpandedBlockId(null)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return
    const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const handleSaveTemplate = async () => {
    if (!templateName || !selectedEventId) {
      toast.error('Please enter a template name and select an event')
      return
    }

    setIsSaving(true)
    try {
      const astPayload = encodeToAST(selectedEventId, templateName, blocks)

      const isExisting = currentTemplate?.id && !['1', '2'].includes(currentTemplate.id)
      const res = await fetch('/api/templates', {
        method: isExisting ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isExisting ? { id: currentTemplate.id } : {}),
          name: templateName,
          subject,
          blocks: astPayload
        })
      })

      if (!res.ok) {
        throw new Error('Failed to save to database')
      }

      const savedData = await res.json()

      toast.success('Template saved successfully')
      setSaveOpen(false)

      void writeLog({
        log_type: 'template',
        event_type: isExisting ? 'updated' : 'created',
        status: 'success',
        message: `Template "${templateName}" ${isExisting ? 'updated' : 'created'} successfully`,
        metadata: { templateId: savedData.id, templateName, subject, blockCount: blocks.length },
      })

      mutateTemplates()
      setCurrentTemplate(savedData)
    } catch (err) {
      toast.error('Could not save template. Check terminal/Network.')
      void writeLog({
        log_type: 'template',
        event_type: 'failed',
        status: 'error',
        message: `Failed to save template "${templateName}"`,
        metadata: { templateName, subject },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const startNewTemplate = () => {
    setCurrentTemplate(null)
    setSubject('')
    setBlocks([])
    setTemplateName('')
    setExpandedBlockId(null)
  }

  const copyVar = (v: string) => {
    navigator.clipboard.writeText(v)
    toast.success(`Copied ${v} to clipboard`)
  }

  const parseContent = (text: string) => {
    if (!text) return ''
    const eventAttendees = mockAttendees.filter(a => a.eventId === selectedEventId)
    const user = eventAttendees.length > 0 ? eventAttendees[0] : mockAttendees[0]
    const event = mockEvents.find(e => e.id === selectedEventId) || mockEvents[0]

    return text
      .replace(/{{name}}/g, user?.name || 'Guest')
      .replace(/{{surname}}/g, user?.surname || '')
      .replace(/{{event_name}}/g, event?.name || 'Your Event')
      .replace(/{{ticket_link}}/g, 'https://zemail.io/t/123')
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email Builder</h1>
          <p className="text-muted-foreground">Design and manage your email templates visually.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={currentTemplate?.id || 'new'} onValueChange={loadTemplate}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Load a template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new" className="font-medium text-primary">
                + Create New Template
              </SelectItem>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setSaveOpen(true)} disabled={blocks.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Editor & Settings */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Settings Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="previewEvent">Preview Context (Event Data)</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger id="previewEvent">
                    <SelectValue placeholder="Select event to preview data..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personalization Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {['{{name}}', '{{surname}}', '{{event_name}}', '{{ticket_link}}'].map(v => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground py-1 px-3 transition-colors"
                      onClick={() => copyVar(v)}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click any tag to copy it to your clipboard.</p>
              </div>
            </CardContent>
          </Card>

          {/* Blocks Editor Card */}
          <Card className="flex-1">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Content Blocks</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {blockTypes.map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => addBlock(type)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 bg-muted/30">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground bg-background">
                  <div className="mx-auto bg-muted h-12 w-12 rounded-full flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-foreground">No blocks added yet</p>
                  <p className="text-sm mt-1">Add blocks from the list above to build your email template.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((block, index) => {
                    const isExpanded = expandedBlockId === block.id
                    
                    return (
                      <div
                        key={block.id}
                        className={`bg-card border rounded-lg transition-all duration-200 ${isExpanded ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-border hover:border-border/80'}`}
                      >
                        {/* Header Row (Always visible) */}
                        <div 
                          className="flex items-center gap-3 p-3 cursor-pointer group"
                          onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-move" onClick={e => e.stopPropagation()} />
                          <Badge variant="secondary" className="text-xs shrink-0 w-20 justify-center">
                            {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                          </Badge>
                          
                          <div className="flex-1 text-sm text-muted-foreground truncate pr-4">
                            {block.type === 'image' 
                              ? (block.url ? 'Image provided' : 'No image URL') 
                              : (block.content || 'Empty block')}
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === blocks.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Content Editor */}
                        {isExpanded && (
                          <div className="p-4 border-t border-border bg-muted/10 space-y-4 animate-in slide-in-from-top-2">
                             
                            {/* Styling Tools for Text elements */}
                            {['text', 'header', 'button'].includes(block.type) && (
                              <div className="flex flex-wrap items-center gap-4 bg-background p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground sr-only">Color</Label>
                                  <div className="h-8 w-8 rounded overflow-hidden border border-border shrink-0 outline-none ring-offset-background focus-within:ring-2 focus-within:ring-ring">
                                    <input
                                      type="color"
                                      value={block.styles?.color || '#000000'}
                                      onChange={(e) => updateBlockStyle(block.id, 'color', e.target.value)}
                                      className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                                    />
                                  </div>
                                </div>
                                
                                <Separator orientation="vertical" className="h-6" />
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={block.styles?.fontSize || (block.type === 'header' ? 24 : 16)}
                                    onChange={(e) => updateBlockStyle(block.id, 'fontSize', parseInt(e.target.value) || 16)}
                                    placeholder="px"
                                    className="w-16 h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground font-medium">px</span>
                                </div>
                                
                                <Separator orientation="vertical" className="h-6" />

                                <div className="flex items-center bg-muted rounded p-0.5">
                                  {(['left', 'center', 'right', 'justify'] as const).map(align => {
                                    const aligns = {
                                      left: <AlignLeft className="h-4 w-4" />,
                                      center: <AlignCenter className="h-4 w-4" />,
                                      right: <AlignRight className="h-4 w-4" />,
                                      justify: <AlignJustify className="h-4 w-4" />,
                                    }
                                    const isActive = (block.styles?.textAlign || 'left') === align
                                    return (
                                      <button
                                        key={align}
                                        onClick={() => updateBlockStyle(block.id, 'textAlign', align)}
                                        className={`p-1.5 rounded transition-all ${isActive ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                      >
                                        {aligns[align]}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* URL / Upload for Image blocks */}
                            {block.type === 'image' && (() => {
                              const mode = imageInputMode[block.id] || 'url'
                              return (
                                <div className="space-y-2">
                                  {/* Tab switcher */}
                                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md w-fit">
                                    <button
                                      onClick={() => setImageInputMode(prev => ({ ...prev, [block.id]: 'url' }))}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                                        mode === 'url'
                                          ? 'bg-background shadow-sm text-foreground'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <Link className="h-3 w-3" />
                                      URL
                                    </button>
                                    <button
                                      onClick={() => setImageInputMode(prev => ({ ...prev, [block.id]: 'upload' }))}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                                        mode === 'upload'
                                          ? 'bg-background shadow-sm text-foreground'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <Upload className="h-3 w-3" />
                                      Upload
                                    </button>
                                  </div>

                                  {mode === 'url' ? (
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-medium">Image URL</Label>
                                      <Input
                                        value={block.url || ''}
                                        onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                                        placeholder="https://example.com/image.png"
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-medium">Upload Image</Label>
                                      <label
                                        htmlFor={`img-upload-${block.id}`}
                                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                                          uploadingBlockId === block.id
                                            ? 'border-primary/50 bg-primary/5 cursor-wait'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                        }`}
                                      >
                                        {uploadingBlockId === block.id ? (
                                          <>
                                            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1.5" />
                                            <span className="text-xs text-muted-foreground">Uploading...</span>
                                          </>
                                        ) : block.url ? (
                                          <>
                                            <ImageIcon className="h-5 w-5 text-primary mb-1" />
                                            <span className="text-xs text-primary font-medium">Image uploaded</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">Click to replace</span>
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                            <span className="text-xs text-muted-foreground">Click to upload</span>
                                            <span className="text-[10px] text-muted-foreground/70 mt-0.5">PNG, JPG, GIF, WebP</span>
                                          </>
                                        )}
                                        <input
                                          id={`img-upload-${block.id}`}
                                          type="file"
                                          accept="image/*"
                                          className="sr-only"
                                          disabled={uploadingBlockId === block.id}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(block.id, file)
                                            e.target.value = ''
                                          }}
                                        />
                                      </label>
                                      {block.url && (
                                        <p className="text-[10px] text-muted-foreground truncate" title={block.url}>
                                          {block.url}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                            {/* URL Input for Button blocks */}
                            {block.type === 'button' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Link URL</Label>
                                <Input
                                  value={block.url || ''}
                                  onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                                  placeholder="https://example.com/link"
                                  className="h-9 text-sm"
                                />
                              </div>
                            )}

                            {/* Content Inputs */}
                            {block.type === 'text' ? (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Text Content</Label>
                                <Textarea
                                  value={block.content}
                                  onChange={e => updateBlockContent(block.id, e.target.value)}
                                  className="min-h-[100px] resize-y"
                                  placeholder="Enter text..."
                                />
                              </div>
                            ) : block.type !== 'image' ? (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Content</Label>
                                <Input
                                  value={block.content}
                                  onChange={e => updateBlockContent(block.id, e.target.value)}
                                  placeholder={block.type === 'footer' ? 'Footer info...' : 'Content...'}
                                  className="h-9"
                                />
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="xl:sticky xl:top-6 w-full">
          <Card className="h-full min-h-[600px] flex flex-col border-primary/20 shadow-lg relative overflow-hidden">
            <CardHeader className="py-4 border-b bg-muted/20 flex-none z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                  Live Preview
                </CardTitle>
                <Badge variant="outline" className="bg-background">
                  {currentTemplate ? currentTemplate.name : 'Unsaved Template'}
                </Badge>
              </div>
              <div className="mt-4 p-3 bg-background border rounded-md shadow-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Subject</p>
                <p className="text-sm border-b pb-2 mb-2">{parseContent(subject) || 'No subject set...'}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>To: </span>
                  <span className="font-medium text-foreground">
                    {parseContent('{{name}} {{surname}}')}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 overflow-y-auto bg-[#f9fafb] relative z-0">
               {/* Email Container Simulation */}
               <div className="w-full max-w-[600px] mx-auto bg-white min-h-[400px] shadow-sm my-8 border border-border/50 rounded flex flex-col pt-8 pb-12 px-6">
                 {blocks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <div className="w-16 h-16 border rounded bg-muted/50 mb-4" />
                      <div className="h-4 w-32 bg-muted/50 rounded mb-2" />
                      <div className="h-4 w-48 bg-muted/50 rounded" />
                    </div>
                  ) : (
                    blocks.map(block => (
                      <div
                        key={block.id}
                        className={`mb-4 relative group ${expandedBlockId === block.id ? 'ring-2 ring-primary/20 ring-offset-4 rounded-sm' : ''}`}
                        style={{
                          textAlign: block.styles?.textAlign || 'left',
                          color: block.styles?.color || '#000000',
                          fontSize: `${block.styles?.fontSize || (block.type === 'header' ? 24 : 16)}px`
                        }}
                        onClick={() => setExpandedBlockId(block.id)}
                      >
                        {/* Hover Overlay for easy selection in preview */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity -mx-4 px-4 -my-2 py-2 -z-10" />

                        {block.type === 'header' && (
                          <h1 className="font-bold m-0 leading-tight">{parseContent(block.content)}</h1>
                        )}
                        {block.type === 'text' && (
                          <div className="whitespace-pre-wrap leading-relaxed m-0" style={{ minHeight: '1.5em' }}>
                            {parseContent(block.content)}
                          </div>
                        )}
                        {block.type === 'button' && (
                          <a 
                            href={block.url || '#'} 
                            onClick={e => e.preventDefault()}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium inline-block hover:opacity-90 shadow-sm transition-opacity no-underline"
                          >
                            {parseContent(block.content)}
                          </a>
                        )}
                        {block.type === 'image' && (
                          block.url ? (
                            <img src={block.url} alt="Email Block" className="max-w-full rounded-md shadow-sm block" />
                          ) : (
                            <div className="bg-muted h-40 rounded-md flex flex-col items-center justify-center text-muted-foreground w-full border-2 border-dashed border-border">
                              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                              <span className="text-sm font-medium">Image Placeholder</span>
                            </div>
                          )
                        )}
                        {block.type === 'footer' && (
                          <div className="border-t border-border pt-6 mt-6 pb-2 text-muted-foreground" style={{ fontSize: '13px' }}>
                            {parseContent(block.content)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ResponsiveModal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title="Save Template"
        description="Enter details to bind this template schema to an event"
        footer={<Button onClick={handleSaveTemplate} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Template'}</Button>}
      >
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetEvent">Attach to Event ID</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger id="targetEvent">
                <SelectValue placeholder="Select target event" />
              </SelectTrigger>
              <SelectContent>
                {mockEvents.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectLine">Subject Line</Label>
            <Input
              id="subjectLine"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter email subject... (Supports variables)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g., Summer Conference Invite"
            />
          </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}


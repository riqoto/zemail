'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Type,
  Heading,
  Square,
  Image,
  AlignLeft,
  GripVertical,
  Trash2,
  Eye,
  Plus,
  Save,
} from 'lucide-react'
import { type EmailBlock, type EmailTemplate, mockTemplates } from '@/lib/mock-data'

const blockTypes = [
  { type: 'header' as const, label: 'Header', icon: Heading },
  { type: 'text' as const, label: 'Text', icon: Type },
  { type: 'button' as const, label: 'Button', icon: Square },
  { type: 'image' as const, label: 'Image', icon: Image },
  { type: 'footer' as const, label: 'Footer', icon: AlignLeft },
]

export function EmailBuilderView() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>(mockTemplates)
  const [currentTemplate, setCurrentTemplate] = React.useState<EmailTemplate | null>(null)
  const [subject, setSubject] = React.useState('')
  const [blocks, setBlocks] = React.useState<EmailBlock[]>([])
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [templateName, setTemplateName] = React.useState('')

  const loadTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template)
    setSubject(template.subject)
    setBlocks([...template.blocks])
    setTemplateName(template.name)
  }

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: String(Date.now()),
      type,
      content: type === 'header' ? 'New Header' : type === 'button' ? 'Click Here' : 'New content...',
    }
    setBlocks(prev => [...prev, newBlock])
  }

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)))
  }

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return
    const newBlocks = [...blocks]
    ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const handleSaveTemplate = () => {
    if (!templateName) {
      toast.error('Please enter a template name')
      return
    }
    const template: EmailTemplate = {
      id: currentTemplate?.id || String(Date.now()),
      name: templateName,
      subject,
      blocks,
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (currentTemplate) {
      setTemplates(prev => prev.map(t => (t.id === template.id ? template : t)))
    } else {
      setTemplates(prev => [...prev, template])
    }
    setCurrentTemplate(template)
    toast.success('Template saved successfully')
    setSaveOpen(false)
  }

  const startNewTemplate = () => {
    setCurrentTemplate(null)
    setSubject('')
    setBlocks([])
    setTemplateName('')
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email Builder</h1>
          <p className="text-muted-foreground">Create and edit email templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={blocks.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => setSaveOpen(true)} disabled={blocks.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map(template => (
                <Button
                  key={template.id}
                  variant={currentTemplate?.id === template.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.createdAt}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Block</CardTitle>
              <CardDescription>Click to add to template</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {blockTypes.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => addBlock(type)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentTemplate ? `Editing: ${currentTemplate.name}` : 'New Template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{name}}'}, {'{{event_name}}'} for personalization
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Email Blocks</Label>
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                  <p>No blocks added yet</p>
                  <p className="text-sm">Add blocks from the sidebar to build your template</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="border border-border rounded-lg p-3 bg-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Badge variant="secondary" className="text-xs">
                          {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                        </Badge>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlock(index, 'up')}
                          disabled={index === 0}
                        >
                          Up
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlock(index, 'down')}
                          disabled={index === blocks.length - 1}
                        >
                          Down
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeBlock(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {block.type === 'text' ? (
                        <Textarea
                          value={block.content}
                          onChange={e => updateBlockContent(block.id, e.target.value)}
                          className="min-h-[80px]"
                        />
                      ) : (
                        <Input
                          value={block.content}
                          onChange={e => updateBlockContent(block.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ResponsiveModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Email Preview"
        description={subject || 'No subject'}
      >
        <div className="py-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden">
            {blocks.map(block => (
              <div key={block.id} className="p-4">
                {block.type === 'header' && (
                  <h1 className="text-2xl font-bold text-foreground">{block.content}</h1>
                )}
                {block.type === 'text' && (
                  <p className="text-foreground whitespace-pre-wrap">{block.content}</p>
                )}
                {block.type === 'button' && (
                  <Button className="mt-2">{block.content}</Button>
                )}
                {block.type === 'image' && (
                  <div className="bg-muted h-32 rounded-lg flex items-center justify-center text-muted-foreground">
                    [Image: {block.content}]
                  </div>
                )}
                {block.type === 'footer' && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-4 mt-4">
                    {block.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title="Save Template"
        description="Enter a name for your template"
        footer={<Button onClick={handleSaveTemplate}>Save Template</Button>}
      >
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
            />
          </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}

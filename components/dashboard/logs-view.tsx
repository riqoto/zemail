'use client'

import * as React from 'react'
import useSWR from 'swr'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Mail,
  FileText,
  Users,
  Calendar,
  Upload,
  Cpu,
  Clock,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppLog {
  id: string
  log_type: string
  event_type: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch logs')
  return json
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; variant: string; color: string }
> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    variant: 'default',
    color: 'text-emerald-500',
  },
  error: { label: 'Error', icon: XCircle, variant: 'destructive', color: 'text-red-500' },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    variant: 'outline',
    color: 'text-amber-500',
  },
  info: { label: 'Info', icon: Info, variant: 'secondary', color: 'text-blue-500' },
}

const LOG_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> =
{
  email: { label: 'Email', icon: Mail, color: 'text-violet-500' },
  template: { label: 'Template', icon: FileText, color: 'text-sky-500' },
  attendee: { label: 'Attendee', icon: Users, color: 'text-pink-500' },
  event: { label: 'Event', icon: Calendar, color: 'text-orange-500' },
  upload: { label: 'Upload', icon: Upload, color: 'text-teal-500' },
  system: { label: 'System', icon: Cpu, color: 'text-gray-500' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.info
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium text-xs ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

function LogTypeBadge({ type }: { type: string }) {
  const cfg = LOG_TYPE_CONFIG[type] ?? { label: type, icon: Cpu, color: 'text-muted-foreground' }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

function EventTypeBadge({ type }: { type: string }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <Badge variant="outline" className="text-xs font-mono capitalize">
      {label}
    </Badge>
  )
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function LogDetailDrawer({
  log,
  onClose,
}: {
  log: AppLog | null
  onClose: () => void
}) {
  if (!log) return null
  const statusCfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.info
  const typeCfg =
    LOG_TYPE_CONFIG[log.log_type] ?? { label: log.log_type, icon: Cpu, color: 'text-muted-foreground' }
  const Icon = statusCfg.icon
  const TypeIcon = typeCfg.icon

  const metaEntries = Object.entries(log.metadata ?? {})

  return (
    <Sheet open={!!log} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto px-4">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${log.status === 'success'
                ? 'bg-emerald-500/10'
                : log.status === 'error'
                  ? 'bg-red-500/10'
                  : log.status === 'warning'
                    ? 'bg-amber-500/10'
                    : 'bg-blue-500/10'
                }`}
            >
              <Icon className={`h-5 w-5 ${statusCfg.color}`} />
            </div>
            <div>
              <SheetTitle className="text-base leading-tight">Log Detail</SheetTitle>
              <SheetDescription className="text-xs mt-0.5 font-mono">{log.id}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Primary Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Log Type</p>
              <div className="flex items-center gap-1.5">
                <TypeIcon className={`h-4 w-4 ${typeCfg.color}`} />
                <span className="text-sm font-semibold">{typeCfg.label}</span>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Event Type</p>
              <span className="text-sm font-semibold capitalize">{log.event_type}</span>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</p>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-4 w-4 ${statusCfg.color}`} />
                <span className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Time</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp full */}
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(log.created_at), "PPP 'at' HH:mm:ss")}
          </div>

          {/* Message */}
          {log.message && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Message</p>
                <p className="text-sm bg-muted/50 rounded-md p-3 leading-relaxed border">{log.message}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          {metaEntries.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Metadata</p>
                <div className="rounded-lg border divide-y overflow-hidden">
                  {metaEntries.map(([k, v]) => (
                    <div key={k} className="flex items-start gap-3 px-3 py-2.5 text-xs">
                      <span className="text-muted-foreground font-mono w-28 shrink-0 pt-0.5 truncate">{k}</span>
                      <span className="font-medium break-all">
                        {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Raw JSON */}
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Raw JSON</p>
            <pre className="text-[11px] bg-muted/50 rounded-md p-3 overflow-auto max-h-48 border font-mono leading-relaxed">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export function LogsView() {
  const { data: logs = [], isLoading, mutate } = useSWR<AppLog[]>('/api/logs?limit=500', fetcher, {
    refreshInterval: 30_000,
  })

  const [selectedLog, setSelectedLog] = React.useState<AppLog | null>(null)
  const [search, setSearch] = React.useState('')
  const [filterType, setFilterType] = React.useState<string>('all')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
    toast.success('Logs refreshed')
  }

  const filtered = React.useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.log_type.includes(search.toLowerCase()) ||
        log.event_type.includes(search.toLowerCase()) ||
        log.status.includes(search.toLowerCase()) ||
        (log.message ?? '').toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || log.log_type === filterType
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [logs, search, filterType, filterStatus])

  const hasFilters = search || filterType !== 'all' || filterStatus !== 'all'

  const clearFilters = () => {
    setSearch('')
    setFilterType('all')
    setFilterStatus('all')
  }

  // Stats counts
  const counts = React.useMemo(
    () => ({
      total: logs.length,
      success: logs.filter((l) => l.status === 'success').length,
      error: logs.filter((l) => l.status === 'error').length,
      warning: logs.filter((l) => l.status === 'warning').length,
    }),
    [logs]
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Application Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time activity and event audit trail
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Logs', value: counts.total, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Success', value: counts.success, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Errors', value: counts.error, color: 'text-red-500', bg: 'bg-red-500/5' },
          { label: 'Warnings', value: counts.warning, color: 'text-amber-500', bg: 'bg-amber-500/5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by type, message, ID…"
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Log Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(LOG_TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[140px] font-semibold">Log Type</TableHead>
                <TableHead className="w-[130px] font-semibold">Event</TableHead>
                <TableHead className="w-[110px] font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Message</TableHead>
                <TableHead className="w-[160px] font-semibold text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-1">
                        <Cpu className="h-6 w-6 opacity-40" />
                      </div>
                      <p className="font-medium text-foreground text-sm">No logs found</p>
                      <p className="text-xs">
                        {hasFilters
                          ? 'No logs match your filters.'
                          : 'Logs will appear here as the app is used.'}
                      </p>
                      {hasFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>
                      <LogTypeBadge type={log.log_type} />
                    </TableCell>
                    <TableCell>
                      <EventTypeBadge type={log.event_type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="text-sm text-muted-foreground truncate block group-hover:text-foreground transition-colors">
                        {log.message || (
                          <span className="opacity-40 italic text-xs">No message</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="text-xs text-muted-foreground"
                        title={format(new Date(log.created_at), 'PPP HH:mm:ss')}
                      >
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
              <span className="font-semibold text-foreground">{logs.length}</span> logs
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-refreshes every 30s
            </span>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}

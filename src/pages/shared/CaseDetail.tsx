import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowUpCircle, BadgeCheck, CalendarPlus, CircleDot, EyeOff, FilePlus2, Lock, MessageSquare, Paperclip, StickyNote, UserCheck, Video, MapPin,
} from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useAddNote, useApprove, useCase, useCreateAppointment, useStaffMembers, useUpdateCase } from '@/data/hooks'
import { formatDateTime, formatDate } from '@/lib/format'
import { categoryLabel, MEETING_LABEL, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/labels'
import type { CaseDetail as Detail, CaseKind, CaseStatus, MeetingPreference, Severity } from '@/types'
import { Alert, Avatar, Badge, Button, Card, ConfirmDialog, Dialog, ErrorState, Input, LoadingState, SeverityBadge, Select, StatusBadge, Textarea, Timeline, useToast, type TimelineItem } from '@/components/ui'

const STUDENT_MESSAGE: Record<CaseStatus, string> = {
  pending: 'Nhà trường đã nhận yêu cầu của bạn và sẽ sớm xem xét.',
  submitted: 'Nhà trường đã nhận báo cáo của bạn và sẽ sớm xem xét.',
  triaging: 'Yêu cầu đang được phân loại để chuyển đến đúng người hỗ trợ bạn.',
  assigned: 'Đã có người phụ trách yêu cầu của bạn.',
  in_progress: 'Người phụ trách đang hỗ trợ bạn.',
  need_info: 'Nhà trường cần bạn bổ sung thêm thông tin. Bạn có thể nhắn tin cho người phụ trách.',
  resolved: 'Yêu cầu đã được xử lý. Nếu bạn vẫn cần hỗ trợ, hãy gửi yêu cầu mới bất cứ lúc nào.',
  archived: 'Yêu cầu đã được lưu trữ.',
}
const POWER_STATUSES: CaseStatus[] = ['triaging', 'assigned', 'in_progress', 'need_info', 'resolved', 'archived']
const STAFF_STATUSES: CaseStatus[] = ['in_progress', 'need_info', 'resolved']

const EVENT_ICON = {
  created: { icon: <FilePlus2 className="size-4" />, tone: 'brand' },
  assigned: { icon: <UserCheck className="size-4" />, tone: 'teal' },
  status: { icon: <CircleDot className="size-4" />, tone: 'brand' },
  escalated: { icon: <ArrowUpCircle className="size-4" />, tone: 'danger' },
  approved: { icon: <BadgeCheck className="size-4" />, tone: 'ok' },
  appointment: { icon: <CalendarPlus className="size-4" />, tone: 'teal' },
  note: { icon: <StickyNote className="size-4" />, tone: 'neutral' },
} as const

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-body text-ink">{children}</dd>
    </div>
  )
}

function AppointmentDialog({ open, onOpenChange, kind, id }: { open: boolean; onOpenChange: (o: boolean) => void; kind: CaseKind; id: string }) {
  const create = useCreateAppointment(kind, id)
  const toast = useToast()
  const [when, setWhen] = useState('')
  const [type, setType] = useState<MeetingPreference>('in_person')
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  function submit() {
    if (!when || new Date(when).getTime() < Date.now()) return setErr('Bạn chọn thời gian trong tương lai nhé.')
    setErr('')
    create.mutate(
      { scheduledAt: new Date(when).toISOString(), type, meetingUrl: type === 'online' && url.trim() ? url.trim() : undefined },
      {
        onSuccess: () => {
          toast.success('Đã đặt lịch hẹn. Học sinh sẽ nhận được thông báo.')
          onOpenChange(false)
          setWhen('')
          setUrl('')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa đặt được lịch.'),
      },
    )
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Đặt lịch hẹn"
      footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Để sau</Button><Button loading={create.isPending} onClick={submit}>Đặt lịch</Button></>}
    >
      <div className="space-y-4 pb-2">
        <Input label="Thời gian" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} error={err} />
        <Select label="Hình thức" value={type} onChange={(e) => setType(e.target.value as MeetingPreference)}>
          <option value="in_person">Trực tiếp</option>
          <option value="online">Online</option>
        </Select>
        {type === 'online' && <Input label="Liên kết phòng họp" optional type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />}
      </div>
    </Dialog>
  )
}

function StaffActions({ data, kind, id }: { data: Detail; kind: CaseKind; id: string }) {
  const me = useMe()
  const toast = useToast()
  const update = useUpdateCase(kind, id)
  const approve = useApprove(kind, id)
  const staff = useStaffMembers()
  const { item } = data
  const power = me.role === 'supervisor' || me.role === 'admin'
  const [status, setStatus] = useState<CaseStatus>(item.status)
  const [severity, setSeverity] = useState<Severity>(item.severity)
  const [assignee, setAssignee] = useState(item.assignee?.id ?? '')
  const [note, setNote] = useState('')
  const [escOpen, setEscOpen] = useState(false)
  const [appOpen, setAppOpen] = useState(false)
  const [apprOpen, setApprOpen] = useState(false)
  const [apprNote, setApprNote] = useState('')

  const statusOptions = power ? POWER_STATUSES : STAFF_STATUSES
  const options = statusOptions.includes(item.status) ? statusOptions : [item.status, ...statusOptions]
  const dirty = status !== item.status || (power && (severity !== item.severity || assignee !== (item.assignee?.id ?? ''))) || note.trim() !== ''
  const canBook = kind === 'counseling' && (item.assignee?.id === me.id || me.role === 'supervisor')

  function save() {
    update.mutate(
      {
        status: status !== item.status ? status : undefined,
        severity: power && severity !== item.severity ? severity : undefined,
        assigneeId: power && assignee !== (item.assignee?.id ?? '') ? assignee || null : undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật.')
          setNote('')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa cập nhật được.'),
      },
    )
  }

  return (
    <>
      <Card className="space-y-4 p-5">
        <h2 className="text-h3 font-semibold text-ink">Xử lý</h2>
        <Select label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
          {options.map((s) => <option key={s} value={s} disabled={!statusOptions.includes(s)}>{STATUS_LABEL[s]}</option>)}
        </Select>
        {power && (
          <>
            <Select label="Mức độ" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
            </Select>
            <Select label="Người phụ trách" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Chưa phân công</option>
              {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role === 'counselor' ? 'Tư vấn viên' : 'Giáo viên'})</option>)}
            </Select>
          </>
        )}
        <Textarea label="Ghi nhận hỗ trợ" optional rows={3} className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} hint="Chỉ nhân sự thấy. Học sinh không xem được." />
        <Button className="w-full" disabled={!dirty} loading={update.isPending} onClick={save}>Lưu cập nhật</Button>
      </Card>

      {(me.role === 'supervisor' && !item.escalated) && (
        <Card className="p-5">
          <h2 className="text-h3 font-semibold text-ink">Chuyển Ban giám hiệu</h2>
          <p className="mt-1 text-caption text-ink-2">Dùng khi ca cần quyết định của Ban giám hiệu. Mức độ sẽ được đặt là Khẩn cấp.</p>
          <Button variant="danger-soft" className="mt-3 w-full" onClick={() => setEscOpen(true)}>Chuyển lên Ban giám hiệu</Button>
        </Card>
      )}
      {me.role === 'admin' && item.escalated && !item.approved && (
        <Card className="border-brand p-5">
          <h2 className="text-h3 font-semibold text-ink">Chờ phê duyệt can thiệp</h2>
          <p className="mt-1 text-caption text-ink-2">Ca này đã được chuyển lên Ban giám hiệu.</p>
          <Button className="mt-3 w-full" onClick={() => setApprOpen(true)}>Phê duyệt phương án</Button>
        </Card>
      )}

      <ConfirmDialog
        open={escOpen}
        onOpenChange={setEscOpen}
        title="Chuyển ca lên Ban giám hiệu?"
        description="Ban giám hiệu sẽ nhận thông báo ngay. Thao tác này được ghi vào nhật ký."
        confirmLabel="Chuyển lên"
        danger
        loading={update.isPending}
        onConfirm={() => update.mutate({ escalate: true }, { onSuccess: () => { setEscOpen(false); toast.success('Đã chuyển lên Ban giám hiệu.') }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa chuyển được.') })}
      />
      <Dialog
        open={apprOpen}
        onOpenChange={setApprOpen}
        title="Phê duyệt phương án can thiệp"
        footer={<><Button variant="secondary" onClick={() => setApprOpen(false)}>Để sau</Button><Button loading={approve.isPending} onClick={() => approve.mutate(apprNote.trim() || undefined, { onSuccess: () => { setApprOpen(false); toast.success('Đã phê duyệt.') }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa phê duyệt được.') })}>Phê duyệt</Button></>}
      >
        <Textarea label="Ý kiến chỉ đạo" optional rows={4} value={apprNote} onChange={(e) => setApprNote(e.target.value)} />
      </Dialog>

      {canBook && (
        <Button variant="secondary" className="w-full" icon={<CalendarPlus className="size-4" />} onClick={() => setAppOpen(true)}>Đặt lịch hẹn</Button>
      )}
      <AppointmentDialog open={appOpen} onOpenChange={setAppOpen} kind={kind} id={id} />
    </>
  )
}

function PrivateNotes({ data, kind, id }: { data: Detail; kind: CaseKind; id: string }) {
  const add = useAddNote(kind, id)
  const toast = useToast()
  const [body, setBody] = useState('')
  if (kind !== 'counseling') return null
  if (data.notes === 'locked') {
    return (
      <Card className="flex gap-3 bg-surface-2 p-5">
        <Lock className="mt-0.5 size-5 shrink-0 text-ink-3" aria-hidden />
        <div>
          <h2 className="text-h3 font-semibold text-ink">Ghi chú riêng tư</h2>
          <p className="mt-1 text-caption text-ink-2">Chỉ tư vấn viên phụ trách ca này xem được. Ban giám hiệu chỉ xem khi được cấp quyền có thời hạn.</p>
        </div>
      </Card>
    )
  }
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2"><Lock className="size-4 text-teal" aria-hidden /><h2 className="text-h3 font-semibold text-ink">Ghi chú riêng tư</h2></div>
      {data.canWriteNotes && (
        <div className="space-y-2">
          <Textarea label="Ghi chú mới" rows={3} className="min-h-20" value={body} onChange={(e) => setBody(e.target.value)} hint="Học sinh và người khác không xem được." />
          <Button size="sm" disabled={body.trim().length < 3} loading={add.isPending} onClick={() => add.mutate(body.trim(), { onSuccess: () => { setBody(''); toast.success('Đã lưu ghi chú.') }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa lưu được.') })}>Lưu ghi chú</Button>
        </div>
      )}
      {data.notes.length === 0 ? (
        <p className="text-caption text-ink-3">Chưa có ghi chú nào.</p>
      ) : (
        <ul className="space-y-3">
          {data.notes.map((n) => (
            <li key={n.id} className="rounded-ctl bg-surface-2 p-3">
              <p className="whitespace-pre-wrap text-body text-ink">{n.body}</p>
              <p className="mt-1.5 text-caption text-ink-3">{n.authorName} · {formatDateTime(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function CaseDetail({ kind: fixedKind }: { kind?: CaseKind }) {
  const params = useParams()
  const kind = (fixedKind ?? params.kind) as CaseKind
  const id = params.id ?? ''
  const me = useMe()
  const navigate = useNavigate()
  const isStudent = me.role === 'student'
  const q = useCase(kind, id)

  if (q.isLoading) return <LoadingState label="Đang mở hồ sơ…" />
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const { item, events, appointments } = q.data
  const items: TimelineItem[] = events.map((e) => {
    const m = EVENT_ICON[e.type]
    return { id: e.id, title: e.label, time: formatDateTime(e.createdAt), icon: m.icon, tone: m.tone, detail: e.detail && !isStudent ? <span className="whitespace-pre-wrap">{e.detail}</span> : undefined }
  })

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Quay lại
      </button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          {item.severity !== 'normal' && <SeverityBadge severity={item.severity} />}
          {item.escalated && <Badge tone="danger">Đã chuyển Ban giám hiệu</Badge>}
          {item.approved && <Badge tone="ok">BGH đã phê duyệt</Badge>}
          {item.isAnonymous && <Badge><EyeOff className="size-3" aria-hidden /> Ẩn danh</Badge>}
        </div>
        <h1 className="text-h1 font-semibold text-ink">{item.title}</h1>
        <p className="text-caption text-ink-3"><span className="font-mono">{item.code}</span> · Gửi {formatDateTime(item.createdAt)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          {isStudent && <Alert kind="info">{STUDENT_MESSAGE[item.status]}</Alert>}

          <Card className="p-5 sm:p-6">
            <h2 className="text-h3 font-semibold text-ink">Nội dung</h2>
            {item.description === null ? (
              <p className="mt-3 flex items-start gap-2 text-body text-ink-2"><Lock className="mt-1 size-4 shrink-0" aria-hidden />Nội dung được giữ riêng tư theo lựa chọn của học sinh. Chỉ tư vấn viên được phân công mới xem được.</p>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-ink">{item.description}</p>
            )}
            <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
              <Meta label={kind === 'incident' ? 'Loại sự việc' : 'Chủ đề'}>{categoryLabel(kind, item.category)}</Meta>
              {!isStudent && <Meta label="Người gửi">{item.reporter ? <span className="inline-flex items-center gap-2"><Avatar name={item.reporter.name} size="sm" />{item.reporter.name}{item.reporter.className ? ` · ${item.reporter.className}` : ''}</span> : <span className="text-ink-3">{item.isAnonymous ? 'Ẩn danh' : 'Không có quyền xem'}</span>}</Meta>}
              <Meta label="Người phụ trách">{item.assignee ? item.assignee.name : <span className="text-ink-3">Chưa phân công</span>}</Meta>
              {kind === 'counseling' && item.meeting && <Meta label="Hình thức mong muốn">{MEETING_LABEL[item.meeting]}</Meta>}
              {kind === 'counseling' && item.privacyLevel && <Meta label="Mức riêng tư">{item.privacyLevel === 'restricted' ? 'Riêng tư cao' : 'Thông thường'}</Meta>}
              {item.incidentTime && <Meta label="Xảy ra lúc">{formatDateTime(item.incidentTime)}</Meta>}
              {item.location && <Meta label="Địa điểm">{item.location}</Meta>}
              {item.involved && <Meta label="Người liên quan">{item.involved}</Meta>}
              {item.evidenceCount > 0 && <Meta label="Bằng chứng"><span className="inline-flex items-center gap-1.5"><Paperclip className="size-4 text-ink-3" aria-hidden />{item.evidenceCount} tệp</span></Meta>}
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-h3 font-semibold text-ink">Diễn biến</h2>
            {items.length ? <Timeline items={items} /> : <p className="text-body text-ink-3">Chưa có diễn biến nào.</p>}
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {!isStudent && <StaffActions key={`${item.status}-${item.severity}-${item.assignee?.id}`} data={q.data} kind={kind} id={id} />}

          {isStudent && kind === 'counseling' && item.assignee && (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={item.assignee.name} size="lg" />
                <div className="min-w-0"><p className="text-caption text-ink-3">Người phụ trách</p><p className="truncate font-medium text-ink">{item.assignee.name}</p></div>
              </div>
              <Link to={`/student/messages?case=${item.id}`} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-ctl bg-brand text-on-brand hover:bg-brand-hover"><MessageSquare className="size-4" aria-hidden />Nhắn tin</Link>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-h3 font-semibold text-ink">Lịch hẹn</h2>
            {appointments.length === 0 ? (
              <p className="mt-2 text-caption text-ink-3">Chưa có lịch hẹn.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {appointments.map((a) => (
                  <li key={a.id} className="rounded-ctl bg-surface-2 p-3">
                    <p className="font-medium text-ink">{formatDateTime(a.scheduledAt)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-caption text-ink-2">{a.type === 'online' ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}{MEETING_LABEL[a.type]} · {a.durationMinutes} phút · {a.status === 'scheduled' ? 'Đã hẹn' : a.status === 'done' ? `Đã diễn ra` : 'Đã hủy'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!isStudent && <PrivateNotes data={q.data} kind={kind} id={id} />}
          {!isStudent && <p className="px-1 text-caption text-ink-3">Cập nhật lần cuối {formatDate(item.updatedAt)} · Mọi thao tác được ghi vào nhật ký.</p>}
        </aside>
      </div>
    </div>
  )
}

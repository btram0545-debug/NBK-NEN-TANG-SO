import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, FileAudio, FileImage, FileVideo, Paperclip, X } from 'lucide-react'
import { useCreateIncident } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { INCIDENT_TYPE_LABEL, SEVERITY_LABEL } from '@/lib/labels'
import type { CaseItem, IncidentType, Severity } from '@/types'
import { QuickExitBar } from '@/components/QuickExit'
import { StickyActions } from '@/components/StickyActions'
import { Alert, Button, Checkbox, Input, LinkButton, Textarea, useToast } from '@/components/ui'

const SEVERITY_HELP: Record<Severity, string> = {
  normal: 'Chưa nguy hiểm ngay, nhưng bạn muốn nhà trường biết.',
  serious: 'Có người bị tổn thương hoặc sự việc đang lặp lại.',
  urgent: 'Có người đang gặp nguy hiểm hoặc cần can thiệp ngay.',
}
const MAX_FILES = 5
const MAX_MB = 25
const fileIcon = (f: File) => (f.type.startsWith('video') ? FileVideo : f.type.startsWith('audio') ? FileAudio : FileImage)
const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

export default function IncidentForm() {
  const toast = useToast()
  const create = useCreateIncident()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<IncidentType | null>(null)
  const [severity, setSeverity] = useState<Severity>('normal')
  const [description, setDescription] = useState('')
  const [when, setWhen] = useState('')
  const [where, setWhere] = useState('')
  const [involved, setInvolved] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileErr, setFileErr] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [errors, setErrors] = useState<{ type?: string; description?: string }>({})
  const [done, setDone] = useState<(CaseItem & { warning?: string }) | null>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    let err = ''
    for (const f of Array.from(list)) {
      if (!/^(image|video|audio)\//.test(f.type)) err = 'Chỉ nhận hình ảnh, video hoặc âm thanh.'
      else if (f.size > MAX_MB * 1024 * 1024) err = `Mỗi tệp tối đa ${MAX_MB} MB.`
      else if (next.length >= MAX_FILES) err = `Tối đa ${MAX_FILES} tệp.`
      else next.push(f)
    }
    setFileErr(err)
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  function submit() {
    const e = {
      type: type ? undefined : 'Bạn chọn loại sự việc nhé.',
      description: description.trim().length >= 10 ? undefined : 'Bạn mô tả thêm một chút nhé (ít nhất 10 ký tự).',
    }
    setErrors(e)
    if (e.type || e.description || !type) {
      document.getElementById(e.type ? 'incident-type' : 'incident-desc')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    create.mutate(
      {
        type,
        severity,
        description: description.trim(),
        incidentTime: when ? new Date(when).toISOString() : undefined,
        location: where.trim() || undefined,
        involved: involved.trim() || undefined,
        isAnonymous: anonymous,
        files,
      },
      {
        onSuccess: (item) => setDone(item),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Chưa gửi được báo cáo. Bạn thử lại nhé.'),
      },
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center animate-page">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok-ink" aria-hidden><Check className="size-8" strokeWidth={2.5} /></div>
        <h1 className="text-h1 font-semibold text-ink">Nhà trường đã nhận báo cáo của bạn</h1>
        <p className="mt-2 text-body text-ink-2">Cảm ơn bạn đã lên tiếng. Việc này rất cần dũng khí. Báo cáo sẽ được xử lý theo mức độ bạn đã chọn.</p>
        <p className="mt-5 inline-block rounded-full bg-surface-2 px-4 py-1.5 text-caption text-ink-2">Mã báo cáo: <span className="font-mono font-semibold text-ink">{done.code}</span></p>
        {done.warning && <Alert kind="warning" className="mt-5 text-left">{done.warning}</Alert>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton to={`/student/incidents/${done.id}`}>Theo dõi báo cáo</LinkButton>
          <LinkButton to="/student" variant="secondary">Về trang chủ</LinkButton>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-28 lg:pb-0">
      <QuickExitBar />
      <div className="mx-auto max-w-2xl">
        <Link to="/student/incidents" className="mb-5 inline-flex items-center gap-1.5 text-caption font-medium text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Báo cáo sự việc
        </Link>
        <h1 className="text-h1 font-semibold text-ink">Gửi báo cáo</h1>
        <p className="mt-1 text-body text-ink-2">Nếu có điều khiến bạn hoặc người khác không an toàn, hãy cho nhà trường biết. Bạn chỉ cần kể những gì bạn nhớ.</p>

        <div className="mt-8 space-y-9">
          <fieldset id="incident-type" aria-describedby={errors.type ? 'type-err' : undefined}>
            <legend className="mb-3 text-caption font-medium text-ink">Đã xảy ra chuyện gì?</legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {(Object.keys(INCIDENT_TYPE_LABEL) as IncidentType[]).map((k) => (
                <label
                  key={k}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center justify-center rounded-box border px-3 py-2.5 text-center text-body font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                    type === k ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-surface text-ink hover:border-line-strong',
                  )}
                >
                  <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} className="sr-only" />
                  {INCIDENT_TYPE_LABEL[k]}
                </label>
              ))}
            </div>
            {errors.type && <p id="type-err" role="alert" className="mt-2 text-caption text-danger-ink">{errors.type}</p>}
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-caption font-medium text-ink">Mức độ</legend>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => (
                <label
                  key={k}
                  className={cn(
                    'cursor-pointer rounded-box border p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                    severity === k ? (k === 'urgent' ? 'border-danger bg-danger-soft' : 'border-brand bg-brand-soft') : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <input type="radio" name="severity" value={k} checked={severity === k} onChange={() => setSeverity(k)} className="sr-only" />
                  <span className="block font-medium text-ink">{SEVERITY_LABEL[k]}</span>
                  <span className="mt-0.5 block text-caption text-ink-2">{SEVERITY_HELP[k]}</span>
                </label>
              ))}
            </div>
            {severity === 'urgent' && (
              <Alert kind="warning" title="Nếu ai đó đang gặp nguy hiểm ngay lúc này" className="mt-3 animate-fade-in">
                Hãy báo ngay cho thầy cô gần nhất, hoặc gọi 111 (Tổng đài quốc gia bảo vệ trẻ em) hay 113 (Công an). Báo cáo này sẽ được chuyển cho quản sinh ngay khi gửi.
              </Alert>
            )}
          </fieldset>

          <Textarea
            id="incident-desc"
            label="Bạn có thể kể lại không?"
            rows={7}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            hint="Ai, ở đâu, chuyện xảy ra thế nào… nhớ được gì kể nấy."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Xảy ra lúc nào" optional type="datetime-local" value={when} max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => setWhen(e.target.value)} />
            <Input label="Ở đâu" optional value={where} onChange={(e) => setWhere(e.target.value)} placeholder="vd. sân sau, nhóm chat lớp" />
          </div>
          <Input label="Những ai có liên quan" optional value={involved} onChange={(e) => setInvolved(e.target.value)} hint="Có thể ghi tên, lớp hoặc mô tả. Bạn không bắt buộc phải nêu." />

          <div>
            <p className="mb-2 text-caption font-medium text-ink">Bằng chứng <span className="font-normal text-ink-3">(không bắt buộc)</span></p>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" className="sr-only" id="evidence" onChange={(e) => addFiles(e.target.files)} />
            <label htmlFor="evidence" className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-box border border-dashed border-line-strong bg-surface px-4 py-5 text-center transition-colors hover:border-brand hover:bg-brand-soft/50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand">
              <Paperclip className="size-5 text-ink-3" aria-hidden />
              <span className="text-body font-medium text-ink">Thêm hình ảnh, video hoặc âm thanh</span>
              <span className="text-caption text-ink-3">Tối đa {MAX_FILES} tệp, mỗi tệp {MAX_MB} MB. Tệp được lưu ở kho riêng tư.</span>
            </label>
            {fileErr && <p role="alert" className="mt-2 text-caption text-danger-ink">{fileErr}</p>}
            {files.length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded-box border border-line">
                {files.map((f, i) => {
                  const I = fileIcon(f)
                  return (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3.5 py-2.5">
                      <I className="size-5 shrink-0 text-ink-3" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-body text-ink">{f.name}</span>
                      <span className="shrink-0 text-caption text-ink-3">{fmtSize(f.size)}</span>
                      <button type="button" aria-label={`Bỏ tệp ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="inline-flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink">
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 rounded-box bg-surface-2 p-4">
            <Checkbox checked={anonymous} onChange={setAnonymous} label="Gửi ẩn danh" description="Người xử lý sẽ không thấy tên bạn. Nhà trường có thể khó hỏi thêm thông tin, nên bạn hãy kể càng rõ càng tốt." />
          </div>
        </div>

        <div className="mt-8">
          <StickyActions>
            <Button size="lg" className="flex-1 lg:flex-none" onClick={submit} loading={create.isPending}>Gửi báo cáo</Button>
            <LinkButton to="/student/incidents" variant="ghost" size="lg">Hủy</LinkButton>
          </StickyActions>
        </div>
      </div>
    </div>
  )
}

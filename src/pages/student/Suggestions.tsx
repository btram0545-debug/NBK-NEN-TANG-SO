import { useMemo, useState } from 'react'
import { EyeOff, Globe, Inbox, Lock, Plus, ThumbsUp } from 'lucide-react'
import { useCreateSuggestion, useSuggestions, useToggleVote } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import { SUGGESTION_CATEGORY_LABEL } from '@/lib/labels'
import type { Suggestion, SuggestionCategory } from '@/types'
import { Alert, Avatar, Badge, Button, ChoiceCard, Checkbox, Dialog, EmptyState, ErrorState, FilterPills, Input, ListSkeleton, PageHeader, Select, Textarea, useToast } from '@/components/ui'

type View = 'all' | 'popular' | 'mine'

function NewSuggestion({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const toast = useToast()
  const create = useCreateSuggestion()
  const [category, setCategory] = useState<SuggestionCategory>('environment')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [anonymous, setAnonymous] = useState(false)
  const [err, setErr] = useState<{ title?: string; content?: string }>({})

  function submit() {
    const e = { title: title.trim().length >= 4 ? undefined : 'Bạn đặt tiêu đề ngắn gọn nhé.', content: content.trim().length >= 10 ? undefined : 'Bạn viết thêm một chút nhé (ít nhất 10 ký tự).' }
    setErr(e)
    if (e.title || e.content) return
    create.mutate(
      { title: title.trim(), content: content.trim(), category, visibility, isAnonymous: anonymous },
      {
        onSuccess: () => {
          toast.success(visibility === 'public' ? 'Cảm ơn bạn! Góp ý của bạn đã được đăng.' : 'Cảm ơn bạn! Góp ý riêng tư đã được gửi tới nhà trường.')
          setTitle('')
          setContent('')
          setAnonymous(false)
          onOpenChange(false)
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa gửi được góp ý.'),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      variant="sheet"
      title="Gửi góp ý"
      description="Ý kiến của bạn giúp môi trường học đường tốt hơn."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Để sau</Button>
          <Button loading={create.isPending} onClick={submit}>Gửi góp ý</Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <Select label="Chủ đề" value={category} onChange={(e) => setCategory(e.target.value as SuggestionCategory)}>
          {(Object.keys(SUGGESTION_CATEGORY_LABEL) as SuggestionCategory[]).map((k) => <option key={k} value={k}>{SUGGESTION_CATEGORY_LABEL[k]}</option>)}
        </Select>
        <Input label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} error={err.title} placeholder="vd. Thêm ghế đá ở sân trường" />
        <Textarea label="Nội dung" value={content} onChange={(e) => setContent(e.target.value)} maxLength={1500} error={err.content} rows={5} />
        <fieldset>
          <legend className="mb-2 text-caption font-medium text-ink">Ai được xem?</legend>
          <div className="space-y-2">
            <ChoiceCard name="vis" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} icon={<Globe className="size-4" />} title="Công khai" description="Các bạn khác thấy và có thể ủng hộ." />
            <ChoiceCard name="vis" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} icon={<Lock className="size-4" />} title="Riêng tư" description="Chỉ nhà trường xem." />
          </div>
        </fieldset>
        <Checkbox checked={anonymous} onChange={setAnonymous} label="Ẩn tên của tôi" />
      </div>
    </Dialog>
  )
}

function SuggestionItem({ s }: { s: Suggestion }) {
  const vote = useToggleVote()
  const toast = useToast()
  return (
    <li className="flex gap-4 px-4 py-5 sm:px-5">
      {s.visibility === 'public' ? (
        <button
          type="button"
          aria-pressed={s.votedByMe}
          aria-label={`${s.votedByMe ? 'Bỏ ủng hộ' : 'Ủng hộ'} góp ý này, hiện có ${s.votes} lượt`}
          disabled={vote.isPending || s.mine}
          onClick={() => vote.mutate(s.id, { onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa ủng hộ được.') })}
          className={cn(
            'flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-box border text-caption font-semibold transition-colors',
            s.votedByMe ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line text-ink-2 hover:border-line-strong',
            s.mine && 'opacity-70',
          )}
        >
          <ThumbsUp className="size-4" aria-hidden />
          {s.votes}
        </button>
      ) : (
        <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-box bg-surface-2 text-ink-3" aria-hidden><Lock className="size-4" /></span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{SUGGESTION_CATEGORY_LABEL[s.category]}</Badge>
          {s.mine && s.status === 'pending' && <Badge tone="warn" dot>Nhà trường chưa xem</Badge>}
          {s.status === 'resolved' && <Badge tone="ok" dot>Đã tiếp thu</Badge>}
          {s.visibility === 'private' && <Badge>Riêng tư</Badge>}
        </div>
        <h3 className="mt-2 font-semibold text-ink">{s.title}</h3>
        <p className="mt-1 text-body text-ink-2">{s.content}</p>
        <p className="mt-3 flex items-center gap-2 text-caption text-ink-3">
          {s.isAnonymous || !s.authorName ? <><EyeOff className="size-3.5" aria-hidden />Ẩn danh</> : <><Avatar name={s.authorName} size="sm" />{s.authorName}</>}
          <span aria-hidden>·</span>
          {relativeTime(s.createdAt)}
        </p>
      </div>
    </li>
  )
}

export default function Suggestions() {
  const { data, isLoading, isError, error, refetch } = useSuggestions()
  const [view, setView] = useState<View>('all')
  const [cat, setCat] = useState<'all' | SuggestionCategory>('all')
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    let r = (data ?? []).filter((s) => (view === 'mine' ? s.mine : s.visibility === 'public' && s.status !== 'hidden' && s.status !== 'pending') && (cat === 'all' || s.category === cat))
    r = [...r].sort((a, b) => (view === 'popular' ? b.votes - a.votes : b.createdAt.localeCompare(a.createdAt)))
    return r
  }, [data, view, cat])

  return (
    <div className="space-y-6">
      <PageHeader title="Hộp thư góp ý" description="Ý tưởng của bạn có thể làm trường học tốt hơn cho tất cả mọi người." action={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Gửi góp ý</Button>} />

      <div className="space-y-3">
        <FilterPills
          label="Xem theo"
          value={view}
          onChange={setView}
          options={[{ value: 'all', label: 'Mới nhất' }, { value: 'popular', label: 'Được ủng hộ nhiều' }, { value: 'mine', label: 'Của tôi' }]}
        />
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto text-caption">
          {(['all', ...Object.keys(SUGGESTION_CATEGORY_LABEL)] as ('all' | SuggestionCategory)[]).map((k) => (
            <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className={cn('shrink-0 rounded-md px-2.5 py-1.5 font-medium transition-colors', cat === k ? 'bg-brand-soft text-brand-ink' : 'text-ink-3 hover:text-ink')}>
              {k === 'all' ? 'Mọi chủ đề' : SUGGESTION_CATEGORY_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {view === 'mine' && <Alert kind="privacy">Đây là những góp ý bạn đã gửi, kể cả góp ý riêng tư mà nhà trường chưa xem.</Alert>}

      {isLoading ? (
        <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton /></div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong">
          <EmptyState icon={<Inbox className="size-7" />} title={view === 'mine' ? 'Bạn chưa gửi góp ý nào.' : 'Chưa có góp ý nào ở mục này.'} description="Hãy là người đầu tiên chia sẻ ý tưởng cho trường mình." action={<Button onClick={() => setOpen(true)}>Gửi góp ý</Button>} />
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-surface">{rows.map((s) => <SuggestionItem key={s.id} s={s} />)}</ul>
      )}

      <NewSuggestion open={open} onOpenChange={setOpen} />
    </div>
  )
}

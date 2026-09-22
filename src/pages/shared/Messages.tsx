import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock, MessagesSquare, Send } from 'lucide-react'
import { useMessages, useSendMessage, useThreads } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { formatTime, relativeTime } from '@/lib/format'
import { Avatar, Button, EmptyState, ErrorState, ListSkeleton, LoadingState, PageHeader, useToast } from '@/components/ui'

function Conversation({ caseId, title, counterpart, onBack }: { caseId: string; title: string; counterpart: string; onBack: () => void }) {
  const { data, isLoading, isError, error, refetch } = useMessages(caseId)
  const send = useSendMessage(caseId)
  const toast = useToast()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.length, caseId])

  function submit() {
    const body = text.trim()
    if (!body) return
    send.mutate(body, {
      onSuccess: () => setText(''),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa gửi được tin nhắn.'),
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Quay lại danh sách" className="-ml-2 inline-flex size-10 items-center justify-center rounded-ctl text-ink-2 hover:bg-surface-2 lg:hidden">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <Avatar name={counterpart} />
        <div className="min-w-0"><p className="truncate font-medium text-ink">{counterpart}</p><p className="truncate text-caption text-ink-3">{title}</p></div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {isLoading ? <LoadingState /> : isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : (data ?? []).length === 0 ? (
          <p className="py-10 text-center text-body text-ink-3">Chưa có tin nhắn nào. Bạn cứ nhắn khi sẵn sàng nhé.</p>
        ) : (
          <ul className="space-y-3">
            {data!.map((m) => (
              <li key={m.id} className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
                <div className={cn('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-body sm:max-w-[70%]', m.mine ? 'rounded-br-md bg-brand text-on-brand' : 'rounded-bl-md bg-surface-2 text-ink')}>{m.body}</div>
                <span className="mt-1 px-1 text-[0.6875rem] text-ink-3">{m.mine ? '' : `${m.senderLabel} · `}{formatTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="msg" className="sr-only">Tin nhắn</label>
          <textarea
            id="msg"
            rows={1}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            placeholder="Nhập tin nhắn…"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-ctl border border-line-strong bg-surface px-3.5 py-2.5 text-body text-ink focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30"
          />
          <Button aria-label="Gửi tin nhắn" className="size-11 shrink-0 px-0" disabled={!text.trim()} loading={send.isPending} onClick={submit}>
            {!send.isPending && <Send className="size-4" aria-hidden />}
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[0.6875rem] text-ink-3"><Lock className="size-3" aria-hidden />Chỉ những người phụ trách ca này xem được cuộc trò chuyện.</p>
      </div>
    </div>
  )
}

export default function Messages() {
  const [params, setParams] = useSearchParams()
  const threads = useThreads()
  const selected = params.get('case')
  const list = threads.data ?? []
  const current = list.find((t) => t.caseId === selected) ?? null

  return (
    <div className="space-y-6">
      <PageHeader title="Tin nhắn" description="Trao đổi riêng tư với người đang hỗ trợ bạn." />
      {threads.isLoading ? (
        <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton rows={3} /></div>
      ) : threads.isError ? (
        <ErrorState error={threads.error} onRetry={() => void threads.refetch()} />
      ) : list.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong">
          <EmptyState icon={<MessagesSquare className="size-7" />} title="Chưa có cuộc trò chuyện nào." description="Khi một yêu cầu tư vấn được giao cho người phụ trách, bạn sẽ nhắn tin với họ tại đây." />
        </div>
      ) : (
        <div className="grid h-[calc(100dvh-16rem)] min-h-[28rem] overflow-hidden rounded-box border border-line bg-surface lg:grid-cols-[19rem_minmax(0,1fr)]">
          <ul className={cn('divide-y divide-line overflow-y-auto border-line lg:block lg:border-r', current && 'hidden')} aria-label="Danh sách cuộc trò chuyện">
            {list.map((t) => (
              <li key={t.caseId}>
                <button type="button" onClick={() => setParams({ case: t.caseId })} className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2/60', current?.caseId === t.caseId && 'bg-brand-soft')}>
                  <Avatar name={t.counterpart} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2"><span className="truncate font-medium text-ink">{t.counterpart}</span>{t.lastAt && <span className="shrink-0 text-[0.6875rem] text-ink-3">{relativeTime(t.lastAt)}</span>}</span>
                    <span className="block truncate text-caption text-ink-3">{t.lastMessage ?? t.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className={cn('min-h-0', !current && 'hidden lg:block')}>
            {current ? (
              <Conversation key={current.caseId} caseId={current.caseId} title={`${current.title} · ${current.code}`} counterpart={current.counterpart} onBack={() => setParams({})} />
            ) : (
              <div className="grid h-full place-items-center text-body text-ink-3">Chọn một cuộc trò chuyện để bắt đầu.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

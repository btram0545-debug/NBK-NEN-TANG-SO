import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Lightbulb, MessageCircleHeart, ShieldAlert, Video, Users } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useAppointments, useMyCases } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { formatTime, formatWeekday, formatDate } from '@/lib/format'
import { MEETING_LABEL } from '@/lib/labels'
import { CaseRow, listBox } from '@/components/cases/CaseRow'
import { EmptyState, ErrorState, LinkButton, ListSkeleton, Section, Skeleton } from '@/components/ui'

const MOODS = [
  { key: 'great', emoji: '😊', label: 'Tốt', reply: 'Nghe vui quá! Chúc bạn một ngày thật nhiều năng lượng.' },
  { key: 'ok', emoji: '🙂', label: 'Ổn', reply: 'Ổn là đủ rồi. Cảm ơn bạn đã dừng lại để nhìn vào cảm xúc của mình.' },
  { key: 'neutral', emoji: '😐', label: 'Bình thường', reply: 'Có những ngày chỉ bình thường thôi, và như vậy cũng ổn.' },
  { key: 'down', emoji: '😟', label: 'Không ổn', reply: 'Cảm ơn bạn đã nói thật. Nếu muốn, bạn có thể chia sẻ với một tư vấn viên.', help: true },
  { key: 'hard', emoji: '😔', label: 'Khó khăn', reply: 'Mình rất tiếc khi bạn đang thấy khó khăn. Bạn không phải một mình, luôn có người sẵn sàng lắng nghe bạn.', help: true },
]
const moodKey = () => `sc-mood-${new Date().toISOString().slice(0, 10)}`

function MoodCheckin() {
  const [mood, setMood] = useState<string | null>(() => {
    try {
      return localStorage.getItem(moodKey())
    } catch {
      return null
    }
  })
  const pick = (k: string) => {
    setMood(k)
    try {
      localStorage.setItem(moodKey(), k)
    } catch {
      /* bỏ qua */
    }
  }
  const chosen = MOODS.find((m) => m.key === mood)
  return (
    <div>
      <div role="radiogroup" aria-label="Hôm nay bạn cảm thấy thế nào" className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mood === m.key}
            onClick={() => pick(m.key)}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-body font-medium transition-all',
              mood === m.key ? 'border-brand bg-surface text-ink shadow-low ring-2 ring-brand/30' : 'border-transparent bg-surface/70 text-ink-2 hover:bg-surface',
            )}
          >
            <span className="text-xl leading-none" aria-hidden>{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-12" aria-live="polite">
        {chosen ? (
          <div className="animate-fade-in">
            <p className="max-w-lg text-body text-ink">{chosen.reply}</p>
            {chosen.help && (
              <LinkButton to="/student/counseling/new" variant="primary" size="sm" className="mt-3">
                Chia sẻ với tư vấn viên
              </LinkButton>
            )}
          </div>
        ) : (
          <p className="text-caption text-ink-3">Chỉ để bạn tự nhìn lại, không gửi cho ai và không dùng để đánh giá bạn.</p>
        )}
      </div>
    </div>
  )
}

const ACTIONS = [
  { to: '/student/counseling/new', icon: MessageCircleHeart, title: 'Tư vấn học đường', text: 'Chia sẻ điều bạn đang gặp phải', tile: 'bg-brand-soft text-brand-ink' },
  { to: '/student/incidents/new', icon: ShieldAlert, title: 'Báo cáo sự việc', text: 'Thông báo vấn đề cần nhà trường hỗ trợ', tile: 'bg-teal-soft text-teal-ink' },
  { to: '/student/suggestions', icon: Lightbulb, title: 'Góp ý', text: 'Đóng góp ý tưởng cho môi trường học đường', tile: 'bg-warn-soft text-warn-ink' },
]

export default function StudentDashboard() {
  const me = useMe()
  const cases = useMyCases()
  const appts = useAppointments()
  const given = me.fullName.trim().split(/\s+/).pop()
  const upcoming = (appts.data ?? []).filter((a) => a.status === 'scheduled' && new Date(a.scheduledAt) > new Date()).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const recent = [...(cases.data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-hero bg-gradient-to-br from-brand-soft to-teal-soft px-5 py-7 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand/10 blur-2xl" aria-hidden />
        <h1 className="text-h1 font-semibold text-ink sm:text-[2rem] sm:leading-tight">Chào {given} <span aria-hidden>👋</span></h1>
        <p className="mt-1 mb-5 text-[1.0625rem] text-ink-2">Bạn đang cảm thấy thế nào hôm nay?</p>
        <MoodCheckin />
      </section>

      <Section title="Bạn cần hỗ trợ điều gì?">
        <div className="grid divide-y divide-line overflow-hidden rounded-box border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0">
          {ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="group flex items-center gap-4 p-5 transition-colors hover:bg-surface-2/60 md:flex-col md:items-start md:gap-5 md:p-6">
              <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', a.tile)} aria-hidden>
                <a.icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-h3 font-semibold text-ink">{a.title}</span>
                <span className="mt-0.5 block text-body text-ink-2">{a.text}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 md:hidden" aria-hidden />
            </Link>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Section title="Yêu cầu gần đây" action={recent.length > 0 ? <Link to="/student/counseling" className="text-caption font-medium text-brand-ink hover:underline">Xem tất cả</Link> : undefined}>
          {cases.isLoading ? (
            <div className={listBox}><ListSkeleton rows={3} /></div>
          ) : cases.isError ? (
            <ErrorState error={cases.error} onRetry={() => void cases.refetch()} />
          ) : recent.length === 0 ? (
            <div className="rounded-box border border-dashed border-line-strong">
              <EmptyState
                icon={<MessageCircleHeart className="size-7" />}
                title="Bạn chưa có yêu cầu tư vấn nào."
                description="Khi bạn gửi yêu cầu hoặc báo cáo, trạng thái xử lý sẽ hiện ở đây."
                action={<LinkButton to="/student/counseling/new">Đăng ký tư vấn</LinkButton>}
              />
            </div>
          ) : (
            <div className={listBox}>{recent.map((c) => <CaseRow key={c.id} item={c} portal="student" />)}</div>
          )}
        </Section>

        <Section title="Lịch hẹn sắp tới">
          {appts.isLoading ? (
            <Skeleton className="h-28" />
          ) : upcoming.length === 0 ? (
            <div className="rounded-box bg-surface-2 p-5">
              <CalendarDays className="size-6 text-ink-3" aria-hidden />
              <p className="mt-3 text-body text-ink-2">Bạn chưa có lịch hẹn nào. Khi tư vấn viên đặt lịch, bạn sẽ thấy ở đây.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 2).map((a) => (
                <li key={a.id} className="rounded-box border border-line bg-surface p-4">
                  <p className="text-caption font-medium capitalize text-brand-ink">{formatWeekday(a.scheduledAt)}, {formatDate(a.scheduledAt)}</p>
                  <p className="mt-0.5 text-h3 font-semibold text-ink">{formatTime(a.scheduledAt)}</p>
                  <p className="mt-2 text-body text-ink-2">{a.topic}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-caption text-ink-3">
                    {a.type === 'online' ? <Video className="size-3.5" aria-hidden /> : <Users className="size-3.5" aria-hidden />}
                    {MEETING_LABEL[a.type]} · với {a.counselor.name}
                  </p>
                </li>
              ))}
              <li><Link to="/student/appointments" className="text-caption font-medium text-brand-ink hover:underline">Xem tất cả lịch hẹn</Link></li>
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

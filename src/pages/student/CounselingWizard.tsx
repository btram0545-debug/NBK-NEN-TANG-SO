import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Heart, HelpCircle, Home, Laptop, Lock, Shuffle, Smile, Users, Users2, EyeOff, Flame } from 'lucide-react'
import { useCreateCounseling } from '@/data/hooks'
import { COUNSELING_CATEGORY_LABEL, MEETING_LABEL } from '@/lib/labels'
import type { CounselingCategory, CaseItem, MeetingPreference, PrivacyLevel } from '@/types'
import { StickyActions } from '@/components/StickyActions'
import { Alert, Button, Card, ChoiceCard, LinkButton, Stepper, Switch, Textarea, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'

const STEPS = ['Chủ đề', 'Chia sẻ', 'Hình thức', 'Xác nhận']
const CATEGORY_ICON: Record<CounselingCategory, typeof BookOpen> = {
  study: BookOpen,
  study_pressure: Flame,
  career: Compass,
  friends: Users2,
  family: Home,
  emotions: Heart,
  other: HelpCircle,
}
const MEETINGS: { v: MeetingPreference; d: string; icon: typeof Users }[] = [
  { v: 'in_person', d: 'Gặp tư vấn viên tại phòng tư vấn', icon: Users },
  { v: 'online', d: 'Trò chuyện qua cuộc gọi hoặc video', icon: Laptop },
  { v: 'unsure', d: 'Tư vấn viên sẽ trao đổi và gợi ý cách phù hợp', icon: Shuffle },
]
const MIN = 10

export default function CounselingWizard() {
  const toast = useToast()
  const create = useCreateCounseling()
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<CounselingCategory | null>(null)
  const [text, setText] = useState('')
  const [meeting, setMeeting] = useState<MeetingPreference>('unsure')
  const [anonymous, setAnonymous] = useState(false)
  const [privacy, setPrivacy] = useState<PrivacyLevel>('standard')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState<CaseItem | null>(null)

  const textOk = text.trim().length >= MIN
  const canNext = step === 0 ? category !== null : step === 1 ? textOk : true

  function next() {
    if (step === 1 && !textOk) return setTouched(true)
    if (canNext) setStep((s) => s + 1)
  }

  function submit() {
    if (!category) return
    create.mutate(
      { category, description: text.trim(), meeting, isAnonymous: anonymous, privacyLevel: privacy },
      {
        onSuccess: (item) => setDone(item),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa gửi được yêu cầu. Bạn thử lại nhé.'),
      },
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center animate-page">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok-ink" aria-hidden>
          <Check className="size-8" strokeWidth={2.5} />
        </div>
        <h1 className="text-h1 font-semibold text-ink">Mình đã nhận yêu cầu của bạn</h1>
        <p className="mt-2 text-body text-ink-2">Cảm ơn bạn đã tin tưởng chia sẻ. Một tư vấn viên sẽ xem và phản hồi bạn sớm nhất có thể.</p>
        <p className="mt-5 inline-block rounded-full bg-surface-2 px-4 py-1.5 text-caption text-ink-2">Mã yêu cầu: <span className="font-mono font-semibold text-ink">{done.code}</span></p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton to={`/student/counseling/${done.id}`}>Xem yêu cầu của tôi</LinkButton>
          <LinkButton to="/student" variant="secondary">Về trang chủ</LinkButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-28 lg:pb-0">
      <Link to="/student/counseling" className="mb-5 inline-flex items-center gap-1.5 text-caption font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Tư vấn học đường
      </Link>
      <Stepper steps={STEPS} current={step} />

      <div className="mt-8" key={step}>
        <div className="animate-page">
          {step === 0 && (
            <fieldset>
              <legend className="text-h1 font-semibold text-ink">Bạn muốn được hỗ trợ về điều gì?</legend>
              <p className="mt-1 text-body text-ink-2">Chọn chủ đề gần nhất với điều bạn đang nghĩ đến. Không có lựa chọn nào là sai cả.</p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {(Object.keys(COUNSELING_CATEGORY_LABEL) as CounselingCategory[]).map((k) => {
                  const I = CATEGORY_ICON[k]
                  return <ChoiceCard key={k} name="category" value={k} title={COUNSELING_CATEGORY_LABEL[k]} icon={<I className="size-[1.125rem]" />} checked={category === k} onChange={() => setCategory(k)} />
                })}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-h1 font-semibold text-ink">Bạn muốn chia sẻ điều gì?</h1>
              <p className="mt-1 mb-6 text-body text-ink-2">Bạn cứ viết theo cách của mình, không cần viết cho hay. Chỉ chia sẻ những gì bạn thấy thoải mái.</p>
              <Textarea
                label="Điều bạn muốn chia sẻ"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => setTouched(true)}
                maxLength={2000}
                rows={9}
                className="min-h-56"
                placeholder="Dạo này mình đang cảm thấy…"
                error={touched && !textOk ? `Bạn viết thêm một chút nhé (ít nhất ${MIN} ký tự) để tư vấn viên hiểu rõ hơn.` : undefined}
                hint={`${text.length}/2000 ký tự`}
              />
            </div>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="text-h1 font-semibold text-ink">Bạn muốn hình thức hỗ trợ nào?</legend>
              <p className="mt-1 text-body text-ink-2">Bạn có thể đổi ý sau khi trao đổi với tư vấn viên.</p>
              <div className="mt-6 space-y-2.5">
                {MEETINGS.map((m) => (
                  <ChoiceCard key={m.v} name="meeting" value={m.v} title={MEETING_LABEL[m.v]} description={m.d} icon={<m.icon className="size-[1.125rem]" />} checked={meeting === m.v} onChange={() => setMeeting(m.v)} />
                ))}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-h1 font-semibold text-ink">Xác nhận yêu cầu</h1>
                <p className="mt-1 text-body text-ink-2">Xem lại một lượt trước khi gửi nhé.</p>
              </div>
              <Card className="divide-y divide-line">
                <dl className="divide-y divide-line">
                  <div className="flex justify-between gap-4 p-4"><dt className="text-ink-3">Chủ đề</dt><dd className="font-medium text-ink">{category && COUNSELING_CATEGORY_LABEL[category]}</dd></div>
                  <div className="flex justify-between gap-4 p-4"><dt className="text-ink-3">Hình thức</dt><dd className="font-medium text-ink">{MEETING_LABEL[meeting]}</dd></div>
                  <div className="p-4"><dt className="text-ink-3">Nội dung</dt><dd className="mt-1 line-clamp-4 whitespace-pre-wrap text-ink">{text.trim()}</dd></div>
                </dl>
              </Card>

              <div>
                <p className="mb-2 text-caption font-medium text-ink">Mức độ riêng tư</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <ChoiceCard name="privacy" value="standard" checked={privacy === 'standard'} onChange={() => setPrivacy('standard')} icon={<Users className="size-[1.125rem]" />} title="Thông thường" description="Người phụ trách và quản sinh có thể xem để hỗ trợ bạn." />
                  <ChoiceCard name="privacy" value="restricted" checked={privacy === 'restricted'} onChange={() => setPrivacy('restricted')} icon={<Lock className="size-[1.125rem]" />} title="Riêng tư cao" description="Chỉ tư vấn viên được phân công xem nội dung." />
                </div>
              </div>

              <div className="rounded-box border border-line px-4">
                <Switch checked={anonymous} onCheckedChange={setAnonymous} label="Gửi ẩn danh" description="Người xử lý sẽ không thấy tên bạn. Bạn vẫn theo dõi được yêu cầu của mình." />
              </div>
              {anonymous && (
                <Alert kind="info" className="animate-fade-in">
                  <span className="inline-flex items-center gap-1.5"><EyeOff className="size-4" aria-hidden />Khi ẩn danh, tư vấn viên sẽ khó hẹn gặp trực tiếp hơn. Bạn vẫn có thể nhắn tin trong nền tảng.</span>
                </Alert>
              )}
              <Alert kind="privacy">Ghi chú riêng của tư vấn viên không bao giờ hiển thị cho bạn hay giáo viên khác. Nếu bạn đang gặp nguy hiểm ngay lúc này, hãy báo ngay cho thầy cô gần nhất hoặc gọi 111.</Alert>
            </div>
          )}
        </div>
      </div>

      <div className={cn('mt-8')}>
        <StickyActions>
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft className="size-4" />} disabled={create.isPending}>
              Quay lại
            </Button>
          )}
          {step < 3 ? (
            <Button size="lg" className="flex-1 lg:flex-none" onClick={next} disabled={!canNext && step !== 1}>
              Tiếp tục <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button size="lg" className="flex-1 lg:flex-none" onClick={submit} loading={create.isPending} icon={<Smile className="size-4" />}>
              Gửi yêu cầu
            </Button>
          )}
        </StickyActions>
      </div>
    </div>
  )
}

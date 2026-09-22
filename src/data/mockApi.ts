import type { Api } from './api'
import type {
  AdminOverview,
  AppNotification,
  Appointment,
  AuditRow,
  AuthUser,
  CaseDetail,
  CaseEvent,
  CaseItem,
  CaseKind,
  CaseStatus,
  CaseUpdate,
  CountRow,
  IncidentType,
  CounselingCategory,
  MeetingPreference,
  Message,
  PersonRef,
  PrivacyLevel,
  Role,
  Severity,
  Suggestion,
  SuggestionCategory,
  Thread,
  UserRow,
} from '@/types'
import { caseCode } from '@/lib/format'
import {
  COUNSELING_CATEGORY_LABEL,
  INCIDENT_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  isActiveStatus,
} from '@/lib/labels'
import { env } from '@/lib/env'

/* ------------------------------------------------------------------ *
 * Dữ liệu DEMO — không có thật, không gửi đi đâu, mất khi tải lại trang.
 * Mật khẩu demo chỉ tồn tại ở bản demo (không có Supabase).
 * ------------------------------------------------------------------ */
export const DEMO_PASSWORD = 'Demo@2026'

interface DemoUser extends AuthUser {
  code: string
}

const H = 3_600_000
const D = 24 * H
const T0 = Date.now()
const ago = (ms: number) => new Date(T0 - ms).toISOString()
const ahead = (ms: number) => new Date(T0 + ms).toISOString()

const mkUser = (
  code: string,
  fullName: string,
  role: Role,
  extra: Partial<DemoUser> = {},
): DemoUser => ({
  id: `u-${code}`,
  code,
  email: `${code}@${env.accountEmailDomain}`,
  fullName,
  role,
  isActive: true,
  ...extra,
})

const users: DemoUser[] = [
  mkUser('hs2026001', 'Nguyễn Minh Anh', 'student', { className: '11A2', studentCode: 'HS2026001', phone: '0901 234 567' }),
  mkUser('gv2026001', 'Trần Thu Hà', 'teacher', { department: 'Tổ Ngữ văn – GVCN 11A2', phone: '0912 345 678' }),
  mkUser('tv2026001', 'Lê Quốc Bảo', 'counselor', { department: 'Tổ tư vấn học đường' }),
  mkUser('qs2026001', 'Phạm Văn Long', 'supervisor', { department: 'Quản sinh' }),
  mkUser('bgh2026001', 'Nguyễn Thị Lan', 'admin', { department: 'Ban giám hiệu' }),
  mkUser('hs2026002', 'Trần Gia Bảo', 'student', { className: '10A1', studentCode: 'HS2026002' }),
  mkUser('hs2026003', 'Lê Hoàng Yến', 'student', { className: '10A3', studentCode: 'HS2026003' }),
  mkUser('hs2026004', 'Phạm Quang Huy', 'student', { className: '11A1', studentCode: 'HS2026004' }),
  mkUser('hs2026005', 'Võ Ngọc Trâm', 'student', { className: '11A3', studentCode: 'HS2026005' }),
  mkUser('hs2026006', 'Đặng Khánh Linh', 'student', { className: '12A1', studentCode: 'HS2026006' }),
  mkUser('hs2026007', 'Bùi Đức Minh', 'student', { className: '12A2', studentCode: 'HS2026007', isActive: false }),
]

export const DEMO_ACCOUNTS = users
  .filter((u) => ['hs2026001', 'gv2026001', 'tv2026001', 'qs2026001', 'bgh2026001'].includes(u.code))
  .map((u) => ({ code: u.code, name: u.fullName, role: u.role }))

const ME_KEY = 'sc-demo-user'
const students = users.filter((u) => u.role === 'student')
const findUser = (id: string | null | undefined) => users.find((u) => u.id === id)
const person = (id: string | null | undefined): PersonRef | null => {
  const u = findUser(id)
  return u ? { id: u.id, name: u.fullName, role: u.role, className: u.className } : null
}

/* ---------------- Ca (sự việc + tư vấn) ---------------- */
interface Row {
  id: string
  kind: CaseKind
  category: string
  description: string
  severity: Severity
  status: CaseStatus
  studentId: string
  isAnonymous: boolean
  privacy: PrivacyLevel
  meeting?: MeetingPreference
  location?: string
  incidentTime?: string
  involved?: string
  assigneeId: string | null
  escalated: boolean
  approved: boolean
  evidence: number
  createdAt: string
  updatedAt: string
  firstResponseHours?: number
}

const rows: Row[] = []
const events: Record<string, CaseEvent[]> = {}
const noteStore: Record<string, { id: string; authorId: string; body: string; createdAt: string }[]> = {}
const noteGrants: Record<string, string[]> = {}
const audit: AuditRow[] = []
const notifs: Record<string, AppNotification[]> = {}
const messageStore: Record<string, { id: string; senderId: string; body: string; createdAt: string }[]> = {}
const appts: Appointment[] = []
let seq = 1000
const nid = (p: string) => `${p}-${++seq}`

function ev(caseId: string, e: Omit<CaseEvent, 'id'>) {
  ;(events[caseId] ??= []).push({ id: nid('ev'), ...e })
}
function log(actorId: string, action: string, entityType: string, entityId: string | null) {
  audit.unshift({
    id: nid('au'),
    action,
    entityType,
    entityId,
    actorName: findUser(actorId)?.fullName ?? 'Hệ thống',
    createdAt: new Date().toISOString(),
  })
}
function notify(userId: string, n: Omit<AppNotification, 'id' | 'read' | 'createdAt'> & { createdAt?: string; read?: boolean }) {
  ;(notifs[userId] ??= []).unshift({ id: nid('nt'), read: false, createdAt: new Date().toISOString(), ...n })
}

function seedRow(r: Omit<Row, 'id' | 'updatedAt' | 'escalated' | 'approved' | 'evidence'> & Partial<Row>, id?: string) {
  const row: Row = {
    id: id ?? `${r.kind === 'incident' ? 'a' : 'b'}${String(++seq).padStart(5, '0')}00-0000-4000-8000-000000000000`,
    escalated: false,
    approved: false,
    evidence: 0,
    updatedAt: r.createdAt,
    ...r,
  }
  rows.push(row)
  ev(row.id, { type: 'created', label: 'Đã tiếp nhận yêu cầu', createdAt: row.createdAt })
  if (row.assigneeId) {
    const at = new Date(new Date(row.createdAt).getTime() + (row.firstResponseHours ?? 3) * H).toISOString()
    ev(row.id, { type: 'assigned', label: 'Đã phân công người phụ trách', actorRole: 'supervisor', createdAt: at })
    row.updatedAt = at
  }
  if (['in_progress', 'need_info', 'resolved', 'archived'].includes(row.status)) {
    const at = new Date(new Date(row.updatedAt).getTime() + 5 * H).toISOString()
    ev(row.id, { type: 'status', status: 'in_progress', label: 'Đang xử lý', actorRole: 'counselor', createdAt: at })
    row.updatedAt = at
  }
  if (row.status === 'need_info') {
    const at = new Date(new Date(row.updatedAt).getTime() + 8 * H).toISOString()
    ev(row.id, { type: 'status', status: 'need_info', label: 'Cần bổ sung thông tin', actorRole: 'counselor', createdAt: at })
    row.updatedAt = at
  }
  if (row.status === 'resolved' || row.status === 'archived') {
    const at = new Date(new Date(row.updatedAt).getTime() + 2 * D).toISOString()
    ev(row.id, { type: 'status', status: 'resolved', label: 'Đã xử lý', actorRole: 'counselor', createdAt: at })
    row.updatedAt = at
  }
  return row
}

// --- Các ca "có kịch bản" cho tài khoản học sinh demo (hs2026001) ---
const me1 = 'u-hs2026001'
const counselor = 'u-tv2026001'
const teacher = 'u-gv2026001'
const supervisor = 'u-qs2026001'

const c1 = seedRow(
  {
    kind: 'counseling',
    category: 'study_pressure',
    description:
      'Gần đây mình bị dồn bài kiểm tra và cả lịch học thêm nữa, tối nào cũng ngủ muộn. Mình muốn tìm cách sắp xếp lại thời gian mà không bị quá tải.',
    severity: 'normal',
    status: 'in_progress',
    studentId: me1,
    isAnonymous: false,
    privacy: 'standard',
    meeting: 'in_person',
    assigneeId: counselor,
    createdAt: ago(6 * D),
    firstResponseHours: 5,
  },
  'b1c10001-0000-4000-8000-000000000001',
)
const c2 = seedRow(
  {
    kind: 'counseling',
    category: 'career',
    description: 'Mình đang phân vân giữa khối A và khối D khi chọn nguyện vọng, muốn nghe thêm định hướng.',
    severity: 'normal',
    status: 'resolved',
    studentId: me1,
    isAnonymous: false,
    privacy: 'standard',
    meeting: 'online',
    assigneeId: counselor,
    createdAt: ago(34 * D),
  },
  'b2c20002-0000-4000-8000-000000000002',
)
const i1 = seedRow(
  {
    kind: 'incident',
    category: 'cyberbullying',
    description: 'Có một nhóm chat của lớp đang chia sẻ ảnh chụp màn hình để chế giễu một bạn. Mình muốn báo để nhà trường biết.',
    severity: 'serious',
    status: 'assigned',
    studentId: me1,
    isAnonymous: true,
    privacy: 'standard',
    location: 'Nhóm chat lớp (trực tuyến)',
    incidentTime: ago(2 * D),
    involved: 'Một số bạn trong lớp',
    assigneeId: teacher,
    evidence: 2,
    createdAt: ago(2 * D),
    firstResponseHours: 2,
  },
  'a1e10001-0000-4000-8000-000000000001',
)

noteStore[c1.id] = [
  {
    id: 'n-1',
    authorId: counselor,
    body: 'Em có lịch học thêm 5 buổi/tuần. Gợi ý cắt giảm 1–2 buổi và thử lịch ngủ cố định. Hẹn gặp lại sau 1 tuần.',
    createdAt: ago(4 * D),
  },
]
appts.push(
  {
    id: 'ap-1',
    caseId: c1.id,
    caseCode: caseCode('counseling', c1.id),
    topic: 'Áp lực học tập',
    counselor: person(counselor)!,
    student: person(me1),
    scheduledAt: ahead(1 * D + 3 * H),
    durationMinutes: 30,
    type: 'in_person',
    status: 'scheduled',
  },
  {
    id: 'ap-2',
    caseId: c2.id,
    caseCode: caseCode('counseling', c2.id),
    topic: 'Định hướng',
    counselor: person(counselor)!,
    student: person(me1),
    scheduledAt: ago(30 * D),
    durationMinutes: 30,
    type: 'online',
    meetingUrl: 'https://meet.example/demo',
    status: 'done',
  },
)
ev(c1.id, { type: 'appointment', label: 'Đã đặt lịch hẹn trực tiếp', actorRole: 'counselor', createdAt: ago(4 * D) })
messageStore[c1.id] = [
  { id: 'm-1', senderId: counselor, body: 'Chào em, cảm ơn em đã chia sẻ. Thầy đã đọc yêu cầu của em rồi nhé.', createdAt: ago(5 * D) },
  { id: 'm-2', senderId: me1, body: 'Dạ em cảm ơn thầy ạ. Em muốn hỏi là mình có thể đổi lịch sang buổi chiều được không ạ?', createdAt: ago(5 * D - 2 * H) },
  { id: 'm-3', senderId: counselor, body: 'Được em. Thầy đã đặt lịch chiều thứ Sáu, em xem trong mục Lịch hẹn nhé.', createdAt: ago(4 * D) },
]

// --- Dữ liệu sinh ngẫu nhiên (có seed) để biểu đồ có xu hướng ---
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20260921)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const INC: IncidentType[] = ['physical_violence', 'emotional_violence', 'cyberbullying', 'harassment', 'safety', 'other']
const CNS: CounselingCategory[] = ['study', 'study_pressure', 'career', 'friends', 'family', 'emotions', 'other']
const SAMPLE_DESC = [
  'Mình muốn được hỗ trợ về vấn đề này, mong nhà trường xem giúp.',
  'Sự việc xảy ra nhiều lần và mình cảm thấy không an toàn.',
  'Mình chưa biết nói với ai nên gửi lên đây.',
]
for (let w = 8; w >= 0; w--) {
  const nInc = 2 + Math.floor(rand() * 4) + (w < 3 ? 1 : 0)
  const nCns = 3 + Math.floor(rand() * 4)
  for (let k = 0; k < nInc + nCns; k++) {
    const isInc = k < nInc
    const created = ago(w * 7 * D + Math.floor(rand() * 6 * D) + 2 * H)
    const age = w * 7
    const status: CaseStatus =
      age > 14 ? pick(['resolved', 'resolved', 'archived', 'resolved']) : age > 5 ? pick(['in_progress', 'resolved', 'need_info', 'assigned']) : pick(['submitted', 'assigned', 'in_progress', 'triaging'])
    const st = pick(students.filter((s) => s.id !== me1))
    seedRow({
      kind: isInc ? 'incident' : 'counseling',
      category: isInc ? pick(INC) : pick(CNS),
      description: pick(SAMPLE_DESC),
      severity: isInc ? pick(['normal', 'normal', 'serious', 'serious', 'urgent'] as Severity[]) : pick(['normal', 'normal', 'normal', 'serious'] as Severity[]),
      status: status === 'triaging' && !isInc ? 'pending' : status === 'submitted' && !isInc ? 'pending' : status,
      studentId: st.id,
      isAnonymous: rand() < 0.3,
      privacy: !isInc && rand() < 0.25 ? 'restricted' : 'standard',
      meeting: pick(['in_person', 'online', 'unsure'] as MeetingPreference[]),
      assigneeId: ['submitted', 'pending', 'triaging'].includes(status) ? null : pick([teacher, counselor, counselor]),
      createdAt: created,
      firstResponseHours: 1 + Math.floor(rand() * 9),
    })
  }
}
// Vài ca cần chú ý ở thời điểm hiện tại
const urgent = rows.filter((r) => r.kind === 'incident' && r.severity === 'urgent' && isActiveStatus(r.status))
urgent.slice(0, 2).forEach((r) => {
  r.escalated = true
  ev(r.id, { type: 'escalated', label: 'Chuyển lên Ban giám hiệu', actorRole: 'supervisor', createdAt: r.updatedAt })
})
if (urgent.length === 0) {
  const r = seedRow({
    kind: 'incident',
    category: 'physical_violence',
    description: 'Có xô xát ở khu vực nhà xe sau giờ tan học, một bạn bị thương nhẹ.',
    severity: 'urgent',
    status: 'submitted',
    studentId: students[3].id,
    isAnonymous: false,
    privacy: 'standard',
    assigneeId: null,
    createdAt: ago(3 * H),
  })
  r.escalated = true
}

// --- Thông báo ---
notify(me1, { category: 'counseling', title: 'Lịch hẹn mới', body: 'Thầy Lê Quốc Bảo đã đặt lịch gặp trực tiếp vào chiều thứ Sáu.', link: '/student/appointments', createdAt: ago(4 * D) })
notify(me1, { category: 'counseling', title: 'Yêu cầu tư vấn đã được nhận', body: 'Tư vấn viên đã nhận yêu cầu “Áp lực học tập” của bạn.', link: `/student/counseling/${c1.id}`, createdAt: ago(5 * D), read: true })
notify(me1, { category: 'incident', title: 'Báo cáo của bạn đang được xử lý', body: 'Báo cáo bắt nạt trên mạng đã được giao cho người phụ trách.', link: `/student/incidents/${i1.id}`, createdAt: ago(2 * D) })
notify(me1, { category: 'system', title: 'Chào mừng bạn đến với nền tảng', body: 'Bạn có thể gửi yêu cầu tư vấn, báo cáo sự việc hoặc góp ý bất cứ lúc nào.', createdAt: ago(40 * D), read: true })
for (const id of [teacher, counselor]) {
  notify(id, { category: 'incident', title: 'Có ca mới được phân công', body: 'Một trường hợp mới vừa được giao cho bạn.', link: '/teacher/cases', createdAt: ago(3 * H) })
  notify(id, { category: 'appointment', title: 'Lịch hẹn ngày mai', body: 'Bạn có 1 buổi tư vấn vào chiều mai.', createdAt: ago(20 * H) })
}
notify('u-qs2026001', { category: 'incident', title: 'Có báo cáo khẩn cấp', body: 'Một báo cáo mức Khẩn cấp đang chờ phân loại.', link: '/supervisor/incidents', createdAt: ago(1 * H) })
notify('u-bgh2026001', { category: 'incident', title: 'Ca được chuyển lên Ban giám hiệu', body: 'Quản sinh đã chuyển 1 trường hợp khẩn cấp lên để xem xét.', link: '/admin/dashboard', createdAt: ago(2 * H) })
notify('u-bgh2026001', { category: 'system', title: 'Báo cáo tuần đã sẵn sàng', body: 'Số liệu tuần này đã được tổng hợp.', link: '/admin/reports', createdAt: ago(1 * D), read: true })

// --- Audit log mẫu ---
;[
  ['Đăng nhập', 'session', null, 'u-bgh2026001', 20],
  ['Phân công ca', 'incident', i1.id, 'u-qs2026001', 2 * 24],
  ['Đổi trạng thái ca', 'counseling', c1.id, counselor, 4 * 24],
  ['Tạo lịch hẹn', 'appointment', 'ap-1', counselor, 4 * 24],
  ['Chuyển ca lên BGH', 'incident', urgent[0]?.id ?? null, 'u-qs2026001', 30],
  ['Cấp quyền xem ghi chú riêng tư', 'private_note', c1.id, 'u-bgh2026001', 6 * 24],
  ['Vô hiệu hóa tài khoản', 'user', 'u-hs2026007', 'u-bgh2026001', 9 * 24],
].forEach(([a, t, id, actor, h]) => {
  audit.push({ id: nid('au'), action: a as string, entityType: t as string, entityId: id as string | null, actorName: findUser(actor as string)?.fullName ?? '—', createdAt: ago((h as number) * H) })
})
audit.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

/* ---------------- Gợi ý / Góp ý ---------------- */
interface SRow {
  id: string
  authorId: string
  title: string
  content: string
  category: SuggestionCategory
  visibility: 'private' | 'public'
  status: Suggestion['status']
  isAnonymous: boolean
  voters: Set<string>
  createdAt: string
}
const sugg: SRow[] = [
  { id: 's-1', authorId: 'u-hs2026003', title: 'Thêm máy lọc nước ở khu nhà C', content: 'Khu nhà C đông học sinh nhưng chưa có máy lọc nước, giờ ra chơi phải xuống sân rất xa.', category: 'facilities', visibility: 'public', status: 'published', isAnonymous: false, voters: new Set(['u-hs2026002', 'u-hs2026004', 'u-hs2026005', 'u-hs2026006']), createdAt: ago(5 * D) },
  { id: 's-2', authorId: 'u-hs2026005', title: 'Mở câu lạc bộ đọc sách buổi trưa', content: 'Thư viện có nhiều sách hay nhưng ít người biết. Mình đề xuất một CLB nhỏ vào giờ nghỉ trưa.', category: 'extracurricular', visibility: 'public', status: 'published', isAnonymous: true, voters: new Set(['u-hs2026001', 'u-hs2026002']), createdAt: ago(9 * D) },
  { id: 's-3', authorId: 'u-hs2026004', title: 'Căng tin bổ sung món ít dầu mỡ', content: 'Mong căng tin có thêm salad hoặc cơm ít dầu, mình thấy nhiều bạn cũng muốn.', category: 'canteen', visibility: 'public', status: 'published', isAnonymous: false, voters: new Set(['u-hs2026001', 'u-hs2026003', 'u-hs2026006']), createdAt: ago(13 * D) },
  { id: 's-4', authorId: 'u-hs2026006', title: 'Giảm số bài kiểm tra trùng tuần', content: 'Có tuần lớp mình có 4 bài kiểm tra 15 phút, rất khó ôn kỹ. Có thể phối hợp lịch giữa các môn không ạ?', category: 'teaching', visibility: 'public', status: 'resolved', isAnonymous: false, voters: new Set(['u-hs2026001', 'u-hs2026002', 'u-hs2026003', 'u-hs2026004', 'u-hs2026005']), createdAt: ago(21 * D) },
  { id: 's-5', authorId: me1, title: 'Cần thêm ghế ở hành lang tầng 2', content: 'Giờ ra chơi nhiều bạn phải ngồi bệt ở hành lang.', category: 'environment', visibility: 'private', status: 'pending', isAnonymous: false, voters: new Set(), createdAt: ago(1 * D) },
]

/* ---------------- Phiên đăng nhập demo ---------------- */
let currentId: string | null = null
try {
  currentId = sessionStorage.getItem(ME_KEY)
} catch {
  /* bộ nhớ trình duyệt bị chặn — bỏ qua */
}
const authUser = (u: DemoUser): AuthUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { code, ...rest } = u
  return rest
}
function me(): DemoUser {
  const u = users.find((x) => x.id === currentId)
  if (!u) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  return u
}
const wait = <T,>(v: T, ms = 220 + Math.random() * 220) => new Promise<T>((res) => setTimeout(() => res(v), ms))
const isStaff = (r: Role) => r !== 'student'

function project(r: Row, viewer: DemoUser): CaseItem {
  const isOwner = r.studentId === viewer.id
  const sees =
    isOwner ||
    r.assigneeId === viewer.id ||
    ((viewer.role === 'supervisor' || viewer.role === 'admin') && (r.kind === 'incident' || r.privacy === 'standard'))
  return {
    id: r.id,
    kind: r.kind,
    code: caseCode(r.kind, r.id),
    title: r.kind === 'incident' ? INCIDENT_TYPE_LABEL[r.category as IncidentType] : COUNSELING_CATEGORY_LABEL[r.category as CounselingCategory],
    category: r.category,
    severity: r.severity,
    status: r.status,
    description: sees ? r.description : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isAnonymous: r.isAnonymous,
    privacyLevel: r.privacy,
    meeting: r.meeting,
    location: sees ? (r.location ?? null) : null,
    incidentTime: r.incidentTime ?? null,
    involved: sees ? (r.involved ?? null) : null,
    reporter: isOwner ? person(r.studentId) : r.isAnonymous || !sees ? null : person(r.studentId),
    assignee: person(r.assigneeId),
    escalated: r.escalated,
    approved: r.approved,
    evidenceCount: r.evidence,
  }
}
const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)

function visibleRows(viewer: DemoUser) {
  if (viewer.role === 'supervisor' || viewer.role === 'admin') return rows
  if (viewer.role === 'teacher' || viewer.role === 'counselor') return rows.filter((r) => r.assigneeId === viewer.id)
  return rows.filter((r) => r.studentId === viewer.id)
}
const findRow = (kind: CaseKind, id: string) => {
  const r = rows.find((x) => x.id === id && x.kind === kind)
  if (!r) throw new Error('Không tìm thấy trường hợp này hoặc bạn không có quyền xem.')
  return r
}

function weekStart(iso: string) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
const count = <K extends string>(items: K[], label: (k: K) => string): CountRow[] => {
  const m = new Map<K, number>()
  items.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1))
  return [...m.entries()].map(([key, value]) => ({ key, label: label(key), value })).sort((a, b) => b.value - a.value)
}

export const mockApi: Api = {
  mode: 'demo',

  async signIn(identifier, password) {
    const id = identifier.trim().toLowerCase()
    const u = users.find((x) => x.code === id || x.email.toLowerCase() === id)
    if (!u || password !== DEMO_PASSWORD) throw new Error('Tài khoản hoặc mật khẩu chưa đúng.')
    if (!u.isActive) throw new Error('Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ nhà trường.')
    currentId = u.id
    try {
      sessionStorage.setItem(ME_KEY, u.id)
    } catch {
      /* ignore */
    }
    return wait(authUser(u), 500)
  },
  async signOut() {
    currentId = null
    try {
      sessionStorage.removeItem(ME_KEY)
    } catch {
      /* ignore */
    }
  },
  async restoreSession() {
    const u = users.find((x) => x.id === currentId)
    return u ? authUser(u) : null
  },
  async changePassword() {
    return wait(undefined)
  },
  async updateProfile(patch) {
    const u = me()
    if (patch.fullName) u.fullName = patch.fullName
    if (patch.phone !== undefined) u.phone = patch.phone
    return wait(authUser(u))
  },

  async listMyCases() {
    const v = me()
    return wait(rows.filter((r) => r.studentId === v.id).map((r) => project(r, v)).sort(byNewest))
  },
  async listStaffCases() {
    const v = me()
    if (!isStaff(v.role)) throw new Error('Bạn không có quyền xem danh sách này.')
    return wait(visibleRows(v).map((r) => project(r, v)).sort(byNewest))
  },
  async getCase(kind, id) {
    const v = me()
    const r = findRow(kind, id)
    if (!visibleRows(v).includes(r)) throw new Error('Không tìm thấy trường hợp này hoặc bạn không có quyền xem.')
    const item = project(r, v)
    const staff = isStaff(v.role)
    const canRead = r.kind === 'counseling' && (r.assigneeId === v.id || (noteGrants[r.id] ?? []).includes(v.id)) && (v.role === 'counselor' || (noteGrants[r.id] ?? []).includes(v.id))
    return wait<CaseDetail>({
      item,
      events: (events[r.id] ?? []).filter((e) => staff || e.type !== 'note').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      notes: !staff || r.kind !== 'counseling' ? [] : canRead ? (noteStore[r.id] ?? []).map((n) => ({ id: n.id, body: n.body, authorName: findUser(n.authorId)?.fullName ?? '—', createdAt: n.createdAt })) : 'locked',
      canWriteNotes: v.role === 'counselor' && r.kind === 'counseling' && r.assigneeId === v.id,
      appointments: appts.filter((a) => a.caseId === r.id),
    })
  },
  async createCounseling(input) {
    const v = me()
    const row = seedRow({ kind: 'counseling', category: input.category, description: input.description, severity: 'normal', status: 'pending', studentId: v.id, isAnonymous: input.isAnonymous, privacy: input.privacyLevel, meeting: input.meeting, assigneeId: null, createdAt: new Date().toISOString() })
    log(v.id, 'Tạo yêu cầu tư vấn', 'counseling', row.id)
    notify(v.id, { category: 'counseling', title: 'Đã nhận yêu cầu tư vấn', body: 'Nhà trường sẽ phản hồi bạn sớm nhất có thể.', link: `/student/counseling/${row.id}` })
    return wait(project(row, v), 600)
  },
  async createIncident(input) {
    const v = me()
    const row = seedRow({ kind: 'incident', category: input.type, description: input.description, severity: input.severity, status: 'submitted', studentId: v.id, isAnonymous: input.isAnonymous, privacy: 'standard', location: input.location, incidentTime: input.incidentTime, involved: input.involved, assigneeId: null, evidence: input.files.length, createdAt: new Date().toISOString() })
    log(v.id, 'Gửi báo cáo sự việc', 'incident', row.id)
    notify(v.id, { category: 'incident', title: 'Đã nhận báo cáo của bạn', body: 'Nhà trường đã ghi nhận và sẽ xử lý theo mức độ.', link: `/student/incidents/${row.id}` })
    notify(supervisor, {
      category: 'incident',
      title: input.severity === 'urgent' ? 'Có báo cáo khẩn cấp cần tiếp nhận' : 'Có báo cáo mới cần tiếp nhận',
      body: `Báo cáo ${caseCode('incident', row.id)} đang chờ phân loại và phân công.`,
      link: '/supervisor/incidents',
    })
    return wait(project(row, v), 700)
  },
  async updateCase(kind, id, patch: CaseUpdate) {
    const v = me()
    const r = findRow(kind, id)
    const power = v.role === 'supervisor' || v.role === 'admin'
    if (!power && r.assigneeId !== v.id) throw new Error('Bạn chỉ được cập nhật các trường hợp được giao cho mình.')
    const role = v.role
    if (patch.severity && power) {
      r.severity = patch.severity
    }
    if (patch.assigneeId !== undefined && (power || r.assigneeId === v.id)) {
      const target = findUser(patch.assigneeId)
      if (patch.assigneeId && (!target || !['teacher', 'counselor'].includes(target.role))) throw new Error('Chỉ có thể giao cho giáo viên hoặc tư vấn viên.')
      r.assigneeId = patch.assigneeId
      if (patch.assigneeId) {
        ev(r.id, { type: 'assigned', label: `Đã giao cho ${target!.fullName}`, actorRole: role, createdAt: new Date().toISOString() })
        if (r.status === 'pending' || r.status === 'submitted' || r.status === 'triaging') r.status = 'assigned'
        notify(patch.assigneeId, { category: kind === 'incident' ? 'incident' : 'counseling', title: 'Có ca mới được phân công', body: 'Một trường hợp mới vừa được giao cho bạn.', link: '/teacher/cases' })
        log(v.id, 'Phân công ca', kind, r.id)
      }
    }
    if (patch.status && patch.status !== r.status) {
      r.status = patch.status
      ev(r.id, { type: 'status', status: patch.status, label: STATUS_LABEL[patch.status], actorRole: role, createdAt: new Date().toISOString() })
      notify(r.studentId, { category: kind === 'incident' ? 'incident' : 'counseling', title: 'Trạng thái yêu cầu đã thay đổi', body: `Yêu cầu của bạn: ${STATUS_LABEL[patch.status]}.`, link: `/student/${kind === 'incident' ? 'incidents' : 'counseling'}/${r.id}` })
      log(v.id, 'Đổi trạng thái ca', kind, r.id)
    }
    if (patch.escalate && !r.escalated) {
      r.escalated = true
      if (r.severity !== 'urgent') r.severity = 'urgent'
      ev(r.id, { type: 'escalated', label: 'Chuyển lên Ban giám hiệu', actorRole: role, createdAt: new Date().toISOString() })
      notify('u-bgh2026001', { category: 'incident', title: 'Ca được chuyển lên Ban giám hiệu', body: 'Một trường hợp khẩn cấp đang chờ xem xét.', link: `/admin/cases/${kind}/${r.id}` })
      log(v.id, 'Chuyển ca lên BGH', kind, r.id)
    }
    if (patch.note?.trim()) {
      ev(r.id, { type: 'note', label: 'Ghi nhận hỗ trợ', detail: patch.note.trim(), actorRole: role, createdAt: new Date().toISOString() })
    }
    r.updatedAt = new Date().toISOString()
    return wait(undefined)
  },
  async approveCase(kind, id, note) {
    const v = me()
    if (v.role !== 'admin') throw new Error('Chỉ Ban giám hiệu mới có thể phê duyệt can thiệp.')
    const r = findRow(kind, id)
    r.approved = true
    ev(r.id, { type: 'approved', label: 'Ban giám hiệu đã phê duyệt phương án can thiệp', detail: note, actorRole: 'admin', createdAt: new Date().toISOString() })
    log(v.id, 'Phê duyệt can thiệp', kind, r.id)
    return wait(undefined)
  },
  async addPrivateNote(caseId, body) {
    const v = me()
    const r = rows.find((x) => x.id === caseId)
    if (!r || v.role !== 'counselor' || r.assigneeId !== v.id) throw new Error('Bạn không có quyền ghi chú riêng tư cho ca này.')
    ;(noteStore[caseId] ??= []).unshift({ id: nid('n'), authorId: v.id, body, createdAt: new Date().toISOString() })
    log(v.id, 'Thêm ghi chú riêng tư', 'private_note', caseId)
    return wait(undefined)
  },
  async listStaffMembers() {
    return wait(users.filter((u) => ['teacher', 'counselor'].includes(u.role) && u.isActive).map((u) => ({ id: u.id, name: u.fullName, role: u.role })))
  },

  async listAppointments() {
    const v = me()
    const list = appts.filter((a) => (v.role === 'student' ? a.student?.id === v.id : v.role === 'admin' || v.role === 'supervisor' ? true : a.counselor.id === v.id))
    return wait(list.map((a) => (v.role === 'student' ? a : { ...a, student: rows.find((r) => r.id === a.caseId)?.isAnonymous ? null : a.student })).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)))
  },
  async createAppointment({ caseId, scheduledAt, type, meetingUrl }) {
    const v = me()
    const r = rows.find((x) => x.id === caseId && x.kind === 'counseling')
    if (!r || (r.assigneeId !== v.id && v.role !== 'supervisor')) throw new Error('Bạn không có quyền đặt lịch cho ca này.')
    const c = person(r.assigneeId) ?? person(v.id)!
    appts.push({ id: nid('ap'), caseId, caseCode: caseCode('counseling', caseId), topic: COUNSELING_CATEGORY_LABEL[r.category as CounselingCategory], counselor: c, student: person(r.studentId), scheduledAt, durationMinutes: 30, type, meetingUrl, status: 'scheduled' })
    ev(caseId, { type: 'appointment', label: 'Đã đặt lịch hẹn', actorRole: v.role, createdAt: new Date().toISOString() })
    notify(r.studentId, { category: 'appointment', title: 'Bạn có lịch hẹn mới', body: 'Xem chi tiết trong mục Lịch hẹn.', link: '/student/appointments' })
    return wait(undefined)
  },

  async listThreads() {
    const v = me()
    const list = visibleRows(v).filter((r) => r.kind === 'counseling' && r.assigneeId && (v.role === 'student' || r.assigneeId === v.id))
    return wait(
      list.map<Thread>((r) => {
        const last = (messageStore[r.id] ?? []).slice(-1)[0]
        return {
          caseId: r.id,
          code: caseCode('counseling', r.id),
          title: COUNSELING_CATEGORY_LABEL[r.category as CounselingCategory],
          counterpart: v.role === 'student' ? (findUser(r.assigneeId)?.fullName ?? 'Tư vấn viên') : r.isAnonymous ? 'Học sinh (ẩn danh)' : (findUser(r.studentId)?.fullName ?? 'Học sinh'),
          lastMessage: last?.body,
          lastAt: last?.createdAt,
        }
      }),
    )
  },
  async listMessages(caseId) {
    const v = me()
    const r = rows.find((x) => x.id === caseId)
    if (!r || !visibleRows(v).includes(r)) throw new Error('Bạn không có quyền xem cuộc trò chuyện này.')
    return wait(
      (messageStore[caseId] ?? []).map<Message>((m) => ({ id: m.id, caseId, mine: m.senderId === v.id, senderLabel: m.senderId === v.id ? 'Bạn' : ROLE_LABEL[findUser(m.senderId)?.role ?? 'student'], body: m.body, createdAt: m.createdAt })),
      160,
    )
  },
  async sendMessage(caseId, body) {
    const v = me()
    const r = rows.find((x) => x.id === caseId)
    if (!r || !visibleRows(v).includes(r)) throw new Error('Bạn không có quyền gửi tin nhắn ở đây.')
    ;(messageStore[caseId] ??= []).push({ id: nid('m'), senderId: v.id, body, createdAt: new Date().toISOString() })
    return wait(undefined, 120)
  },

  async listSuggestions() {
    const v = me()
    return wait(
      sugg
        .filter((s) => (s.visibility === 'public' && s.status !== 'hidden') || s.authorId === v.id || v.role === 'supervisor' || v.role === 'admin')
        .map<Suggestion>((s) => ({ id: s.id, title: s.title, content: s.content, category: s.category, visibility: s.visibility, status: s.status, isAnonymous: s.isAnonymous, authorName: s.isAnonymous ? null : (findUser(s.authorId)?.fullName ?? null), votes: s.voters.size, votedByMe: s.voters.has(v.id), mine: s.authorId === v.id, createdAt: s.createdAt }))
        .sort((a, b) => b.votes - a.votes || byNewest(a, b)),
    )
  },
  async createSuggestion(input) {
    const v = me()
    sugg.unshift({ id: nid('s'), authorId: v.id, ...input, status: input.visibility === 'public' ? 'published' : 'pending', voters: new Set(), createdAt: new Date().toISOString() })
    return wait(undefined, 400)
  },
  async toggleVote(id) {
    const v = me()
    const s = sugg.find((x) => x.id === id)
    if (!s || s.visibility !== 'public') throw new Error('Góp ý này không mở bình chọn.')
    if (s.voters.has(v.id)) s.voters.delete(v.id)
    else s.voters.add(v.id)
    return wait(undefined, 80)
  },

  async listNotifications() {
    return wait([...(notifs[me().id] ?? [])].sort(byNewest), 160)
  },
  async markNotificationsRead(ids) {
    ;(notifs[me().id] ?? []).forEach((n) => {
      if (!ids || ids.includes(n.id)) n.read = true
    })
    return wait(undefined, 60)
  },

  async adminOverview() {
    const v = me()
    if (v.role !== 'admin' && v.role !== 'supervisor') throw new Error('Bạn không có quyền xem số liệu tổng hợp.')
    const inc = rows.filter((r) => r.kind === 'incident')
    const cns = rows.filter((r) => r.kind === 'counseling')
    const responded = rows.filter((r) => r.firstResponseHours !== undefined && r.assigneeId)
    const weeks: { start: Date; label: string; counseling: number; incidents: number }[] = []
    const cur = weekStart(new Date().toISOString())
    for (let i = 7; i >= 0; i--) {
      const s = new Date(cur)
      s.setDate(s.getDate() - i * 7)
      weeks.push({ start: s, label: `${String(s.getDate()).padStart(2, '0')}/${String(s.getMonth() + 1).padStart(2, '0')}`, counseling: 0, incidents: 0 })
    }
    rows.forEach((r) => {
      const t = weekStart(r.createdAt).getTime()
      const w = weeks.find((x) => x.start.getTime() === t)
      if (w) {
        if (r.kind === 'incident') w.incidents++
        else w.counseling++
      }
    })
    const grade = (r: Row) => `Khối ${(findUser(r.studentId)?.className ?? '').match(/^\d+/)?.[0] ?? '—'}`
    const attention = rows
      .filter((r) => isActiveStatus(r.status) && (r.escalated || r.severity === 'urgent' || (r.severity === 'serious' && r.kind === 'incident')))
      .sort((a, b) => Number(b.escalated) - Number(a.escalated) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((r) => project(r, v))
      .map((c) => ({ ...c, description: null, reporter: null }))
    const overview: AdminOverview = {
      totals: {
        counseling: cns.length,
        incidents: inc.length,
        active: rows.filter((r) => isActiveStatus(r.status)).length,
        urgent: rows.filter((r) => isActiveStatus(r.status) && r.severity === 'urgent').length,
        avgResponseHours: responded.length ? Math.round((responded.reduce((s, r) => s + (r.firstResponseHours ?? 0), 0) / responded.length) * 10) / 10 : 0,
      },
      trend: weeks.map(({ label, counseling, incidents }) => ({ label, counseling, incidents })),
      byType: count(inc.map((r) => r.category as IncidentType), (k) => INCIDENT_TYPE_LABEL[k]),
      byCounseling: count(cns.map((r) => r.category as CounselingCategory), (k) => COUNSELING_CATEGORY_LABEL[k]),
      byStatus: count(rows.map((r) => r.status), (k) => STATUS_LABEL[k]),
      byGrade: count(rows.map(grade), (k) => k).sort((a, b) => a.label.localeCompare(b.label)),
      attention,
    }
    return wait(overview, 400)
  },
  async listUsers() {
    if (me().role !== 'admin') throw new Error('Chỉ Ban giám hiệu mới quản lý người dùng.')
    return wait(users.map<UserRow>((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, className: u.className, isActive: u.isActive })))
  },
  async updateUser(id, patch) {
    const v = me()
    if (v.role !== 'admin') throw new Error('Chỉ Ban giám hiệu mới quản lý người dùng.')
    const u = findUser(id)
    if (!u) throw new Error('Không tìm thấy người dùng.')
    if (u.id === v.id) throw new Error('Bạn không thể thay đổi quyền hoặc trạng thái của chính mình.')
    if (patch.role) u.role = patch.role
    if (patch.isActive !== undefined) u.isActive = patch.isActive
    log(v.id, patch.role ? 'Đổi vai trò người dùng' : patch.isActive ? 'Kích hoạt tài khoản' : 'Vô hiệu hóa tài khoản', 'user', u.id)
    return wait(undefined)
  },
  async listAuditLogs() {
    if (me().role !== 'admin') throw new Error('Chỉ Ban giám hiệu mới xem được nhật ký hoạt động.')
    return wait([...audit].sort(byNewest))
  },
}

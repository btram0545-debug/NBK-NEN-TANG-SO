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
  CountRow,
  Message,
  PersonRef,
  PrivacyLevel,
  MeetingPreference,
  Role,
  Severity,
  StaffMember,
  Suggestion,
  SuggestionCategory,
  Thread,
  UserRow,
} from '@/types'
import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'
import { caseCode } from '@/lib/format'
import {
  COUNSELING_CATEGORY_LABEL,
  INCIDENT_TYPE_LABEL,
  STATUS_LABEL,
  categoryLabel,
} from '@/lib/labels'

/* ------------------------------------------------------------------ *
 * Cài đặt Api bằng Supabase. Mọi kiểm soát quyền nằm ở RLS / view / RPC
 * (xem supabase/migrations). Ở đây chỉ gọi và chuyển dữ liệu sang kiểu của giao diện.
 * ------------------------------------------------------------------ */

const sb = () => {
  if (!supabase) throw new Error('Chưa cấu hình kết nối Supabase.')
  return supabase
}

const ERRORS: [RegExp, string][] = [
  [/not_allowed|42501|row-level security|permission denied/i, 'Bạn không có quyền thực hiện thao tác này.'],
  [/not_found|P0002|PGRST116/i, 'Không tìm thấy dữ liệu, hoặc bạn không có quyền xem.'],
  [/bad_assignee/i, 'Chỉ có thể giao cho giáo viên hoặc tư vấn viên đang hoạt động.'],
  [/cannot_modify_self/i, 'Bạn không thể thay đổi quyền hoặc trạng thái của chính mình.'],
  [/need_assignee/i, 'Cần giao người phụ trách trước khi đặt lịch hẹn.'],
  [/not_votable/i, 'Góp ý này không mở bình chọn.'],
  [/Invalid login credentials/i, 'Tài khoản hoặc mật khẩu chưa đúng.'],
  [/Failed to fetch|NetworkError|network/i, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.'],
]
function fail(error: { message: string; code?: string }): never {
  const text = `${error.code ?? ''} ${error.message}`
  const hit = ERRORS.find(([re]) => re.test(text))
  if (!hit && import.meta.env.DEV) console.error(error)
  throw new Error(hit ? hit[1] : 'Có lỗi xảy ra. Vui lòng thử lại.')
}
async function q<T>(p: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await p
  if (error) fail(error)
  return data as T
}
async function run(p: PromiseLike<{ error: { message: string; code?: string } | null }>) {
  const { error } = await p
  if (error) fail(error)
}

/* ---------- Hồ sơ ---------- */
interface UserRowDb {
  id: string
  role: Role
  full_name: string | null
  student_code: string | null
  class_name: string | null
  phone: string | null
  department: string | null
  is_active: boolean
}
let profile: AuthUser | null = null

async function loadProfile(id: string, email: string): Promise<AuthUser> {
  const row = await q<UserRowDb>(sb().from('users').select('*').eq('id', id).single())
  const user: AuthUser = {
    id,
    email,
    fullName: row.full_name || email.split('@')[0],
    role: row.role, // vai trò luôn lấy từ CSDL
    studentCode: row.student_code,
    className: row.class_name,
    phone: row.phone,
    department: row.department,
    isActive: row.is_active,
  }
  profile = user
  return user
}
async function me(): Promise<AuthUser> {
  if (profile) return profile
  const { data } = await sb().auth.getUser()
  if (!data.user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  return loadProfile(data.user.id, data.user.email ?? '')
}

/* ---------- Danh bạ nhân sự (tên người phụ trách) ---------- */
interface DirRow {
  id: string
  full_name: string | null
  role: Role
}
let dirCache: { at: number; rows: DirRow[] } | null = null
async function directory(): Promise<DirRow[]> {
  if (dirCache && Date.now() - dirCache.at < 60_000) return dirCache.rows
  const rows = await q<DirRow[]>(sb().from('staff_directory').select('*'))
  dirCache = { at: Date.now(), rows }
  return rows
}
const refFrom = (dir: DirRow[], id: string | null): PersonRef | null => {
  if (!id) return null
  const d = dir.find((x) => x.id === id)
  return { id, name: d?.full_name || 'Người phụ trách', role: d?.role }
}

/* ---------- Ánh xạ ca ---------- */
interface IncidentDb {
  id: string
  incident_type: string
  severity: Severity
  status: CaseStatus
  description: string | null
  created_at: string
  updated_at: string
  is_anonymous: boolean
  assigned_to: string | null
  escalated_at: string | null
  approved_at: string | null
  location: string | null
  incident_time: string | null
  involved: string | null
  reporter_id?: string | null
  reporter_name?: string | null
  reporter_class?: string | null
  evidence_count?: number
  incident_evidence?: { count: number }[]
}
interface CounselingDb {
  id: string
  category: string
  urgency: Severity
  status: CaseStatus
  title?: string | null
  description: string | null
  created_at: string
  updated_at: string
  is_anonymous: boolean
  privacy_level: PrivacyLevel
  meeting_preference: MeetingPreference
  counselor_id: string | null
  escalated_at: string | null
  approved_at: string | null
  reporter_id?: string | null
  reporter_name?: string | null
  reporter_class?: string | null
}

const reporterOf = (r: { reporter_id?: string | null; reporter_name?: string | null; reporter_class?: string | null }, self?: AuthUser): PersonRef | null =>
  self ? { id: self.id, name: self.fullName, className: self.className } : r.reporter_id || r.reporter_name ? { id: r.reporter_id ?? null, name: r.reporter_name || 'Học sinh', className: r.reporter_class } : null

function incidentItem(r: IncidentDb, dir: DirRow[], self?: AuthUser): CaseItem {
  return {
    id: r.id,
    kind: 'incident',
    code: caseCode('incident', r.id),
    title: INCIDENT_TYPE_LABEL[r.incident_type as keyof typeof INCIDENT_TYPE_LABEL] ?? r.incident_type,
    category: r.incident_type,
    severity: r.severity,
    status: r.status,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isAnonymous: r.is_anonymous,
    location: r.location,
    incidentTime: r.incident_time,
    involved: r.involved,
    reporter: reporterOf(r, self),
    assignee: refFrom(dir, r.assigned_to),
    escalated: Boolean(r.escalated_at),
    approved: Boolean(r.approved_at),
    evidenceCount: r.evidence_count ?? r.incident_evidence?.[0]?.count ?? 0,
  }
}
function counselingItem(r: CounselingDb, dir: DirRow[], self?: AuthUser): CaseItem {
  return {
    id: r.id,
    kind: 'counseling',
    code: caseCode('counseling', r.id),
    title: COUNSELING_CATEGORY_LABEL[r.category as keyof typeof COUNSELING_CATEGORY_LABEL] ?? r.category,
    category: r.category,
    severity: r.urgency,
    status: r.status,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isAnonymous: r.is_anonymous,
    privacyLevel: r.privacy_level,
    meeting: r.meeting_preference,
    reporter: reporterOf(r, self),
    assignee: refFrom(dir, r.counselor_id),
    escalated: Boolean(r.escalated_at),
    approved: Boolean(r.approved_at),
    evidenceCount: 0,
  }
}
const newest = (a: CaseItem, b: CaseItem) => b.createdAt.localeCompare(a.createdAt)

const INCIDENT_COLS =
  'id, incident_type, severity, status, description, created_at, updated_at, is_anonymous, assigned_to, escalated_at, approved_at, location, incident_time, involved'
const COUNSELING_COLS =
  'id, category, urgency, status, description, created_at, updated_at, is_anonymous, privacy_level, meeting_preference, counselor_id, escalated_at, approved_at'

/* ---------- Tệp bằng chứng ---------- */
const safeName = (n: string) => n.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80)

export const supabaseApi: Api = {
  mode: 'supabase',

  async signIn(identifier, password) {
    const raw = identifier.trim()
    const email = raw.includes('@') ? raw : `${raw.toLowerCase()}@${env.accountEmailDomain}`
    const { data, error } = await sb().auth.signInWithPassword({ email, password })
    if (error || !data.user) throw new Error('Tài khoản hoặc mật khẩu chưa đúng.')
    try {
      const user = await loadProfile(data.user.id, data.user.email ?? email)
      if (!user.isActive) throw new Error('Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ nhà trường.')
      return user
    } catch (e) {
      await sb().auth.signOut()
      profile = null
      throw e
    }
  },
  async signOut() {
    profile = null
    dirCache = null
    await sb().auth.signOut()
  },
  async restoreSession() {
    const { data } = await sb().auth.getSession()
    const u = data.session?.user
    if (!u) return null
    try {
      const user = await loadProfile(u.id, u.email ?? '')
      return user.isActive ? user : null
    } catch {
      return null
    }
  },
  async changePassword(newPassword) {
    await run(sb().auth.updateUser({ password: newPassword }))
  },
  async updateProfile(patch) {
    const u = await me()
    const row = await q<UserRowDb>(
      sb().from('users').update({ ...(patch.fullName ? { full_name: patch.fullName } : {}), ...(patch.phone !== undefined ? { phone: patch.phone } : {}) }).eq('id', u.id).select('*').single(),
    )
    profile = { ...u, fullName: row.full_name || u.fullName, phone: row.phone }
    return profile
  },

  async listMyCases() {
    const u = await me()
    const dir = await directory()
    const [inc, cns] = await Promise.all([
      q<IncidentDb[]>(sb().from('incidents').select(`${INCIDENT_COLS}, incident_evidence(count)`).order('created_at', { ascending: false })),
      q<CounselingDb[]>(sb().from('counseling_requests').select(COUNSELING_COLS).order('created_at', { ascending: false })),
    ])
    return [...inc.map((r) => incidentItem(r, dir, u)), ...cns.map((r) => counselingItem(r, dir, u))].sort(newest)
  },
  async listStaffCases() {
    const dir = await directory()
    const [inc, cns] = await Promise.all([
      q<IncidentDb[]>(sb().from('staff_incidents').select('*').order('created_at', { ascending: false })),
      q<CounselingDb[]>(sb().from('staff_counseling').select('*').order('created_at', { ascending: false })),
    ])
    return [...inc.map((r) => incidentItem(r, dir)), ...cns.map((r) => counselingItem(r, dir))].sort(newest)
  },
  async getCase(kind, id) {
    const u = await me()
    const dir = await directory()
    const student = u.role === 'student'
    let item: CaseItem
    if (kind === 'incident') {
      const r = await q<IncidentDb>(
        student
          ? sb().from('incidents').select(`${INCIDENT_COLS}, incident_evidence(count)`).eq('id', id).single()
          : sb().from('staff_incidents').select('*').eq('id', id).single(),
      )
      item = incidentItem(r, dir, student ? u : undefined)
    } else {
      const r = await q<CounselingDb>(
        sb().from(student ? 'counseling_requests' : 'staff_counseling').select(student ? COUNSELING_COLS : '*').eq('id', id).single(),
      )
      item = counselingItem(r, dir, student ? u : undefined)
    }
    interface EventDb {
      id: string
      event_type: CaseEvent['type']
      status: CaseStatus | null
      label: string
      detail: string | null
      actor_role: Role | null
      created_at: string
    }
    const [evs, appts, notes] = await Promise.all([
      q<EventDb[]>(sb().from('case_events').select('*').eq('case_kind', kind).eq('case_id', id).order('created_at', { ascending: true })),
      kind === 'counseling' ? supabaseApi.listAppointments().then((a) => a.filter((x) => x.caseId === id)) : Promise.resolve([] as Appointment[]),
      !student && kind === 'counseling'
        ? q<{ locked: boolean; notes: { id: string; body: string; authorName: string; createdAt: string }[] }>(sb().rpc('get_private_notes', { p_id: id }))
        : Promise.resolve(null),
    ])
    return {
      item,
      events: evs.map<CaseEvent>((e) => ({ id: e.id, type: e.event_type, status: e.status ?? undefined, label: e.label, detail: e.detail ?? undefined, actorRole: e.actor_role ?? undefined, createdAt: e.created_at })),
      notes: notes ? (notes.locked ? 'locked' : notes.notes) : [],
      canWriteNotes: u.role === 'counselor' && kind === 'counseling' && item.assignee?.id === u.id,
      appointments: appts,
    } satisfies CaseDetail
  },
  async createCounseling(input) {
    const u = await me()
    const dir = await directory()
    const row = await q<CounselingDb>(
      sb().from('counseling_requests').insert({ student_id: u.id, category: input.category, description: input.description, is_anonymous: input.isAnonymous, privacy_level: input.privacyLevel, meeting_preference: input.meeting }).select(COUNSELING_COLS).single(),
    )
    return counselingItem(row, dir, u)
  },
  async createIncident(input) {
    const u = await me()
    const dir = await directory()
    const id = crypto.randomUUID()
    await run(
      sb().from('incidents').insert({ id, reporter_id: u.id, incident_type: input.type, severity: input.severity, description: input.description, location: input.location || null, incident_time: input.incidentTime ? new Date(input.incidentTime).toISOString() : null, involved: input.involved || null, is_anonymous: input.isAnonymous }),
    )
    let failed = 0
    for (const file of input.files) {
      const path = `incidents/${id}/${crypto.randomUUID()}-${safeName(file.name)}`
      const up = await sb().storage.from('evidence').upload(path, file, { contentType: file.type || undefined, upsert: false })
      if (up.error) {
        failed++
        continue
      }
      // encrypted=false: chưa mã hóa ở mức ứng dụng; dựa vào mã hóa lưu trữ của nhà cung cấp.
      const ins = await sb().from('incident_evidence').insert({ incident_id: id, storage_path: path, file_type: file.type, file_size: file.size, encrypted: false })
      if (ins.error) failed++
    }
    const row = await q<IncidentDb>(sb().from('incidents').select(`${INCIDENT_COLS}, incident_evidence(count)`).eq('id', id).single())
    const item = incidentItem(row, dir, u)
    return failed ? { ...item, warning: `Báo cáo đã được gửi nhưng ${failed} tệp đính kèm chưa tải lên được.` } : item
  },
  async updateCase(kind: CaseKind, id, patch) {
    await run(
      sb().rpc('staff_update_case', {
        p_kind: kind,
        p_id: id,
        p_status: patch.status ?? null,
        p_severity: patch.severity ?? null,
        p_assignee: patch.assigneeId ?? null,
        p_set_assignee: patch.assigneeId !== undefined,
        p_escalate: Boolean(patch.escalate),
        p_note: patch.note ?? null,
      }),
    )
  },
  async approveCase(kind, id, note) {
    await run(sb().rpc('approve_intervention', { p_kind: kind, p_id: id, p_note: note ?? null }))
  },
  async addPrivateNote(caseId, body) {
    await run(sb().rpc('add_private_note', { p_id: caseId, p_body: body }))
  },
  async listStaffMembers() {
    const dir = await directory()
    return dir.filter((d) => d.role === 'teacher' || d.role === 'counselor').map<StaffMember>((d) => ({ id: d.id, name: d.full_name || 'Chưa đặt tên', role: d.role }))
  },

  async listAppointments() {
    interface ApRow {
      id: string
      request_id: string
      topic: string
      counselor_id: string
      counselor_name: string | null
      student_name: string | null
      scheduled_at: string
      duration_minutes: number
      meeting_type: MeetingPreference
      meeting_url: string | null
      status: Appointment['status']
    }
    const rows = await q<ApRow[]>(sb().rpc('list_my_appointments'))
    return rows.map<Appointment>((r) => ({
      id: r.id,
      caseId: r.request_id,
      caseCode: caseCode('counseling', r.request_id),
      topic: categoryLabel('counseling', r.topic),
      counselor: { id: r.counselor_id, name: r.counselor_name || 'Tư vấn viên' },
      student: r.student_name ? { id: null, name: r.student_name } : null,
      scheduledAt: r.scheduled_at,
      durationMinutes: r.duration_minutes,
      type: r.meeting_type,
      meetingUrl: r.meeting_url,
      status: r.status,
    }))
  },
  async createAppointment({ caseId, scheduledAt, type, meetingUrl }) {
    await run(sb().rpc('create_appointment', { p_request: caseId, p_at: scheduledAt, p_type: type, p_url: meetingUrl ?? null }))
  },

  async listThreads() {
    interface ThRow {
      request_id: string
      category: string
      counterpart: string
      last_message: string | null
      last_at: string | null
    }
    const rows = await q<ThRow[]>(sb().rpc('list_threads'))
    return rows.map<Thread>((r) => ({ caseId: r.request_id, code: caseCode('counseling', r.request_id), title: categoryLabel('counseling', r.category), counterpart: r.counterpart, lastMessage: r.last_message ?? undefined, lastAt: r.last_at ?? undefined }))
  },
  async listMessages(caseId) {
    const u = await me()
    const rows = await q<{ id: string; sender_id: string; sender_kind: 'student' | 'staff'; body: string; created_at: string }[]>(
      sb().from('messages').select('*').eq('counseling_request_id', caseId).order('created_at', { ascending: true }),
    )
    return rows.map<Message>((m) => ({ id: m.id, caseId, mine: m.sender_id === u.id, senderLabel: m.sender_id === u.id ? 'Bạn' : m.sender_kind === 'student' ? 'Học sinh' : 'Tư vấn viên', body: m.body, createdAt: m.created_at }))
  },
  async sendMessage(caseId, body) {
    const u = await me()
    await run(sb().from('messages').insert({ counseling_request_id: caseId, sender_id: u.id, body }))
  },

  async listSuggestions() {
    interface SgRow {
      id: string
      title: string
      content: string
      category: SuggestionCategory
      visibility: 'private' | 'public'
      status: Suggestion['status']
      is_anonymous: boolean
      author_name: string | null
      votes: number
      voted_by_me: boolean
      mine: boolean
      created_at: string
    }
    const rows = await q<SgRow[]>(sb().from('suggestion_feed').select('*'))
    return rows
      .map<Suggestion>((s) => ({ id: s.id, title: s.title, content: s.content, category: s.category, visibility: s.visibility, status: s.status, isAnonymous: s.is_anonymous, authorName: s.author_name, votes: s.votes, votedByMe: s.voted_by_me, mine: s.mine, createdAt: s.created_at }))
      .sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt))
  },
  async createSuggestion(input) {
    const u = await me()
    await run(sb().from('suggestions').insert({ author_id: u.id, title: input.title, content: input.content, category: input.category, visibility: input.visibility, is_anonymous: input.isAnonymous }))
  },
  async toggleVote(id) {
    await run(sb().rpc('toggle_suggestion_vote', { p_id: id }))
  },

  async listNotifications() {
    const rows = await q<{ id: string; category: AppNotification['category']; title: string; body: string; link: string | null; read_at: string | null; created_at: string }[]>(
      sb().from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
    )
    return rows.map<AppNotification>((n) => ({ id: n.id, category: n.category, title: n.title, body: n.body, link: n.link, read: Boolean(n.read_at), createdAt: n.created_at }))
  },
  async markNotificationsRead(ids) {
    const u = await me()
    let query = sb().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', u.id).is('read_at', null)
    if (ids) query = query.in('id', ids)
    await run(query)
  },

  async adminOverview() {
    interface Raw {
      totals: AdminOverview['totals']
      trend: AdminOverview['trend']
      byType: { key: string; value: number }[]
      byCounseling: { key: string; value: number }[]
      byStatus: { key: string; value: number }[]
      byGrade: { key: string; value: number }[]
      attention: { id: string; kind: CaseKind; category: string; severity: Severity; status: CaseStatus; createdAt: string; updatedAt: string; escalated: boolean }[]
    }
    const raw = await q<Raw>(sb().rpc('admin_overview', { p_weeks: 8 }))
    const label = (rows: { key: string; value: number }[], f: (k: string) => string): CountRow[] => rows.map((r) => ({ key: r.key, label: f(r.key), value: r.value }))
    return {
      totals: raw.totals,
      trend: raw.trend,
      byType: label(raw.byType, (k) => categoryLabel('incident', k)),
      byCounseling: label(raw.byCounseling, (k) => categoryLabel('counseling', k)),
      byStatus: label(raw.byStatus, (k) => STATUS_LABEL[k as CaseStatus] ?? k),
      byGrade: label(raw.byGrade, (k) => (k === '—' ? 'Chưa rõ khối' : `Khối ${k}`)),
      // Tổng quan chỉ có siêu dữ liệu, không có nội dung hay danh tính.
      attention: raw.attention.map<CaseItem>((a) => ({
        id: a.id,
        kind: a.kind,
        code: caseCode(a.kind, a.id),
        title: categoryLabel(a.kind, a.category),
        category: a.category,
        severity: a.severity,
        status: a.status,
        description: null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        isAnonymous: true,
        reporter: null,
        assignee: null,
        escalated: a.escalated,
        approved: false,
        evidenceCount: 0,
      })),
    } satisfies AdminOverview
  },
  async listUsers() {
    const rows = await q<{ id: string; full_name: string | null; email: string; role: Role; class_name: string | null; is_active: boolean }[]>(sb().rpc('admin_list_users'))
    return rows.map<UserRow>((r) => ({ id: r.id, fullName: r.full_name || r.email, email: r.email, role: r.role, className: r.class_name, isActive: r.is_active }))
  },
  async updateUser(id, patch) {
    await run(sb().rpc('admin_set_user', { p_id: id, p_role: patch.role ?? null, p_active: patch.isActive ?? null }))
  },
  async listAuditLogs() {
    const rows = await q<{ id: string; action: string; entity_type: string; entity_id: string | null; actor_name: string; created_at: string }[]>(sb().rpc('admin_audit_logs', { p_limit: 200 }))
    return rows.map<AuditRow>((r) => ({ id: r.id, action: r.action, entityType: r.entity_type, entityId: r.entity_id, actorName: r.actor_name, createdAt: r.created_at }))
  },
}

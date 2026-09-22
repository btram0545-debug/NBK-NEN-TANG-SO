export type Role = 'student' | 'teacher' | 'counselor' | 'supervisor' | 'admin'
/** Cổng làm việc (route prefix). counselor dùng chung cổng với teacher. */
export type Portal = 'student' | 'teacher' | 'supervisor' | 'admin'

export type Severity = 'normal' | 'serious' | 'urgent'
export type CaseKind = 'incident' | 'counseling'
export type CaseStatus =
  | 'pending'
  | 'submitted'
  | 'triaging'
  | 'assigned'
  | 'in_progress'
  | 'need_info'
  | 'resolved'
  | 'archived'

export type IncidentType =
  | 'physical_violence'
  | 'emotional_violence'
  | 'cyberbullying'
  | 'harassment'
  | 'safety'
  | 'other'

export type CounselingCategory =
  | 'study'
  | 'study_pressure'
  | 'career'
  | 'friends'
  | 'family'
  | 'emotions'
  | 'other'

export type SuggestionCategory =
  | 'facilities'
  | 'teaching'
  | 'extracurricular'
  | 'canteen'
  | 'environment'
  | 'other'

export type MeetingPreference = 'in_person' | 'online' | 'unsure'
/** standard: quản sinh/BGH thấy nội dung để hỗ trợ; restricted: chỉ tư vấn viên được phân công. */
export type PrivacyLevel = 'standard' | 'restricted'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  studentCode?: string | null
  className?: string | null
  phone?: string | null
  department?: string | null
  isActive: boolean
}

export interface PersonRef {
  id: string | null
  name: string
  role?: Role
  className?: string | null
}

export interface CaseItem {
  id: string
  kind: CaseKind
  code: string
  title: string
  category: string
  severity: Severity
  status: CaseStatus
  /** null = người xem không có quyền đọc nội dung (vd. học sinh chọn riêng tư cao). */
  description: string | null
  createdAt: string
  updatedAt: string
  isAnonymous: boolean
  privacyLevel?: PrivacyLevel
  meeting?: MeetingPreference
  location?: string | null
  incidentTime?: string | null
  involved?: string | null
  reporter: PersonRef | null
  assignee: PersonRef | null
  escalated: boolean
  approved: boolean
  evidenceCount: number
}

export interface CaseEvent {
  id: string
  type: 'created' | 'assigned' | 'status' | 'escalated' | 'approved' | 'appointment' | 'note'
  status?: CaseStatus
  label: string
  /** Nội dung ghi nhận nội bộ (chỉ nhân sự thấy). */
  detail?: string
  actorRole?: Role
  createdAt: string
}

export interface PrivateNote {
  id: string
  body: string
  authorName: string
  createdAt: string
}

export interface Appointment {
  id: string
  caseId: string
  caseCode: string
  topic: string
  counselor: PersonRef
  student: PersonRef | null
  scheduledAt: string
  durationMinutes: number
  type: MeetingPreference
  meetingUrl?: string | null
  status: 'scheduled' | 'done' | 'cancelled'
}

export interface CaseDetail {
  item: CaseItem
  events: CaseEvent[]
  /** 'locked' = người xem không được cấp quyền đọc ghi chú riêng tư. */
  notes: PrivateNote[] | 'locked'
  canWriteNotes: boolean
  appointments: Appointment[]
}

export interface Thread {
  caseId: string
  code: string
  title: string
  counterpart: string
  lastMessage?: string
  lastAt?: string
}

export interface Message {
  id: string
  caseId: string
  mine: boolean
  senderLabel: string
  body: string
  createdAt: string
}

export interface Suggestion {
  id: string
  title: string
  content: string
  category: SuggestionCategory
  visibility: 'private' | 'public'
  status: 'pending' | 'published' | 'hidden' | 'resolved'
  isAnonymous: boolean
  authorName: string | null
  votes: number
  votedByMe: boolean
  mine: boolean
  createdAt: string
}

export interface AppNotification {
  id: string
  category: 'counseling' | 'incident' | 'appointment' | 'system'
  title: string
  body: string
  link?: string | null
  read: boolean
  createdAt: string
}

export interface CountRow {
  key: string
  label: string
  value: number
}

export interface AdminOverview {
  totals: {
    counseling: number
    incidents: number
    active: number
    urgent: number
    avgResponseHours: number
  }
  trend: { label: string; counseling: number; incidents: number }[]
  byType: CountRow[]
  byCounseling: CountRow[]
  byStatus: CountRow[]
  byGrade: CountRow[]
  attention: CaseItem[]
}

export interface StaffMember {
  id: string
  name: string
  role: Role
}

export interface UserRow {
  id: string
  fullName: string
  email: string
  role: Role
  className?: string | null
  isActive: boolean
}

export interface AuditRow {
  id: string
  action: string
  entityType: string
  entityId: string | null
  actorName: string
  createdAt: string
}

export interface CounselingInput {
  category: CounselingCategory
  description: string
  meeting: MeetingPreference
  isAnonymous: boolean
  privacyLevel: PrivacyLevel
}

export interface IncidentInput {
  type: IncidentType
  severity: Severity
  description: string
  incidentTime?: string
  location?: string
  involved?: string
  isAnonymous: boolean
  files: File[]
}

export interface SuggestionInput {
  title: string
  content: string
  category: SuggestionCategory
  visibility: 'private' | 'public'
  isAnonymous: boolean
}

export interface CaseUpdate {
  status?: CaseStatus
  severity?: Severity
  assigneeId?: string | null
  escalate?: boolean
  note?: string
}

export interface CaseFilter {
  kind?: CaseKind
}

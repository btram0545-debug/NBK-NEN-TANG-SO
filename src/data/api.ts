import type {
  AdminOverview,
  AppNotification,
  Appointment,
  AuditRow,
  AuthUser,
  CaseDetail,
  CaseItem,
  CaseKind,
  CaseUpdate,
  CounselingInput,
  IncidentInput,
  MeetingPreference,
  Message,
  Role,
  StaffMember,
  Suggestion,
  SuggestionInput,
  Thread,
  UserRow,
} from '@/types'

/**
 * Hợp đồng dữ liệu duy nhất mà giao diện được phép dùng.
 * Có 2 cách cài đặt: supabaseApi (dữ liệu thật + RLS) và mockApi (demo, trong bộ nhớ).
 * Quyền truy cập luôn được kiểm tra ở phía dữ liệu (RLS / RPC), giao diện chỉ ẩn/hiện.
 */
export interface Api {
  mode: 'demo' | 'supabase'

  signIn(identifier: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
  restoreSession(): Promise<AuthUser | null>
  changePassword(newPassword: string): Promise<void>
  updateProfile(patch: { fullName?: string; phone?: string }): Promise<AuthUser>

  listMyCases(): Promise<CaseItem[]>
  listStaffCases(): Promise<CaseItem[]>
  getCase(kind: CaseKind, id: string): Promise<CaseDetail>
  createCounseling(input: CounselingInput): Promise<CaseItem>
  createIncident(input: IncidentInput): Promise<CaseItem & { warning?: string }>
  updateCase(kind: CaseKind, id: string, patch: CaseUpdate): Promise<void>
  approveCase(kind: CaseKind, id: string, note?: string): Promise<void>
  addPrivateNote(caseId: string, body: string): Promise<void>
  listStaffMembers(): Promise<StaffMember[]>

  listAppointments(): Promise<Appointment[]>
  createAppointment(input: {
    caseId: string
    scheduledAt: string
    type: MeetingPreference
    meetingUrl?: string
  }): Promise<void>

  listThreads(): Promise<Thread[]>
  listMessages(caseId: string): Promise<Message[]>
  sendMessage(caseId: string, body: string): Promise<void>

  listSuggestions(): Promise<Suggestion[]>
  createSuggestion(input: SuggestionInput): Promise<void>
  toggleVote(id: string): Promise<void>

  listNotifications(): Promise<AppNotification[]>
  markNotificationsRead(ids?: string[]): Promise<void>

  adminOverview(): Promise<AdminOverview>
  listUsers(): Promise<UserRow[]>
  updateUser(id: string, patch: { role?: Role; isActive?: boolean }): Promise<void>
  listAuditLogs(): Promise<AuditRow[]>
}

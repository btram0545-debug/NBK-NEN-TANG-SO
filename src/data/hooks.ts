import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/data'
import type { CaseKind, CaseUpdate, CounselingInput, IncidentInput, MeetingPreference, Role, SuggestionInput } from '@/types'

export const qk = {
  myCases: ['cases', 'mine'] as const,
  staffCases: ['cases', 'staff'] as const,
  case: (kind: CaseKind, id: string) => ['case', kind, id] as const,
  staff: ['staff'] as const,
  appointments: ['appointments'] as const,
  threads: ['threads'] as const,
  messages: (caseId: string) => ['messages', caseId] as const,
  suggestions: ['suggestions'] as const,
  notifications: ['notifications'] as const,
  overview: ['admin', 'overview'] as const,
  users: ['admin', 'users'] as const,
  audit: ['admin', 'audit'] as const,
}

export const useMyCases = () => useQuery({ queryKey: qk.myCases, queryFn: () => api.listMyCases() })
export const useStaffCases = () => useQuery({ queryKey: qk.staffCases, queryFn: () => api.listStaffCases() })
export const useCase = (kind: CaseKind, id: string) => useQuery({ queryKey: qk.case(kind, id), queryFn: () => api.getCase(kind, id) })
export const useStaffMembers = () => useQuery({ queryKey: qk.staff, queryFn: () => api.listStaffMembers() })
export const useAppointments = () => useQuery({ queryKey: qk.appointments, queryFn: () => api.listAppointments() })
export const useThreads = () => useQuery({ queryKey: qk.threads, queryFn: () => api.listThreads() })
export const useMessages = (caseId: string | undefined) =>
  useQuery({ queryKey: qk.messages(caseId ?? ''), queryFn: () => api.listMessages(caseId!), enabled: Boolean(caseId), refetchInterval: 15_000 })
export const useSuggestions = () => useQuery({ queryKey: qk.suggestions, queryFn: () => api.listSuggestions() })
export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: () => api.listNotifications(), refetchInterval: 60_000 })
export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: () => api.adminOverview() })
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => api.listUsers() })
export const useAuditLogs = () => useQuery({ queryKey: qk.audit, queryFn: () => api.listAuditLogs() })

/** Sau khi ghi dữ liệu: làm mới các danh sách có thể đã đổi. */
function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: readonly (readonly unknown[])[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })))
}

export function useCreateCounseling() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (i: CounselingInput) => api.createCounseling(i), onSuccess: () => inv(qk.myCases, qk.notifications) })
}
export function useCreateIncident() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (i: IncidentInput) => api.createIncident(i), onSuccess: () => inv(qk.myCases, qk.notifications) })
}
export function useUpdateCase(kind: CaseKind, id: string) {
  const inv = useInvalidate()
  return useMutation({
    mutationFn: (p: CaseUpdate) => api.updateCase(kind, id, p),
    onSuccess: () => inv(qk.case(kind, id), qk.staffCases, qk.overview, qk.notifications),
  })
}
/** Cập nhật ca từ danh sách (không cần biết trước kind/id khi khai báo hook). */
export function useUpdateAnyCase() {
  const inv = useInvalidate()
  return useMutation({
    mutationFn: (v: { kind: CaseKind; id: string; patch: CaseUpdate }) => api.updateCase(v.kind, v.id, v.patch),
    onSuccess: (_d, v) => inv(qk.case(v.kind, v.id), qk.staffCases, qk.overview, qk.notifications),
  })
}
export function useApprove(kind: CaseKind, id: string) {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (note?: string) => api.approveCase(kind, id, note), onSuccess: () => inv(qk.case(kind, id), qk.staffCases, qk.overview, qk.audit) })
}
export function useAddNote(kind: CaseKind, id: string) {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (body: string) => api.addPrivateNote(id, body), onSuccess: () => inv(qk.case(kind, id)) })
}
export function useCreateAppointment(kind: CaseKind, id: string) {
  const inv = useInvalidate()
  return useMutation({
    mutationFn: (v: { scheduledAt: string; type: MeetingPreference; meetingUrl?: string }) => api.createAppointment({ caseId: id, ...v }),
    onSuccess: () => inv(qk.case(kind, id), qk.appointments, qk.notifications),
  })
}
export function useSendMessage(caseId: string) {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (body: string) => api.sendMessage(caseId, body), onSuccess: () => inv(qk.messages(caseId), qk.threads) })
}
export function useCreateSuggestion() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (i: SuggestionInput) => api.createSuggestion(i), onSuccess: () => inv(qk.suggestions) })
}
export function useToggleVote() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (id: string) => api.toggleVote(id), onSuccess: () => inv(qk.suggestions) })
}
export function useMarkRead() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (ids?: string[]) => api.markNotificationsRead(ids), onSuccess: () => inv(qk.notifications) })
}
export function useUpdateUser() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { id: string; patch: { role?: Role; isActive?: boolean } }) => api.updateUser(v.id, v.patch), onSuccess: () => inv(qk.users, qk.audit) })
}

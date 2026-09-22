import type {
  CaseStatus,
  CounselingCategory,
  IncidentType,
  MeetingPreference,
  Role,
  Severity,
  SuggestionCategory,
} from '@/types'

export type Tone = 'neutral' | 'brand' | 'teal' | 'ok' | 'warn' | 'danger'

export const ROLE_LABEL: Record<Role, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  counselor: 'Tư vấn viên',
  supervisor: 'Quản sinh',
  admin: 'Ban giám hiệu',
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  pending: 'Chờ tiếp nhận',
  submitted: 'Mới tiếp nhận',
  triaging: 'Đang phân loại',
  assigned: 'Đã phân công',
  in_progress: 'Đang xử lý',
  need_info: 'Cần bổ sung',
  resolved: 'Đã xử lý',
  archived: 'Đã lưu trữ',
}

export const STATUS_TONE: Record<CaseStatus, Tone> = {
  pending: 'warn',
  submitted: 'warn',
  triaging: 'brand',
  assigned: 'brand',
  in_progress: 'teal',
  need_info: 'warn',
  resolved: 'ok',
  archived: 'neutral',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  normal: 'Bình thường',
  serious: 'Nghiêm trọng',
  urgent: 'Khẩn cấp',
}
export const SEVERITY_TONE: Record<Severity, Tone> = { normal: 'neutral', serious: 'warn', urgent: 'danger' }

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  physical_violence: 'Bạo lực thể chất',
  emotional_violence: 'Bạo lực tinh thần',
  cyberbullying: 'Bắt nạt trên mạng',
  harassment: 'Quấy rối',
  safety: 'Vấn đề an toàn',
  other: 'Khác',
}

export const COUNSELING_CATEGORY_LABEL: Record<CounselingCategory, string> = {
  study: 'Học tập',
  study_pressure: 'Áp lực học tập',
  career: 'Định hướng',
  friends: 'Quan hệ bạn bè',
  family: 'Gia đình',
  emotions: 'Cảm xúc cá nhân',
  other: 'Khó khăn khác',
}

export const SUGGESTION_CATEGORY_LABEL: Record<SuggestionCategory, string> = {
  facilities: 'Cơ sở vật chất',
  teaching: 'Dạy và học',
  extracurricular: 'Hoạt động ngoại khóa',
  canteen: 'Căng tin',
  environment: 'Môi trường học đường',
  other: 'Khác',
}

export const MEETING_LABEL: Record<MeetingPreference, string> = {
  in_person: 'Trực tiếp',
  online: 'Online',
  unsure: 'Chưa biết',
}

/** Nhãn thể loại của một ca (sự việc hoặc tư vấn). */
export function categoryLabel(kind: 'incident' | 'counseling', key: string) {
  const map = (kind === 'incident' ? INCIDENT_TYPE_LABEL : COUNSELING_CATEGORY_LABEL) as Record<string, string>
  return map[key] ?? key
}

export const ACTIVE_STATUSES: CaseStatus[] = ['pending', 'submitted', 'triaging', 'assigned', 'in_progress', 'need_info']
export const isActiveStatus = (s: CaseStatus) => ACTIVE_STATUSES.includes(s)

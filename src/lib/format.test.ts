import { describe, expect, it } from 'vitest'
import { caseCode, initials, isSameDay, relativeTime } from './format'
import { ACTIVE_STATUSES, INCIDENT_TYPE_LABEL, ROLE_LABEL, STATUS_LABEL, STATUS_TONE, isActiveStatus } from './labels'

describe('format', () => {
  it('initials lấy chữ cái đầu của họ tên cuối theo cách người Việt gọi', () => {
    expect(initials('Nguyễn Minh Anh')).toBe('MA')
    expect(initials('An')).toBe('AN')
    expect(initials('   ')).toBe('?')
  })
  it('caseCode tạo mã dễ đọc theo loại ca', () => {
    expect(caseCode('incident', 'a1b2c3d4-0000')).toBe('BC-A1B2C3')
    expect(caseCode('counseling', 'a1b2c3d4-0000')).toBe('TV-A1B2C3')
  })
  it('relativeTime dùng tiếng Việt và chuyển sang ngày tháng khi quá 7 ngày', () => {
    const now = Date.now()
    expect(relativeTime(new Date(now - 10_000).toISOString(), now)).toBe('Vừa xong')
    expect(relativeTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toMatch(/giờ/)
    expect(relativeTime(new Date(now - 30 * 86_400_000).toISOString(), now)).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
  it('isSameDay so sánh theo ngày', () => {
    expect(isSameDay('2026-09-21T01:00:00', '2026-09-21T23:00:00')).toBe(true)
    expect(isSameDay('2026-09-21T01:00:00', '2026-09-22T01:00:00')).toBe(false)
  })
})

describe('labels', () => {
  it('mọi trạng thái đều có nhãn và tông màu', () => {
    for (const s of Object.keys(STATUS_LABEL)) expect(STATUS_TONE[s as keyof typeof STATUS_TONE]).toBeDefined()
  })
  it('trạng thái đang xử lý khác trạng thái đã xong', () => {
    expect(ACTIVE_STATUSES.every(isActiveStatus)).toBe(true)
    expect(isActiveStatus('resolved')).toBe(false)
    expect(isActiveStatus('archived')).toBe(false)
  })
  it('có đủ 5 vai trò và 6 loại sự việc', () => {
    expect(Object.keys(ROLE_LABEL)).toHaveLength(5)
    expect(Object.keys(INCIDENT_TYPE_LABEL)).toHaveLength(6)
  })
})

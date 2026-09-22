import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, mockApi as api } from './mockApi'

const as = (code: string) => api.signIn(code, DEMO_PASSWORD)
afterEach(() => api.signOut())

describe('đăng nhập demo', () => {
  it('từ chối mật khẩu sai và tài khoản bị vô hiệu hóa', async () => {
    await expect(api.signIn('hs2026001', 'sai')).rejects.toThrow(/chưa đúng/)
    await expect(api.signIn('hs2026007', DEMO_PASSWORD)).rejects.toThrow(/vô hiệu hóa/)
  })
  it('khôi phục phiên sau khi đăng nhập', async () => {
    await as('hs2026001')
    expect((await api.restoreSession())?.role).toBe('student')
  })
})

describe('phân quyền (giao diện demo phản ánh đúng RLS ở cơ sở dữ liệu)', () => {
  let anonymousIncidentId = ''
  beforeAll(async () => {
    await as('hs2026001')
    const mine = await api.listMyCases()
    anonymousIncidentId = mine.find((c) => c.kind === 'incident' && c.isAnonymous)!.id
    await api.signOut()
  })

  it('học sinh chỉ xem ca của mình và không gọi được danh sách nhân sự', async () => {
    await as('hs2026001')
    const mine = await api.listMyCases()
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((c) => c.reporter?.name === 'Nguyễn Minh Anh')).toBe(true)
    await expect(api.listStaffCases()).rejects.toThrow(/không có quyền/)
    await expect(api.adminOverview()).rejects.toThrow()
    await expect(api.listUsers()).rejects.toThrow()
  })

  it('học sinh khác không mở được ca của người khác', async () => {
    await as('hs2026002')
    await expect(api.getCase('incident', anonymousIncidentId)).rejects.toThrow(/không có quyền|Không tìm thấy/)
  })

  it('giáo viên chỉ thấy các ca được giao cho mình', async () => {
    await as('gv2026001')
    const list = await api.listStaffCases()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((c) => c.assignee?.name === 'Trần Thu Hà')).toBe(true)
  })

  it('người báo cáo ẩn danh không bị lộ danh tính cho quản sinh', async () => {
    await as('qs2026001')
    const detail = await api.getCase('incident', anonymousIncidentId)
    expect(detail.item.reporter).toBeNull()
  })

  it('ghi chú riêng tư: quản sinh và học sinh không đọc/ghi được', async () => {
    await as('qs2026001')
    const list = await api.listStaffCases()
    const counseling = list.find((c) => c.kind === 'counseling' && c.assignee)!
    await expect(api.addPrivateNote(counseling.id, 'thử ghi')).rejects.toThrow(/không có quyền/)
    const d = await api.getCase('counseling', counseling.id)
    expect(d.notes).toBe('locked')
    expect(d.canWriteNotes).toBe(false)
  })

  it('chỉ Ban giám hiệu phê duyệt và quản lý người dùng', async () => {
    await as('qs2026001')
    const list = await api.listStaffCases()
    await expect(api.approveCase(list[0].kind, list[0].id)).rejects.toThrow(/Ban giám hiệu/)
    await expect(api.listAuditLogs()).rejects.toThrow()
    await api.signOut()
    await as('bgh2026001')
    expect((await api.listUsers()).length).toBeGreaterThan(5)
    const me = (await api.restoreSession())!
    await expect(api.updateUser(me.id, { role: 'student' })).rejects.toThrow(/chính mình/)
  })

  it('học sinh không tự đổi được trạng thái ca của mình', async () => {
    await as('hs2026001')
    const mine = await api.listMyCases()
    await expect(api.updateCase(mine[0].kind, mine[0].id, { status: 'resolved' })).rejects.toThrow(/được giao/)
  })

  it('gửi yêu cầu tư vấn tạo ca mới ở trạng thái chờ tiếp nhận', async () => {
    await as('hs2026001')
    const before = (await api.listMyCases()).length
    const item = await api.createCounseling({ category: 'study', description: 'Cần tư vấn cách học', meeting: 'unsure', isAnonymous: false, privacyLevel: 'standard' })
    expect(item.status).toBe('pending')
    expect((await api.listMyCases()).length).toBe(before + 1)
  })
})

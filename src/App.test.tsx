import { afterEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockApi } from '@/data/mockApi'
import { renderApp } from '@/test/renderApp'

afterEach(async () => {
  await mockApi.signOut()
  sessionStorage.clear()
})

describe('điều hướng và bảo vệ route', () => {
  it('chưa đăng nhập thì chuyển về trang đăng nhập', async () => {
    renderApp('/student')
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('kiểm tra biểu mẫu đăng nhập trước khi gửi', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Bạn nhập email hoặc mã tài khoản nhé.')).toBeInTheDocument()
    expect(screen.getByText('Bạn nhập mật khẩu nhé.')).toBeInTheDocument()
  })

  it('báo lỗi rõ ràng khi sai mật khẩu', async () => {
    renderApp('/login')
    await userEvent.type(await screen.findByLabelText('Email hoặc mã tài khoản'), 'hs2026001')
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'sai-mat-khau')
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tài khoản hoặc mật khẩu chưa đúng.')
  })

  it('học sinh đăng nhập vào không gian học sinh', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: /Học sinh/ }))
    expect(await screen.findByText('Bạn cần hỗ trợ điều gì?')).toBeInTheDocument()
  })

  it('học sinh gõ đường dẫn của Ban giám hiệu sẽ bị đưa về trang của mình', async () => {
    await mockApi.signIn('hs2026001', 'Demo@2026')
    renderApp('/admin/users')
    expect(await screen.findByText('Bạn cần hỗ trợ điều gì?')).toBeInTheDocument()
    expect(screen.queryByText('Người dùng')).not.toBeInTheDocument()
  })

  it('Ban giám hiệu thấy trung tâm điều hành với mục Cần chú ý', async () => {
    await mockApi.signIn('bgh2026001', 'Demo@2026')
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'Trung tâm điều hành' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Cần chú ý')).toBeInTheDocument())
  })

  it('đăng ký tư vấn: không cho tiếp tục khi chưa chọn chủ đề', async () => {
    await mockApi.signIn('hs2026001', 'Demo@2026')
    renderApp('/student/counseling/new')
    const next = await screen.findByRole('button', { name: /Tiếp tục/ })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByLabelText(/Áp lực học tập/))
    expect(next).toBeEnabled()
  })
})

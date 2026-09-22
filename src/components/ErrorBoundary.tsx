import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('Lỗi giao diện:', error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="text-h1 font-semibold text-ink">Có lỗi xảy ra</h1>
          <p className="text-body text-ink-2">Trang gặp sự cố ngoài ý muốn. Bạn thử tải lại trang nhé. Nội dung bạn đã gửi trước đó không bị ảnh hưởng.</p>
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </div>
      </div>
    )
  }
}

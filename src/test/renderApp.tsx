import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthProvider'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { ThemeProvider } from '@/lib/theme'

export function renderApp(route = '/', ui?: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          <TooltipProvider>
            <ToastProvider>
              <AuthProvider>{ui ?? <App />}</AuthProvider>
            </ToastProvider>
          </TooltipProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

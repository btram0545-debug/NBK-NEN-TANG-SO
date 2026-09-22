import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from '@/auth/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { ThemeProvider } from '@/lib/theme'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <TooltipProvider>
              <ToastProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </ToastProvider>
            </TooltipProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

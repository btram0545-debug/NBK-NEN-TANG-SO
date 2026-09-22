import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RedirectHome, RequirePortal } from '@/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/ui'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Appointments from '@/pages/shared/Appointments'
import CaseDetail from '@/pages/shared/CaseDetail'
import Messages from '@/pages/shared/Messages'
import Notifications from '@/pages/shared/Notifications'
import Profile from '@/pages/shared/Profile'
import CaseList from '@/pages/student/CaseList'
import CounselingWizard from '@/pages/student/CounselingWizard'
import StudentDashboard from '@/pages/student/Dashboard'
import IncidentForm from '@/pages/student/IncidentForm'
import Suggestions from '@/pages/student/Suggestions'
import StaffCases from '@/pages/staff/StaffCases'
import TeacherDashboard from '@/pages/staff/TeacherDashboard'
import AuditLogs from '@/pages/admin/AuditLogs'
import Settings from '@/pages/admin/Settings'
import Users from '@/pages/admin/Users'

// Các trang có biểu đồ (Recharts) nạp theo yêu cầu để giảm dung lượng tải ban đầu.
const SupervisorDashboard = lazy(() => import('@/pages/staff/SupervisorDashboard'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const Reports = lazy(() => import('@/pages/admin/Reports'))

const Lazy = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<LoadingState />}>{children}</Suspense>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectHome />} />
      <Route path="/login" element={<Login />} />

      <Route path="/student" element={<RequirePortal portal="student" />}>
        <Route element={<AppShell />}>
          <Route index element={<StudentDashboard />} />
          <Route path="counseling" element={<CaseList kind="counseling" />} />
          <Route path="counseling/new" element={<CounselingWizard />} />
          <Route path="counseling/:id" element={<CaseDetail kind="counseling" />} />
          <Route path="incidents" element={<CaseList kind="incident" />} />
          <Route path="incidents/new" element={<IncidentForm />} />
          <Route path="incidents/:id" element={<CaseDetail kind="incident" />} />
          <Route path="suggestions" element={<Suggestions />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/teacher" element={<RequirePortal portal="teacher" />}>
        <Route element={<AppShell />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="cases" element={<StaffCases />} />
          <Route path="cases/:kind/:id" element={<CaseDetail />} />
          <Route path="schedule" element={<Appointments title="Lịch làm việc" />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/supervisor" element={<RequirePortal portal="supervisor" />}>
        <Route element={<AppShell />}>
          <Route index element={<Lazy><SupervisorDashboard /></Lazy>} />
          <Route path="incidents" element={<StaffCases kind="incident" />} />
          <Route path="incidents/:id" element={<CaseDetail kind="incident" />} />
          <Route path="cases" element={<StaffCases kind="counseling" />} />
          <Route path="cases/:id" element={<CaseDetail kind="counseling" />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/admin" element={<RequirePortal portal="admin" />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Lazy><AdminDashboard /></Lazy>} />
          <Route path="reports" element={<Lazy><Reports /></Lazy>} />
          <Route path="users" element={<Users />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="cases/:kind/:id" element={<CaseDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

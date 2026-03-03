import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAuthProvider, useSuperAuth } from './portals/superadmin/SuperAuthContext';
import { Loader2 } from 'lucide-react';

// ── Public ───────────────────────────────────────────────────
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Bursar ───────────────────────────────────────────────────
import AppLayout from './layouts/AppLayout';
import DailyOperations from './pages/DailyOperations';
import CollectPayment from './pages/CollectPayment';
import StudentFeeCard from './pages/StudentFeeCard';
import StudentEnrollment from './pages/StudentEnrollment';
import CashBook from './pages/CashBook';
import ClassCollection from './pages/ClassCollection';
import DefaultersList from './pages/DefaultersList';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

// ── Accountant ───────────────────────────────────────────────
import AccountantLayout from './portals/accountant/AccountantLayout';
import AccountantOverview from './portals/accountant/Overview';
import Reconciliation from './portals/accountant/Reconciliation';
import ExpenseApproval from './portals/accountant/ExpenseApproval';
import FullLedger from './portals/accountant/FullLedger';
import AuditLog from './portals/accountant/AuditLog';
import AccountantReports from './portals/accountant/Reports';

// ── Principal ────────────────────────────────────────────────
import PrincipalLayout from './portals/principal/PrincipalLayout';
import ExecutiveSummary from './portals/principal/ExecutiveSummary';
import FeeCollection from './portals/principal/FeeCollection';
import Expenditure from './portals/principal/Expenditure';
import StudentOverview from './portals/principal/StudentOverview';
import PrincipalReports from './portals/principal/PrincipalReports';

// ── Admin ────────────────────────────────────────────────────
import AdminLayout from './portals/admin/AdminLayout';
import AdminDashboard from './portals/admin/AdminDashboard';
import UserManagement from './portals/admin/UserManagement';
import SystemSettings from './portals/admin/SystemSettings';
import Notifications from './portals/admin/Notifications';
import SchoolSetup from './portals/admin/SchoolSetup';
import InvoiceManagement from './portals/admin/InvoiceManagement';
import PaymentApprovals from './portals/accountant/PaymentApprovals';

// ── Parent ───────────────────────────────────────────────────
import ParentPortal from './portals/parent/ParentPortal';

// ── SuperAdmin ───────────────────────────────────────────────
import SuperAdminLogin from './portals/superadmin/SuperAdminLogin';
import SuperAdminLayout from './portals/superadmin/SuperAdminLayout';
import SuperDashboard from './portals/superadmin/SuperDashboard';
import SchoolManagement from './portals/superadmin/SchoolManagement';
import EmailLog from './portals/superadmin/EmailLog';
import SuperAdminManagement from './portals/superadmin/SuperAdminManagement';

const ROLE_HOME = {
  bursar: '/app', accountant: '/accountant', principal: '/principal',
  admin: '/admin', parent: '/parent',
};

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
    </div>
  );
}

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/app'} replace />;
  return children;
}

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || '/app'} replace />;
  return children;
}

function SuperGuard({ children }) {
  const { admin, loading } = useSuperAuth();
  if (loading) return <Spinner />;
  if (!admin) return <Navigate to="/superadmin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <SuperAuthProvider>
        <AuthProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Bursar (/app) ── */}
            <Route path="/app" element={<Guard roles={['bursar', 'admin']}><AppLayout /></Guard>}>
              <Route index element={<DailyOperations />} />
              <Route path="collect" element={<CollectPayment />} />
              <Route path="invoices" element={<InvoiceManagement />} />
              <Route path="approvals" element={<PaymentApprovals />} />
              <Route path="student" element={<StudentFeeCard />} />
              <Route path="enrollment" element={<StudentEnrollment />} />
              <Route path="cashbook" element={<CashBook />} />
              <Route path="class" element={<ClassCollection />} />
              <Route path="defaulters" element={<DefaultersList />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* ── Accountant ── */}
            <Route path="/accountant" element={<Guard roles={['accountant', 'admin', 'bursar']}><AccountantLayout /></Guard>}>
              <Route index element={<AccountantOverview />} />
              <Route path="invoices" element={<InvoiceManagement />} />
              <Route path="approvals" element={<PaymentApprovals />} />
              <Route path="reconciliation" element={<Reconciliation />} />
              <Route path="expenses" element={<ExpenseApproval />} />
              <Route path="ledger" element={<FullLedger />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="reports" element={<AccountantReports />} />
            </Route>

            {/* ── Principal ── */}
            <Route path="/principal" element={<Guard roles={['principal', 'admin']}><PrincipalLayout /></Guard>}>
              <Route index element={<ExecutiveSummary />} />
              <Route path="collection" element={<FeeCollection />} />
              <Route path="expenses" element={<Expenditure />} />
              <Route path="students" element={<StudentOverview />} />
              <Route path="reports" element={<PrincipalReports />} />
            </Route>

            {/* ── Admin & Shared Settings ── */}
            <Route path="/admin" element={<Guard roles={['admin', 'accountant', 'bursar', 'principal', 'parent']}><AdminLayout /></Guard>}>
              <Route index element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
              <Route path="enrollment" element={<Guard roles={['admin']}><StudentEnrollment /></Guard>} />
              <Route path="users" element={<Guard roles={['admin']}><UserManagement /></Guard>} />
              <Route path="notifications" element={<Guard roles={['admin', 'accountant']}><Notifications /></Guard>} />
              <Route path="invoices" element={<Guard roles={['admin', 'accountant', 'bursar']}><InvoiceManagement /></Guard>} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="setup" element={<Guard roles={['admin']}><SchoolSetup /></Guard>} />
            </Route>

            {/* ── Parent ── */}
            <Route path="/parent" element={<Guard roles={['parent']}><ParentPortal /></Guard>} />

            {/* ── SuperAdmin ── */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin" element={<SuperGuard><SuperAdminLayout /></SuperGuard>}>
              <Route index element={<SuperDashboard />} />
              <Route path="schools" element={<SchoolManagement />} />
              <Route path="admins" element={<SuperAdminManagement />} />
              <Route path="emails" element={<EmailLog />} />
            </Route>

            {/* Legacy redirects for old bursar paths */}
            <Route path="/collect" element={<Navigate to="/app/collect" replace />} />
            <Route path="/student" element={<Navigate to="/app/student" replace />} />
            <Route path="/cashbook" element={<Navigate to="/app/cashbook" replace />} />
            <Route path="/class" element={<Navigate to="/app/class" replace />} />
            <Route path="/defaulters" element={<Navigate to="/app/defaulters" replace />} />
            <Route path="/enrollment" element={<Navigate to="/app/enrollment" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </SuperAuthProvider>
    </BrowserRouter>
  );
}

import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FoodDiscoveryPage } from './pages/public/FoodDiscoveryPage';
import { FoodDetailsPage } from './pages/public/FoodDetailsPage';
import { ImpactPage } from './pages/public/ImpactPage';
import { FoodSafetyPage } from './pages/public/FoodSafetyPage';
import { AboutPage } from './pages/public/AboutPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { HelpPage } from './pages/public/HelpPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyAccountPage } from './pages/auth/VerifyAccountPage';

// Donor Pages
import { DonorDashboardPage } from './pages/donor/DonorDashboardPage';
import { DonationsListPage } from './pages/donor/DonationsListPage';
import { CreateDonationPage } from './pages/donor/CreateDonationPage';
import { DonationDetailsPage } from './pages/donor/DonationDetailsPage';
import { DonorRescuesPage } from './pages/donor/DonorRescuesPage';
import { DonorAnalyticsPage } from './pages/donor/DonorAnalyticsPage';
import { DonorProfilePage } from './pages/donor/DonorProfilePage';

// Recipient Pages
import { RecipientDashboardPage } from './pages/recipient/RecipientDashboardPage';
import { AvailableFoodPage } from './pages/recipient/AvailableFoodPage';
import { RecipientFoodDetailsPage } from './pages/recipient/RecipientFoodDetailsPage';
import { AcceptedRescuesPage } from './pages/recipient/AcceptedRescuesPage';
import { RecipientRescueDetailsPage } from './pages/recipient/RecipientRescueDetailsPage';
import { RecipientNeedsPage } from './pages/recipient/RecipientNeedsPage';
import { RecipientProfilePage } from './pages/recipient/RecipientProfilePage';
import { RecipientImpactPage } from './pages/recipient/RecipientImpactPage';

// Volunteer Pages
import { VolunteerDashboardPage } from './pages/volunteer/VolunteerDashboardPage';
import { AvailableTasksPage } from './pages/volunteer/AvailableTasksPage';
import { MyTasksPage } from './pages/volunteer/MyTasksPage';
import { TaskHistoryPage } from './pages/volunteer/TaskHistoryPage';
import { VolunteerProfilePage } from './pages/volunteer/VolunteerProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { VerificationQueuePage } from './pages/admin/VerificationQueuePage';
import { OrganizationDirectoryPage } from './pages/admin/OrganizationDirectoryPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DonationManagementPage } from './pages/admin/DonationManagementPage';
import { RescueOperationsPage } from './pages/admin/RescueOperationsPage';
import { IncidentReportsPage } from './pages/admin/IncidentReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { PlatformSettingsPage } from './pages/admin/PlatformSettingsPage';

// Shared Authenticated Pages
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { UserProfilePage } from './pages/shared/UserProfilePage';
import { UserSettingsPage } from './pages/shared/UserSettingsPage';
import { SocketProvider } from './context/SocketContext';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0e1a19',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '56px',
              padding: '12px 24px',
              boxShadow: 'rgba(0, 0, 0, 0.04) 1px 0px 9px 2px',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
        />
        <Routes>
        {/* Public Marketing & Informational Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/food" element={<FoodDiscoveryPage />} />
          <Route path="/food/:id" element={<FoodDetailsPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/food-safety" element={<FoodSafetyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-account" element={<VerifyAccountPage />} />
        </Route>

        {/* Authenticated Application Shell Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Donor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['DONOR', 'ADMIN']} />}>
              <Route path="/donor/dashboard" element={<DonorDashboardPage />} />
              <Route path="/donor/donations" element={<DonationsListPage />} />
              <Route path="/donor/donations/create" element={<CreateDonationPage />} />
              <Route path="/donor/donations/:id" element={<DonationDetailsPage />} />
              <Route path="/donor/rescues" element={<DonorRescuesPage />} />
              <Route path="/donor/analytics" element={<DonorAnalyticsPage />} />
              <Route path="/donor/profile" element={<DonorProfilePage />} />
            </Route>

            {/* Recipient NGO Routes */}
            <Route element={<ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']} />}>
              <Route path="/recipient/dashboard" element={<RecipientDashboardPage />} />
              <Route path="/recipient/food" element={<AvailableFoodPage />} />
              <Route path="/recipient/food/:id" element={<RecipientFoodDetailsPage />} />
              <Route path="/recipient/rescues" element={<AcceptedRescuesPage />} />
              <Route path="/recipient/rescues/:id" element={<RecipientRescueDetailsPage />} />
              <Route path="/recipient/needs" element={<RecipientNeedsPage />} />
              <Route path="/recipient/profile" element={<RecipientProfilePage />} />
              <Route path="/recipient/impact" element={<RecipientImpactPage />} />
            </Route>

            {/* Volunteer Courier Routes */}
            <Route element={<ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']} />}>
              <Route path="/volunteer/dashboard" element={<VolunteerDashboardPage />} />
              <Route path="/volunteer/tasks" element={<AvailableTasksPage />} />
              <Route path="/volunteer/my-tasks" element={<MyTasksPage />} />
              <Route path="/volunteer/history" element={<TaskHistoryPage />} />
              <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
            </Route>

            {/* Platform Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/verification" element={<VerificationQueuePage />} />
              <Route path="/admin/organizations" element={<OrganizationDirectoryPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/donations" element={<DonationManagementPage />} />
              <Route path="/admin/rescues" element={<RescueOperationsPage />} />
              <Route path="/admin/reports" element={<IncidentReportsPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<PlatformSettingsPage />} />
            </Route>

            {/* Shared Authenticated Routes */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/settings" element={<UserSettingsPage />} />
          </Route>
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { RoleProvider, useRole } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { ToastContainer } from './components/common/UIComponents';

import { LoginPage } from './components/auth/LoginPage';

import { AdminLayout } from './components/layout/AdminLayout';
import { PortalLayout } from './components/layout/PortalLayout';

import { AdminDashboardView } from './components/admin/Dashboard/AdminDashboardView';
import { POTrackerMain } from './components/admin/POTracker/POTrackerMain';
import { ProjectsView } from './components/admin/Projects/ProjectsView';
import { InvoicesView } from './components/admin/Invoices/InvoicesView';
import { OnboardingDashboard } from './components/admin/Onboarding/OnboardingDashboard';
import { EmployeesView } from './components/admin/Employees/EmployeesView';
import { SalaryStructuresView } from './components/admin/Salary/SalaryStructuresView';
import { TimesheetAdminView } from './components/admin/Timesheets/TimesheetAdminView';
import { ReportsView } from './components/admin/Reports/ReportsView';

import { CandidateOnboardingForm } from './components/candidate/CandidateOnboardingForm';

import { PortalDashboard } from './components/portal/PortalDashboard';
import { PortalProfile } from './components/portal/PortalProfile';
import { PortalPayslips } from './components/portal/PortalPayslips';
import { PortalSalary } from './components/portal/PortalSalary';
import { PortalTimesheets } from './components/portal/PortalTimesheets';

import { ProfileAccountView } from './components/profile/ProfileAccountView';
import { SettingsView } from './components/settings/SettingsView';

import { UserRole, UserProfile } from './types/roles';

export function AppContent() {
  const { switchRole } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [candidateToken, setCandidateToken] = useState<string | null>(null);

  useEffect(() => {
    // Check URL search params for candidate token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setCandidateToken(token);
    }
  }, []);

  // CANDIDATE PORTAL DIRECT ROUTE
  if (candidateToken) {
    return <CandidateOnboardingForm token={candidateToken} />;
  }

  // 1. LOGIN SCREEN (Default Primary View)
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(role: UserRole) => {
          switchRole(role);
          setIsAuthenticated(true);
          if (role === 'Employee') {
            setCurrentTab('portal-dashboard');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  // 2. EMPLOYEE PORTAL ROUTE GROUP
  if (currentTab.startsWith('portal')) {
    return (
      <PortalLayout currentTab={currentTab} onNavigate={setCurrentTab}>
        {currentTab === 'portal' || currentTab === 'portal-dashboard' ? (
          <PortalDashboard onNavigate={setCurrentTab} />
        ) : currentTab === 'portal-profile' ? (
          <PortalProfile />
        ) : currentTab === 'portal-payslips' ? (
          <PortalPayslips />
        ) : currentTab === 'portal-salary' ? (
          <PortalSalary />
        ) : currentTab === 'portal-timesheets' ? (
          <PortalTimesheets />
        ) : (
          <PortalDashboard onNavigate={setCurrentTab} />
        )}
      </PortalLayout>
    );
  }

  // 3. ADMIN APPLICATION ROUTE GROUP
  return (
    <AdminLayout
      currentTab={currentTab}
      onNavigate={setCurrentTab}
      onSignOut={handleSignOut}
    >
      {currentTab === 'dashboard' && <AdminDashboardView onNavigate={setCurrentTab} />}
      {currentTab === 'po-tracker' && <POTrackerMain onNavigate={setCurrentTab} />}
      {currentTab === 'projects' && <ProjectsView />}
      {currentTab === 'invoices' && <InvoicesView />}
      {currentTab === 'documents' && <POTrackerMain onNavigate={setCurrentTab} />}
      {currentTab === 'assignments' && <POTrackerMain onNavigate={setCurrentTab} />}
      {currentTab === 'onboarding' && <OnboardingDashboard />}
      {currentTab === 'joining-pipeline' && <OnboardingDashboard />}
      {currentTab === 'profile-requests' && <ProfileAccountView />}
      {currentTab === 'employees' && <EmployeesView />}
      {currentTab === 'salary-structures' && <SalaryStructuresView />}
      {currentTab === 'timesheets' && <TimesheetAdminView />}
      {currentTab === 'reports' && <ReportsView />}
      {currentTab === 'profile' && <ProfileAccountView />}
      {currentTab === 'notifications' && <AdminDashboardView onNavigate={setCurrentTab} />}
      {currentTab === 'settings' && <SettingsView />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <RoleProvider>
        <DataProvider>
          <AppContent />
          <ToastContainer />
        </DataProvider>
      </RoleProvider>
    </NotificationProvider>
  );
}

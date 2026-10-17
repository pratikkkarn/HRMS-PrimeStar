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
import { ProformaInvoicesView } from './components/admin/ProformaInvoices/ProformaInvoicesView';
import { DocumentsView } from './components/admin/Documents/DocumentsView';
import { AssignmentsView } from './components/admin/Assignments/AssignmentsView';
import { OnboardingDashboard } from './components/admin/Onboarding/OnboardingDashboard';
import { ProfileRequestsView } from './components/admin/ProfileRequests/ProfileRequestsView';
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
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [candidateToken, setCandidateToken] = useState<string | null>(null);

  const handleNavigate = (tab: string, params?: any) => {
    setCurrentTab(tab);
    setNavigationParams(params || null);
  };

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
      <PortalLayout currentTab={currentTab} onNavigate={handleNavigate}>
        {currentTab === 'portal' || currentTab === 'portal-dashboard' ? (
          <PortalDashboard onNavigate={handleNavigate} />
        ) : currentTab === 'portal-profile' ? (
          <PortalProfile />
        ) : currentTab === 'portal-payslips' ? (
          <PortalPayslips />
        ) : currentTab === 'portal-salary' ? (
          <PortalSalary />
        ) : currentTab === 'portal-timesheets' ? (
          <PortalTimesheets />
        ) : (
          <PortalDashboard onNavigate={handleNavigate} />
        )}
      </PortalLayout>
    );
  }

  // 3. ADMIN APPLICATION ROUTE GROUP
  return (
    <AdminLayout
      currentTab={currentTab}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    >
      {currentTab === 'dashboard' && <AdminDashboardView onNavigate={handleNavigate} />}
      {currentTab === 'po-tracker' && (
        <POTrackerMain
          onNavigate={handleNavigate}
          initialStatusFilter={navigationParams?.statusFilter}
          initialProjectFilter={navigationParams?.projectFilter}
          selectedPoId={navigationParams?.poId}
          highlightEmployeeId={navigationParams?.highlightEmployeeId}
          initialTab={navigationParams?.initialTab}
        />
      )}
      {currentTab === 'projects' && (
        <ProjectsView
          onNavigate={handleNavigate}
          initialStatusFilter={navigationParams?.statusFilter}
        />
      )}
      {currentTab === 'invoices' && <InvoicesView />}
      {currentTab === 'proforma-invoices' && (
        <ProformaInvoicesView
          onNavigate={handleNavigate}
          initialPoId={navigationParams?.poId}
          highlightEmployeeId={navigationParams?.highlightEmployeeId}
        />
      )}
      {currentTab === 'documents' && (
        <DocumentsView
          onNavigate={handleNavigate}
          initialTypeFilter={navigationParams?.typeFilter}
          initialStatusFilter={navigationParams?.statusFilter}
        />
      )}
      {currentTab === 'assignments' && <AssignmentsView />}
      {currentTab === 'onboarding' && (
        <OnboardingDashboard
          onNavigate={handleNavigate}
          initialStatusFilter={navigationParams?.statusFilter}
        />
      )}
      {currentTab === 'joining-pipeline' && (
        <OnboardingDashboard
          onNavigate={handleNavigate}
          initialTab="joining-pipeline"
          initialStatusFilter={navigationParams?.statusFilter}
        />
      )}
      {currentTab === 'profile-requests' && <ProfileRequestsView />}
      {currentTab === 'employees' && <EmployeesView />}
      {currentTab === 'salary-structures' && <SalaryStructuresView />}
      {currentTab === 'timesheets' && <TimesheetAdminView />}
      {currentTab === 'reports' && <ReportsView onNavigate={handleNavigate} />}
      {currentTab === 'profile' && <ProfileAccountView />}
      {currentTab === 'notifications' && <AdminDashboardView onNavigate={handleNavigate} />}
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

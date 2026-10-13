import React, { useState, useEffect } from 'react';
import { RoleProvider } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { ToastContainer } from './components/common/UIComponents';

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

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('po-tracker');
  const [candidateToken, setCandidateToken] = useState<string | null>(null);

  useEffect(() => {
    // Check URL search params for token or path
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setCandidateToken(token);
    }
  }, []);

  // CANDIDATE PORTAL ROUTE
  if (candidateToken) {
    return <CandidateOnboardingForm token={candidateToken} />;
  }

  // EMPLOYEE PORTAL ROUTE GROUP
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

  // ADMIN APPLICATION ROUTE GROUP
  return (
    <AdminLayout currentTab={currentTab} onNavigate={setCurrentTab}>
      {currentTab === 'dashboard' && <AdminDashboardView onNavigate={setCurrentTab} />}
      {currentTab === 'po-tracker' && <POTrackerMain />}
      {currentTab === 'projects' && <ProjectsView />}
      {currentTab === 'invoices' && <InvoicesView />}
      {currentTab === 'onboarding' && <OnboardingDashboard />}
      {currentTab === 'joining-pipeline' && <OnboardingDashboard />}
      {currentTab === 'employees' && <EmployeesView />}
      {currentTab === 'salary-structures' && <SalaryStructuresView />}
      {currentTab === 'timesheets' && <TimesheetAdminView />}
      {currentTab === 'reports' && <ReportsView />}
      {currentTab === 'notifications' && <AdminDashboardView onNavigate={setCurrentTab} />}
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

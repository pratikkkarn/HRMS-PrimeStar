export type UserRole =
  | 'CEO'
  | 'HR Head'
  | 'HR Executive'
  | 'Finance Manager'
  | 'PO Admin'
  | 'Project Manager'
  | 'Employee';

export interface RolePermission {
  canViewPODashboard: boolean;
  canManagePOs: boolean;
  canViewFinancials: boolean;
  canManageInvoices: boolean;
  canManageSOW: boolean;
  canAssignEmployeesToPO: boolean;
  canViewOnboarding: boolean;
  canManageOnboarding: boolean;
  canReviewCandidates: boolean;
  canReleaseOffers: boolean;
  canViewEmployeeDirectory: boolean;
  canManageEmployees: boolean;
  canManageSalaryStructures: boolean;
  canApproveTimesheets: boolean;
  canViewReports: boolean;
  isEmployeeOnly: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  CEO: {
    canViewPODashboard: true,
    canManagePOs: true,
    canViewFinancials: true,
    canManageInvoices: true,
    canManageSOW: true,
    canAssignEmployeesToPO: true,
    canViewOnboarding: true,
    canManageOnboarding: true,
    canReviewCandidates: true,
    canReleaseOffers: true,
    canViewEmployeeDirectory: true,
    canManageEmployees: true,
    canManageSalaryStructures: true,
    canApproveTimesheets: true,
    canViewReports: true,
    isEmployeeOnly: false,
  },
  'HR Head': {
    canViewPODashboard: true,
    canManagePOs: false,
    canViewFinancials: false,
    canManageInvoices: false,
    canManageSOW: false,
    canAssignEmployeesToPO: true,
    canViewOnboarding: true,
    canManageOnboarding: true,
    canReviewCandidates: true,
    canReleaseOffers: true,
    canViewEmployeeDirectory: true,
    canManageEmployees: true,
    canManageSalaryStructures: true,
    canApproveTimesheets: true,
    canViewReports: true,
    isEmployeeOnly: false,
  },
  'HR Executive': {
    canViewPODashboard: true,
    canManagePOs: false,
    canViewFinancials: false,
    canManageInvoices: false,
    canManageSOW: false,
    canAssignEmployeesToPO: false,
    canViewOnboarding: true,
    canManageOnboarding: true,
    canReviewCandidates: true,
    canReleaseOffers: false,
    canViewEmployeeDirectory: true,
    canManageEmployees: false,
    canManageSalaryStructures: false,
    canApproveTimesheets: false,
    canViewReports: false,
    isEmployeeOnly: false,
  },
  'Finance Manager': {
    canViewPODashboard: true,
    canManagePOs: false,
    canViewFinancials: true,
    canManageInvoices: true,
    canManageSOW: true,
    canAssignEmployeesToPO: false,
    canViewOnboarding: false,
    canManageOnboarding: false,
    canReviewCandidates: false,
    canReleaseOffers: false,
    canViewEmployeeDirectory: true,
    canManageEmployees: false,
    canManageSalaryStructures: true,
    canApproveTimesheets: false,
    canViewReports: true,
    isEmployeeOnly: false,
  },
  'PO Admin': {
    canViewPODashboard: true,
    canManagePOs: true,
    canViewFinancials: true,
    canManageInvoices: true,
    canManageSOW: true,
    canAssignEmployeesToPO: true,
    canViewOnboarding: false,
    canManageOnboarding: false,
    canReviewCandidates: false,
    canReleaseOffers: false,
    canViewEmployeeDirectory: true,
    canManageEmployees: false,
    canManageSalaryStructures: false,
    canApproveTimesheets: false,
    canViewReports: true,
    isEmployeeOnly: false,
  },
  'Project Manager': {
    canViewPODashboard: true,
    canManagePOs: false,
    canViewFinancials: false,
    canManageInvoices: false,
    canManageSOW: true,
    canAssignEmployeesToPO: true,
    canViewOnboarding: false,
    canManageOnboarding: false,
    canReviewCandidates: false,
    canReleaseOffers: false,
    canViewEmployeeDirectory: true,
    canManageEmployees: false,
    canManageSalaryStructures: false,
    canApproveTimesheets: true,
    canViewReports: true,
    isEmployeeOnly: false,
  },
  Employee: {
    canViewPODashboard: false,
    canManagePOs: false,
    canViewFinancials: false,
    canManageInvoices: false,
    canManageSOW: false,
    canAssignEmployeesToPO: false,
    canViewOnboarding: false,
    canManageOnboarding: false,
    canReviewCandidates: false,
    canReleaseOffers: false,
    canViewEmployeeDirectory: false,
    canManageEmployees: false,
    canManageSalaryStructures: false,
    canApproveTimesheets: false,
    canViewReports: false,
    isEmployeeOnly: true,
  },
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  avatarUrl?: string;
  employeeId?: string;
}

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@primestarconsulting.com',
    role: 'CEO',
    designation: 'Chief Executive Officer',
    department: 'Executive Office',
    employeeId: 'PS-001',
  },
  {
    id: 'usr-2',
    name: 'Priya Sundaram',
    email: 'priya.s@primestarconsulting.com',
    role: 'HR Head',
    designation: 'Head of Human Resources',
    department: 'Human Resources',
    employeeId: 'PS-012',
  },
  {
    id: 'usr-3',
    name: 'Ananya Roy',
    email: 'ananya.roy@primestarconsulting.com',
    role: 'HR Executive',
    designation: 'HR Onboarding Specialist',
    department: 'Human Resources',
    employeeId: 'PS-034',
  },
  {
    id: 'usr-4',
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@primestarconsulting.com',
    role: 'Finance Manager',
    designation: 'Senior Finance & Accounts Lead',
    department: 'Finance',
    employeeId: 'PS-018',
  },
  {
    id: 'usr-5',
    name: 'Kavita Nair',
    email: 'kavita.nair@primestarconsulting.com',
    role: 'PO Admin',
    designation: 'PO & Billing Operations Lead',
    department: 'Operations',
    employeeId: 'PS-022',
  },
  {
    id: 'usr-6',
    name: 'Siddharth Mehta',
    email: 'siddharth.m@primestarconsulting.com',
    role: 'Project Manager',
    designation: 'Delivery Director — Cloud & Analytics',
    department: 'Consulting Delivery',
    employeeId: 'PS-015',
  },
  {
    id: 'usr-7',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@primestarconsulting.com',
    role: 'Employee',
    designation: 'Senior Cloud Architect',
    department: 'Technology Consulting',
    employeeId: 'PS-108',
  },
];

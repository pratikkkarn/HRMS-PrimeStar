import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Input, Select, Badge, Modal } from '../common/UIComponents';
import {
  User,
  Shield,
  Bell,
  Globe,
  Lock,
  Building2,
  Key,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Users,
  History,
  Edit,
  Save,
  FileText,
} from 'lucide-react';
import { UserRole } from '../../types/roles';

export const SettingsView: React.FC = () => {
  const { currentRole, currentUser, permissions, switchRole, allDemoUsers } = useRole();
  const {
    userPreferences,
    updateUserPreferences,
    employees,
    updateEmployeeProfile,
    purchaseOrders,
  } = useData();

  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'company' | 'roles' | 'audit'>('account');

  // Password update modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Preference form state
  const [prefsData, setPrefsData] = useState({ ...userPreferences });

  // Company Settings Form State (Editable for CEO & HR Head)
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Prime Star Consulting Services Pvt Ltd',
    gstin: '29AAAAA0000A1Z5',
    currency: 'INR (₹)',
    address: 'Outer Ring Road, Marathahalli, Bengaluru 560103, Karnataka',
    contactEmail: 'contact@primestarconsulting.com',
    supportPhone: '+91 80 4000 8888',
  });
  const [companySaved, setCompanySaved] = useState(false);

  // Role Assignment State for CEO
  const [editingRoleEmployeeId, setEditingRoleEmployeeId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('Employee');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPreferences(prefsData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return;
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setPasswordModalOpen(false);
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
    }, 2000);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2500);
  };

  // Compile full system audit log from PO activity logs and profile events
  const auditLogs = purchaseOrders.flatMap((po) => po.activityLogs || []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" /> System Settings & Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure security, localized UI preferences, enterprise company metadata & user access controls.
          </p>
        </div>

        {currentRole === 'CEO' && (
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-full text-xs flex items-center gap-1.5 w-fit">
            <Shield className="w-3.5 h-3.5 text-amber-700" /> Full Executive Admin
          </span>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'account'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" /> My Account
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" /> System Preferences
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'company'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Enterprise Company Settings
        </button>

        {permissions.canManageUserRoles && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> User & Role Management
          </button>
        )}

        {permissions.canViewAuditLogs && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> System Audit Trail
          </button>
        )}
      </div>

      {/* TAB A: MY ACCOUNT */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              User Profile Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Display Name</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{currentUser.name}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Official Email</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{currentUser.email}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Active Development Persona</span>
                <span className="font-bold text-indigo-900 text-sm block mt-0.5">{currentRole}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Employee Identifier</span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                  {currentUser.employeeId || 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Credentials & Authentication</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage login password and authentication options for Prime Star HRMS.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={<Key className="w-3.5 h-3.5" />}
                onClick={() => setPasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Single Sign-On (SSO) Status</span>
                <span className="text-[11px] text-slate-500">Corporate Microsoft Entra ID connected.</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                Connected
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB B: SYSTEM PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card className="p-6">
          <form onSubmit={handleSavePreferences} className="space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Notification & Alert Preferences
              </h3>
              <div className="mt-3 space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Email Notifications</span>
                    <span className="text-[11px] text-slate-500 block">
                      Receive automated emails for PO expirations, onboarding status updates & timesheet approvals.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefsData.emailNotifications}
                    onChange={(e) => setPrefsData({ ...prefsData, emailNotifications: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">SMS Security Alerts</span>
                    <span className="text-[11px] text-slate-500 block">
                      Receive instant SMS alerts for critical approvals or login notifications.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefsData.smsNotifications}
                    onChange={(e) => setPrefsData({ ...prefsData, smsNotifications: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Regional & Localization Formats
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Date Display Format"
                  value={prefsData.dateFormat}
                  onChange={(e) =>
                    setPrefsData({ ...prefsData, dateFormat: e.target.value as any })
                  }
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Indian Standard — e.g. 13/10/2026)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format — e.g. 10/13/2026)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format — e.g. 2026-10-13)' },
                  ]}
                />

                <Select
                  label="Currency Display Default"
                  value={prefsData.currencyFormat}
                  onChange={(e) =>
                    setPrefsData({ ...prefsData, currencyFormat: e.target.value as any })
                  }
                  options={[
                    { value: 'INR (₹)', label: 'Indian Rupee — INR (₹)' },
                    { value: 'USD ($)', label: 'US Dollar — USD ($)' },
                    { value: 'EUR (€)', label: 'Euro — EUR (€)' },
                  ]}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" type="submit">
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB C: ENTERPRISE COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <Card className="p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Prime Star Consulting Services — Enterprise Setup
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Corporate metadata, statutory tax registration, and billing defaults.
              </p>
            </div>
            {permissions.canManageCompanySettings ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Administrative Management Mode
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only Enterprise View
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Legal Corporate Name *"
                value={companySettings.companyName}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, companyName: e.target.value })
                }
                disabled={!permissions.canManageCompanySettings}
              />

              <Input
                label="Corporate GSTIN *"
                value={companySettings.gstin}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, gstin: e.target.value })
                }
                disabled={!permissions.canManageCompanySettings}
              />

              <Input
                label="Default Operating Currency"
                value={companySettings.currency}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, currency: e.target.value })
                }
                disabled={!permissions.canManageCompanySettings}
              />

              <Input
                label="Official Corporate Email"
                value={companySettings.contactEmail}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, contactEmail: e.target.value })
                }
                disabled={!permissions.canManageCompanySettings}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Corporate Office Address *
              </label>
              <textarea
                rows={2}
                value={companySettings.address}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, address: e.target.value })
                }
                disabled={!permissions.canManageCompanySettings}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            {permissions.canManageCompanySettings && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {companySaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Company settings saved!
                  </span>
                )}
                <Button variant="primary" type="submit" icon={<Save className="w-3.5 h-3.5" />}>
                  Save Enterprise Settings
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* TAB D: USER & ROLE MANAGEMENT (CEO ONLY) */}
      {activeTab === 'roles' && permissions.canManageUserRoles && (
        <Card className="p-6 space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Executive Access Control & Role Management
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Assign application roles and configure security permissions across employee records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Current Application Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      {emp.name}
                      <span className="block text-[10px] text-slate-500 font-normal">{emp.email}</span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{emp.employeeId}</td>
                    <td className="p-3 text-slate-700">{emp.designation}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {emp.employeeId === 'PS-001'
                          ? 'CEO'
                          : emp.employeeId === 'PS-012'
                          ? 'HR Head'
                          : emp.employeeId === 'PS-034'
                          ? 'HR Executive'
                          : emp.employeeId === 'PS-018'
                          ? 'Finance Manager'
                          : emp.employeeId === 'PS-022'
                          ? 'PO Admin'
                          : emp.employeeId === 'PS-015'
                          ? 'Project Manager'
                          : 'Employee'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingRoleEmployeeId(emp.employeeId);
                          setSelectedNewRole('Employee');
                        }}
                      >
                        Manage Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB E: SYSTEM AUDIT TRAIL (CEO & HR HEAD) */}
      {activeTab === 'audit' && permissions.canViewAuditLogs && (
        <Card className="p-6 space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" /> Administrative Audit Log & Activity Trail
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Comprehensive activity records for PO creations, invoice issuances, profile edits, and approvals.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No system activity logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {log.userName}
                        <span className="block text-[10px] text-indigo-600 font-normal">{log.userRole}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 font-semibold text-slate-800 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 leading-relaxed">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {passwordModalOpen && (
        <Modal
          isOpen={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          title="Change Password Placeholder"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            {passSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center font-bold space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p>Password Updated Successfully!</p>
              </div>
            ) : (
              <>
                <Input
                  label="Current Password *"
                  type="password"
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="New Password *"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="Confirm New Password *"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setPasswordModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Update Password
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* CEO ROLE ASSIGNMENT MODAL */}
      {editingRoleEmployeeId && (
        <Modal
          isOpen={!!editingRoleEmployeeId}
          onClose={() => setEditingRoleEmployeeId(null)}
          title="Executive Role Reassignment"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Reassign application authority role for Employee ID <strong>{editingRoleEmployeeId}</strong>.
            </p>

            <Select
              label="Select New System Role"
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
              options={[
                { value: 'CEO', label: 'CEO — Full Executive Admin' },
                { value: 'HR Head', label: 'HR Head — Human Resources Lead' },
                { value: 'HR Executive', label: 'HR Executive — Onboarding Specialist' },
                { value: 'Finance Manager', label: 'Finance Manager — Accounts Lead' },
                { value: 'PO Admin', label: 'PO Admin — Purchase Orders Lead' },
                { value: 'Project Manager', label: 'Project Manager — Delivery Director' },
                { value: 'Employee', label: 'Employee — Standard Workforce' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditingRoleEmployeeId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingRoleEmployeeId(null);
                }}
              >
                Save Role Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

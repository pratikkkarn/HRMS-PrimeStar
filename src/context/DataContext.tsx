import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Project,
  StatementOfWork,
  Quotation,
  PurchaseOrder,
  Invoice,
  AssignedEmployee,
  POActivityLog,
  CandidateOnboarding,
  EmployeeProfile,
  SalaryStructure,
  TimesheetEntry,
  SystemNotification,
  POStatus,
  InvoiceStatus,
  CandidateStatus,
  TimesheetStatus,
  ProfileChangeRequest,
  UserPreferences,
} from '../types/domain';
import {
  INITIAL_PROJECTS,
  INITIAL_SOWS,
  INITIAL_QUOTATIONS,
  INITIAL_POS,
  INITIAL_CANDIDATES,
  INITIAL_EMPLOYEES,
  INITIAL_TIMESHEETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE_REQUESTS,
} from '../services/mockData';
import { recalculatePOBalances, recalculateProjectBalances } from '../lib/poUtils';
import { useNotification } from './NotificationContext';
import { useRole } from './RoleContext';

const STORAGE_KEYS = {
  PROJECTS: 'primestar_projects',
  SOWS: 'primestar_sows',
  QUOTATIONS: 'primestar_quotations',
  POS: 'primestar_purchase_orders',
  CANDIDATES: 'primestar_candidates',
  EMPLOYEES: 'primestar_employees',
  TIMESHEETS: 'primestar_timesheets',
  NOTIFICATIONS: 'primestar_notifications',
  PROFILE_REQUESTS: 'primestar_profile_requests',
  USER_PREFS: 'primestar_user_preferences',
};

function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
  }
  return fallback;
}

interface DataContextType {
  projects: Project[];
  sows: StatementOfWork[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  candidates: CandidateOnboarding[];
  employees: EmployeeProfile[];
  timesheets: TimesheetEntry[];
  notifications: SystemNotification[];

  // PO Actions
  addProject: (project: Omit<Project, 'id' | 'totalPoValue' | 'remainingBalance' | 'assignedHeadcount'>) => Project;
  createPO: (data: {
    poNumber: string;
    projectId: string;
    projectName: string;
    sowNumber?: string;
    quotationNumber?: string;
    poRequester: string;
    startDate: string;
    expiryDate: string;
    amountExclGst: number;
    gstRate: number;
    billingAddress: string;
    shippingAddress: string;
    notes?: string;
    poDocumentName?: string;
  }) => PurchaseOrder;
  updatePO: (poId: string, data: Partial<PurchaseOrder>) => void;
  deletePO: (poId: string) => void;
  renewPO: (oldPoId: string, newPoNumber: string, newAmountExclGst: number, newStartDate: string, newExpiryDate: string) => PurchaseOrder;
  addInvoice: (poId: string, invoice: Omit<Invoice, 'id' | 'poId' | 'gstAmount' | 'totalAmountInclGst'>) => void;
  updateInvoiceStatus: (poId: string, invoiceId: string, status: InvoiceStatus) => void;
  cancelInvoice: (poId: string, invoiceId: string) => void;
  assignEmployeeToPO: (poId: string, assignment: Omit<AssignedEmployee, 'status'>) => void;
  unassignEmployeeFromPO: (poId: string, employeeId: string) => void;
  addSOW: (sow: Omit<StatementOfWork, 'id'>) => StatementOfWork;
  addQuotation: (quot: Omit<Quotation, 'id'>) => Quotation;

  // Candidate / Onboarding Actions
  inviteCandidate: (candidateData: {
    candidateName: string;
    email: string;
    phone: string;
    designation: string;
    proposedDepartment: string;
    offeredCtc: number;
    joiningDate: string;
    isExperienced: boolean;
    assignedHr?: string;
  }) => CandidateOnboarding;
  updateCandidateOnboarding: (token: string, data: Partial<CandidateOnboarding>) => void;
  editCandidateDetails: (candidateId: string, updatedFields: Partial<CandidateOnboarding>) => void;
  cancelCandidateOnboarding: (candidateId: string, reason?: string) => void;
  reviewCandidateForm: (candidateId: string, action: 'approve' | 'return_for_correction', hrComments: string) => void;
  releaseOfferLetter: (candidateId: string) => void;
  confirmCandidateJoining: (candidateId: string) => void;
  completeOnboarding: (candidateId: string) => void;
  updateCandidateChecklist: (candidateId: string, checklistState: Record<string, 'Pending' | 'Verified' | 'Waived'>) => void;

  // Employee & Profile Actions
  profileRequests: ProfileChangeRequest[];
  userPreferences: UserPreferences;
  createProfileChangeRequest: (data: {
    employeeId: string;
    employeeName: string;
    fieldName: string;
    fieldKey: string;
    currentValue: string;
    proposedValue: string;
    reason: string;
  }) => ProfileChangeRequest;
  reviewProfileChangeRequest: (requestId: string, action: 'approve' | 'reject', reviewerComments: string) => void;
  updateEmployeeProfile: (employeeId: string, updatedFields: Partial<EmployeeProfile>) => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateSalaryStructure: (employeeId: string, updatedStructure: Partial<SalaryStructure>) => void;

  // Timesheet Actions
  submitTimesheet: (timesheetId: string) => void;
  approveTimesheet: (timesheetId: string, comments?: string) => void;
  rejectTimesheet: (timesheetId: string, reason: string) => void;
  requestUnlockTimesheet: (timesheetId: string, reason: string) => void;
  approveUnlockTimesheet: (timesheetId: string, comments?: string) => void;
  rejectUnlockTimesheet: (timesheetId: string, reason: string) => void;
  bulkApproveTimesheets: (timesheetIds: string[]) => void;
  bulkRejectTimesheets: (timesheetIds: string[], reason: string) => void;
  createTimesheet: (entryData: Omit<TimesheetEntry, 'id'>) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const raw = loadStoredData<PurchaseOrder[]>(STORAGE_KEYS.POS, INITIAL_POS);
    return raw.map((po) => recalculatePOBalances(po));
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const rawProjects = loadStoredData<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const initialPOs = loadStoredData<PurchaseOrder[]>(STORAGE_KEYS.POS, INITIAL_POS).map(recalculatePOBalances);
    return recalculateProjectBalances(rawProjects, initialPOs);
  });

  const [sows, setSows] = useState<StatementOfWork[]>(() =>
    loadStoredData<StatementOfWork[]>(STORAGE_KEYS.SOWS, INITIAL_SOWS)
  );
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    loadStoredData<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS)
  );
  const [candidates, setCandidates] = useState<CandidateOnboarding[]>(() =>
    loadStoredData<CandidateOnboarding[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES)
  );
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() =>
    loadStoredData<EmployeeProfile[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES)
  );
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(() =>
    loadStoredData<TimesheetEntry[]>(STORAGE_KEYS.TIMESHEETS, INITIAL_TIMESHEETS)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    loadStoredData<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>(() =>
    loadStoredData<ProfileChangeRequest[]>(STORAGE_KEYS.PROFILE_REQUESTS, INITIAL_PROFILE_REQUESTS)
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() =>
    loadStoredData<UserPreferences>(STORAGE_KEYS.USER_PREFS, {
      emailNotifications: true,
      smsNotifications: false,
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: 'INR (₹)',
    })
  );

  const { showToast } = useNotification();
  const { currentUser, updateProfileOverride } = useRole();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(purchaseOrders));
    } catch (e) {
      console.error('Error saving purchase orders to localStorage:', e);
    }
  }, [purchaseOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOWS, JSON.stringify(sows));
    } catch (e) {
      console.error('Error saving sows to localStorage:', e);
    }
  }, [sows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
    } catch (e) {
      console.error('Error saving quotations to localStorage:', e);
    }
  }, [quotations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
    } catch (e) {
      console.error('Error saving candidates to localStorage:', e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees to localStorage:', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(timesheets));
    } catch (e) {
      console.error('Error saving timesheets to localStorage:', e);
    }
  }, [timesheets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications to localStorage:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(profileRequests));
    } catch (e) {
      console.error('Error saving profile requests to localStorage:', e);
    }
  }, [profileRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(userPreferences));
    } catch (e) {
      console.error('Error saving user preferences to localStorage:', e);
    }
  }, [userPreferences]);

  // Helper to sync PO balances & project totals
  const updatePOsState = (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => {
    setPurchaseOrders((prev) => {
      const nextPOs = updater(prev);
      setProjects((prevProj) => recalculateProjectBalances(prevProj, nextPOs));
      return nextPOs;
    });
  };

  const addProject = (data: Omit<Project, 'id' | 'totalPoValue' | 'remainingBalance' | 'assignedHeadcount'>): Project => {
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      assignedHeadcount: 0,
      totalPoValue: 0,
      remainingBalance: 0,
    };
    setProjects((prev) => [newProj, ...prev]);
    showToast('Project Created', `Project "${data.name}" added successfully.`);
    return newProj;
  };

  const createPO = (data: {
    poNumber: string;
    projectId: string;
    projectName: string;
    sowNumber?: string;
    quotationNumber?: string;
    poRequester: string;
    startDate: string;
    expiryDate: string;
    amountExclGst: number;
    gstRate: number;
    billingAddress: string;
    shippingAddress: string;
    notes?: string;
    poDocumentName?: string;
  }): PurchaseOrder => {
    const amountInclGst = data.amountExclGst * (1 + data.gstRate / 100);

    const newPORaw: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: data.poNumber,
      projectId: data.projectId,
      projectName: data.projectName,
      sowNumber: data.sowNumber,
      quotationNumber: data.quotationNumber,
      poRequester: data.poRequester,
      startDate: data.startDate,
      expiryDate: data.expiryDate,
      amountExclGst: data.amountExclGst,
      gstRate: data.gstRate,
      amountInclGst,
      invoicedExclGst: 0,
      creditNotesExclGst: 0,
      remainingBalanceExclGst: data.amountExclGst,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      poDocumentName: data.poDocumentName,
      status: 'Active',
      invoices: [],
      assignedEmployees: [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          poId: `po-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-IN'),
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'PO Created',
          details: `Created Purchase Order ${data.poNumber} for ₹${data.amountExclGst.toLocaleString('en-IN')} (Excl GST)`,
        },
      ],
    };

    const finalPO = recalculatePOBalances(newPORaw);
    setPurchaseOrders((prev) => [finalPO, ...prev]);

    // Recalculate Project totals
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === data.projectId) {
          return {
            ...proj,
            totalPoValue: proj.totalPoValue + data.amountExclGst,
            remainingBalance: proj.remainingBalance + data.amountExclGst,
          };
        }
        return proj;
      })
    );

    showToast('PO Created Successfully', `Purchase Order ${data.poNumber} registered.`);
    return finalPO;
  };

  const updatePO = (poId: string, data: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          const updated = { ...po, ...data };
          return recalculatePOBalances(updated);
        }
        return po;
      })
    );
    showToast('PO Updated', 'Purchase order details updated successfully.');
  };

  const deletePO = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    setPurchaseOrders((prev) => prev.filter((p) => p.id !== poId));

    // Recalculate Project totals
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === po.projectId) {
          return {
            ...proj,
            totalPoValue: Math.max(0, proj.totalPoValue - po.amountExclGst),
            remainingBalance: Math.max(0, proj.remainingBalance - po.remainingBalanceExclGst),
          };
        }
        return proj;
      })
    );

    showToast('PO Deleted', `Purchase Order ${po.poNumber} has been deleted.`);
  };

  const renewPO = (
    oldPoId: string,
    newPoNumber: string,
    newAmountExclGst: number,
    newStartDate: string,
    newExpiryDate: string
  ): PurchaseOrder => {
    const oldPo = purchaseOrders.find((p) => p.id === oldPoId);
    if (!oldPo) throw new Error('Original PO not found');

    // Create successor PO
    const amountInclGst = newAmountExclGst * (1 + oldPo.gstRate / 100);
    const newPOId = `po-${Date.now()}`;

    const successorPoRaw: PurchaseOrder = {
      id: newPOId,
      poNumber: newPoNumber,
      projectId: oldPo.projectId,
      projectName: oldPo.projectName,
      sowId: oldPo.sowId,
      sowNumber: oldPo.sowNumber,
      poRequester: currentUser.name,
      startDate: newStartDate,
      expiryDate: newExpiryDate,
      amountExclGst: newAmountExclGst,
      gstRate: oldPo.gstRate,
      amountInclGst,
      invoicedExclGst: 0,
      creditNotesExclGst: 0,
      remainingBalanceExclGst: newAmountExclGst,
      billingAddress: oldPo.billingAddress,
      shippingAddress: oldPo.shippingAddress,
      notes: `Renewed successor PO of ${oldPo.poNumber}`,
      status: 'Active',
      renewedFromPoNumber: oldPo.poNumber,
      invoices: [],
      assignedEmployees: [...oldPo.assignedEmployees],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          poId: newPOId,
          timestamp: new Date().toLocaleString('en-IN'),
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'PO Renewed Successor',
          details: `Created as renewed successor to ${oldPo.poNumber}`,
        },
      ],
    };

    const finalSuccessor = recalculatePOBalances(successorPoRaw);

    // Update old PO as 'Renewed' and link to successor PO
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === oldPoId) {
          const updatedOldPo: PurchaseOrder = {
            ...p,
            status: 'Renewed',
            renewedToPoNumber: newPoNumber,
            activityLogs: [
              ...p.activityLogs,
              {
                id: `act-${Date.now()}-old`,
                poId: oldPoId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'PO Renewed',
                details: `PO renewed into successor PO ${newPoNumber}`,
              },
            ],
          };
          return updatedOldPo;
        }
        return p;
      })
    );

    setPurchaseOrders((prev) => [finalSuccessor, ...prev]);
    showToast('PO Renewed', `New PO ${newPoNumber} created as renewal for ${oldPo.poNumber}`);
    return finalSuccessor;
  };

  const addInvoice = (
    poId: string,
    invoiceData: Omit<Invoice, 'id' | 'poId' | 'gstAmount' | 'totalAmountInclGst'>
  ) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const gstAmount = invoiceData.amountExclGst * (invoiceData.gstRate / 100);
    const totalAmountInclGst = invoiceData.amountExclGst + gstAmount;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      poId,
      gstAmount,
      totalAmountInclGst,
    };

    updatePOsState((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updatedInvoices = [...p.invoices, newInvoice];
          const logText = invoiceData.isCreditNote
            ? `Credit Note ${invoiceData.invoiceNumber} added for ₹${invoiceData.amountExclGst.toLocaleString('en-IN')}`
            : `Invoice ${invoiceData.invoiceNumber} issued for ₹${invoiceData.amountExclGst.toLocaleString('en-IN')}`;

          const updatedPo = {
            ...p,
            invoices: updatedInvoices,
            activityLogs: [
              ...p.activityLogs,
              {
                id: `act-${Date.now()}`,
                poId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: invoiceData.isCreditNote ? 'Credit Note Added' : 'Invoice Issued',
                details: logText,
              },
            ],
          };
          return recalculatePOBalances(updatedPo);
        }
        return p;
      })
    );

    showToast('Invoice Saved', `Invoice ${invoiceData.invoiceNumber} recorded for PO ${po.poNumber}.`);
  };

  const updateInvoiceStatus = (poId: string, invoiceId: string, status: InvoiceStatus) => {
    updatePOsState((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updatedInvoices = p.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, status } : inv
          );
          const invObj = p.invoices.find((i) => i.id === invoiceId);
          const updatedPo = {
            ...p,
            invoices: updatedInvoices,
            activityLogs: [
              ...p.activityLogs,
              {
                id: `act-${Date.now()}`,
                poId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'Invoice Status Updated',
                details: `Invoice ${invObj?.invoiceNumber || invoiceId} status changed to ${status}.`,
              },
            ],
          };
          return recalculatePOBalances(updatedPo);
        }
        return p;
      })
    );
    showToast('Invoice Updated', `Status changed to ${status}.`);
  };

  const cancelInvoice = (poId: string, invoiceId: string) => {
    updatePOsState((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updatedInvoices = p.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: 'Cancelled' as const } : inv
          );
          const invObj = p.invoices.find((i) => i.id === invoiceId);
          const updatedPo = {
            ...p,
            invoices: updatedInvoices,
            activityLogs: [
              ...p.activityLogs,
              {
                id: `act-${Date.now()}`,
                poId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'Invoice Cancelled',
                details: `Invoice ${invObj?.invoiceNumber || invoiceId} was cancelled. Balance restored.`,
              },
            ],
          };
          return recalculatePOBalances(updatedPo);
        }
        return p;
      })
    );
    showToast('Invoice Cancelled', 'Cancelled invoice does not reduce remaining PO balance.');
  };

  const assignEmployeeToPO = (poId: string, assignment: Omit<AssignedEmployee, 'status'>) => {
    const newAssigned: AssignedEmployee = { ...assignment, status: 'Active' };
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          // Check if already assigned
          const exists = po.assignedEmployees.some((e) => e.employeeId === assignment.employeeId);
          const updatedAssigned = exists
            ? po.assignedEmployees.map((e) => (e.employeeId === assignment.employeeId ? newAssigned : e))
            : [...po.assignedEmployees, newAssigned];

          return {
            ...po,
            assignedEmployees: updatedAssigned,
            activityLogs: [
              ...po.activityLogs,
              {
                id: `act-${Date.now()}`,
                poId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'Employee Tagged',
                details: `Assigned ${assignment.employeeName} (${assignment.designation}) to PO ${po.poNumber}`,
              },
            ],
          };
        }
        return po;
      })
    );
    showToast('Employee Assigned', `${assignment.employeeName} tagged to PO.`);
  };

  const unassignEmployeeFromPO = (poId: string, employeeId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          const emp = po.assignedEmployees.find((e) => e.employeeId === employeeId);
          return {
            ...po,
            assignedEmployees: po.assignedEmployees.filter((e) => e.employeeId !== employeeId),
            activityLogs: [
              ...po.activityLogs,
              {
                id: `act-${Date.now()}`,
                poId,
                timestamp: new Date().toLocaleString('en-IN'),
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'Employee Untagged',
                details: `Untagged ${emp?.employeeName || employeeId} from PO ${po.poNumber}`,
              },
            ],
          };
        }
        return po;
      })
    );
    showToast('Employee Removed', 'Employee untagged from PO.');
  };

  const addSOW = (sowData: Omit<StatementOfWork, 'id'>): StatementOfWork => {
    const newSow: StatementOfWork = { ...sowData, id: `sow-${Date.now()}` };
    setSows((prev) => [newSow, ...prev]);
    showToast('SOW Added', `Statement of Work ${sowData.sowNumber} recorded.`);
    return newSow;
  };

  const addQuotation = (quotData: Omit<Quotation, 'id'>): Quotation => {
    const newQuot: Quotation = { ...quotData, id: `quot-${Date.now()}` };
    setQuotations((prev) => [newQuot, ...prev]);
    showToast('Quotation Added', `Quotation ${quotData.quotationNumber} recorded.`);
    return newQuot;
  };

  // Candidate / Onboarding Actions
  const inviteCandidate = (data: {
    candidateName: string;
    email: string;
    phone: string;
    designation: string;
    proposedDepartment: string;
    offeredCtc: number;
    joiningDate: string;
    isExperienced: boolean;
    assignedHr?: string;
  }): CandidateOnboarding => {
    const token = `token-${Math.random().toString(36).substring(2, 9)}`;
    const newCand: CandidateOnboarding = {
      id: `cand-${Date.now()}`,
      token,
      candidateName: data.candidateName,
      email: data.email,
      phone: data.phone,
      residentialAddress: '',
      designation: data.designation,
      proposedDepartment: data.proposedDepartment,
      offeredCtc: data.offeredCtc,
      joiningDate: data.joiningDate,
      assignedHr: data.assignedHr || 'Priya Sharma (HR Lead)',
      status: 'Invite Sent',
      invitationSentAt: new Date().toLocaleString('en-IN'),
      isExperienced: data.isExperienced,
      hasAcceptedDeclaration: false,
      educationList: [],
      employmentList: [],
      references: [],
      emergencyContacts: [],
      identityDocs: {},
    };

    setCandidates((prev) => [newCand, ...prev]);
    showToast('Candidate Invitation Generated', `Personal onboarding link ready for ${data.candidateName}.`);
    return newCand;
  };

  const updateCandidateOnboarding = (token: string, data: Partial<CandidateOnboarding>) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.token === token) {
          return { ...c, ...data };
        }
        return c;
      })
    );
  };

  const editCandidateDetails = (candidateId: string, updatedFields: Partial<CandidateOnboarding>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, ...updatedFields } : c))
    );
    showToast('Candidate Record Updated', 'Candidate details saved successfully.');
  };

  const cancelCandidateOnboarding = (candidateId: string, reason?: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              status: 'Declined',
              hrComments: reason ? `Cancelled/Archived: ${reason}` : c.hrComments,
            }
          : c
      )
    );
    showToast(
      'Onboarding Cancelled',
      `Candidate ${cand?.candidateName || candidateId} marked as Declined / Cancelled.`,
      'warning'
    );
  };

  const reviewCandidateForm = (
    candidateId: string,
    action: 'approve' | 'return_for_correction',
    hrComments: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const newStatus: CandidateStatus =
            action === 'approve' ? 'Under HR Review' : 'Returned for Correction';
          return {
            ...c,
            status: newStatus,
            reviewedAt: new Date().toLocaleString('en-IN'),
            hrComments,
          };
        }
        return c;
      })
    );

    if (action === 'approve') {
      showToast('Form HR Reviewed', 'Candidate form marked as verified.');
    } else {
      showToast('Form Returned to Candidate', 'Form unlocked for candidate correction.', 'warning');
    }
  };

  const releaseOfferLetter = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;
    if (!cand.joiningDate) {
      showToast('Offer Hold', 'Joining date must be confirmed before releasing offer letter.', 'error');
      return;
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Offer Released' } : c))
    );
    showToast('Offer Letter Released', `Offer letter generated and sent to ${cand.candidateName}.`);
  };

  const confirmCandidateJoining = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Joining Confirmed' } : c))
    );
    showToast('Joining Confirmed', 'Candidate marked as Joining Confirmed.');
  };

  const updateCandidateChecklist = (
    candidateId: string,
    checklistState: Record<string, 'Pending' | 'Verified' | 'Waived'>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, checklistState } : c))
    );
  };

  const completeOnboarding = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    // Check if employee record already exists by email or name
    const existingEmp = employees.find(
      (e) =>
        e.email.toLowerCase() === cand.email.toLowerCase() ||
        e.name.toLowerCase() === cand.candidateName.toLowerCase()
    );

    let assignedEmpId = '';

    if (existingEmp) {
      assignedEmpId = existingEmp.employeeId;
      // Update existing employee record
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === existingEmp.id
            ? {
                ...e,
                designation: cand.designation || e.designation,
                department: cand.proposedDepartment || e.department,
                joiningDate: cand.joiningDate || e.joiningDate,
                phone: cand.phone || e.phone,
                panNumber: cand.identityDocs?.panNumber || e.panNumber,
                aadhaarNumber: cand.identityDocs?.aadhaarNumber || e.aadhaarNumber,
              }
            : e
        )
      );
    } else {
      // Generate new EmployeeProfile
      const newEmpIdNum = 120 + employees.length + 1;
      assignedEmpId = `PS-${newEmpIdNum}`;
      const newEmployee: EmployeeProfile = {
        id: `emp-${Date.now()}`,
        employeeId: assignedEmpId,
        name: cand.candidateName,
        email: cand.email,
        phone: cand.phone,
        designation: cand.designation,
        department: cand.proposedDepartment,
        joiningDate: cand.joiningDate || new Date().toISOString().split('T')[0],
        managerName: 'Priya Sundaram (HR Head)',
        projectName: 'Bench / Unassigned',
        location: 'Bengaluru (HQ)',
        panNumber: cand.identityDocs?.panNumber || '',
        aadhaarNumber: cand.identityDocs?.aadhaarNumber || '',
        salaryStructure: {
          id: `sal-${Date.now()}`,
          employeeId: assignedEmpId,
          employeeName: cand.candidateName,
          designation: cand.designation,
          annualCtc: cand.offeredCtc,
          basicMonthly: Math.round((cand.offeredCtc * 0.5) / 12),
          hraMonthly: Math.round((cand.offeredCtc * 0.2) / 12),
          conveyanceMonthly: 1600,
          specialAllowanceMonthly: Math.round((cand.offeredCtc * 0.25) / 12),
          projectAllowanceMonthly: 0,
          grossMonthly: Math.round(cand.offeredCtc / 12),
          pfDeductionMonthly: 1800,
          professionalTaxMonthly: 200,
          tdsDeductionMonthly: Math.round((cand.offeredCtc * 0.1) / 12),
          totalDeductionsMonthly: Math.round((cand.offeredCtc * 0.1) / 12) + 2000,
          netTakeHomeMonthly: Math.round(cand.offeredCtc / 12) - (Math.round((cand.offeredCtc * 0.1) / 12) + 2000),
          effectiveDate: cand.joiningDate || new Date().toISOString().split('T')[0],
        },
      };

      setEmployees((prev) => [...prev, newEmployee]);
    }

    // Mark candidate as Joined
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Joined' } : c))
    );

    showToast(
      'Onboarding Completed!',
      `Candidate ${cand.candidateName} onboarded as Employee ${assignedEmpId}.`
    );
  };

  // Salary actions
  const updateSalaryStructure = (employeeId: string, updatedStructure: Partial<SalaryStructure>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId || emp.id === employeeId) {
          const current = emp.salaryStructure;
          const merged = { ...current, ...updatedStructure };

          // Recalculate gross and deductions
          const grossMonthly =
            (merged.basicMonthly || 0) +
            (merged.hraMonthly || 0) +
            (merged.conveyanceMonthly || 0) +
            (merged.specialAllowanceMonthly || 0) +
            (merged.projectAllowanceMonthly || 0);

          const totalDeductionsMonthly =
            (merged.pfDeductionMonthly || 0) +
            (merged.professionalTaxMonthly || 0) +
            (merged.tdsDeductionMonthly || 0);

          const netTakeHomeMonthly = grossMonthly - totalDeductionsMonthly;

          return {
            ...emp,
            salaryStructure: {
              ...merged,
              grossMonthly,
              totalDeductionsMonthly,
              netTakeHomeMonthly,
            },
          };
        }
        return emp;
      })
    );
    showToast('Salary Structure Updated', 'Employee compensation structure saved.');
  };

  // Timesheet actions
  const submitTimesheet = (timesheetId: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Submitted' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        };
        return {
          ...ts,
          status: 'Submitted',
          submittedAt: timestamp,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Timesheet Submitted', 'Timesheet locked and sent to Project Manager for approval.');
  };

  const approveTimesheet = (timesheetId: string, comments?: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Approved' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments,
        };
        return {
          ...ts,
          status: 'Approved',
          approverName: currentUser.name,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Timesheet Approved', 'Timesheet status updated to Approved.');
  };

  const rejectTimesheet = (timesheetId: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Rejected' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments: reason,
        };
        return {
          ...ts,
          status: 'Rejected',
          rejectionReason: reason,
          approverName: currentUser.name,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Timesheet Returned', 'Timesheet returned to employee for revision.', 'warning');
  };

  const requestUnlockTimesheet = (timesheetId: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Unlock Requested' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments: reason,
        };
        return {
          ...ts,
          status: 'Unlock Requested',
          unlockReason: reason,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Unlock Requested', 'Unlock request sent to Manager for approval.');
  };

  const approveUnlockTimesheet = (timesheetId: string, comments?: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Unlock Approved' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments,
        };
        return {
          ...ts,
          status: 'Draft',
          unlockReason: undefined,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Timesheet Unlocked', 'Timesheet unlocked and set to Draft for edits.');
  };

  const rejectUnlockTimesheet = (timesheetId: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (ts.id !== timesheetId) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Unlock Rejected' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments: reason,
        };
        return {
          ...ts,
          status: ts.submittedAt ? 'Submitted' : 'Approved',
          unlockReason: undefined,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Unlock Declined', 'Unlock request declined. Timesheet remains locked.', 'warning');
  };

  const bulkApproveTimesheets = (timesheetIds: string[]) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (!timesheetIds.includes(ts.id)) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Approved' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments: 'Approved in bulk action',
        };
        return {
          ...ts,
          status: 'Approved',
          approverName: currentUser.name,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Bulk Approval Complete', `${timesheetIds.length} timesheets approved.`);
  };

  const bulkRejectTimesheets = (timesheetIds: string[], reason: string) => {
    const timestamp = new Date().toLocaleString('en-IN');
    setTimesheets((prev) =>
      prev.map((ts) => {
        if (!timesheetIds.includes(ts.id)) return ts;
        const newLog = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          action: 'Rejected' as const,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comments: reason,
        };
        return {
          ...ts,
          status: 'Rejected',
          rejectionReason: reason,
          approverName: currentUser.name,
          auditTrail: [...(ts.auditTrail || []), newLog],
        };
      })
    );
    showToast('Bulk Rejection Complete', `${timesheetIds.length} timesheets returned for revision.`, 'warning');
  };

  const createTimesheet = (entryData: Omit<TimesheetEntry, 'id'>) => {
    const timestamp = new Date().toLocaleString('en-IN');
    const newId = `ts-${Date.now()}`;
    const initialLog = {
      id: `aud-${Date.now()}`,
      timestamp,
      action: 'Created' as const,
      actorName: currentUser.name,
      actorRole: currentUser.role,
    };

    const newTimesheet: TimesheetEntry = {
      ...entryData,
      id: newId,
      auditTrail: [initialLog],
    };

    setTimesheets((prev) => [newTimesheet, ...prev]);
    showToast('Timesheet Created', `Timesheet for ${newTimesheet.employeeName} logged successfully.`);
  };

  // Profile Change Request Actions
  const createProfileChangeRequest = (data: {
    employeeId: string;
    employeeName: string;
    fieldName: string;
    fieldKey: string;
    currentValue: string;
    proposedValue: string;
    reason: string;
  }): ProfileChangeRequest => {
    const newReq: ProfileChangeRequest = {
      id: `pcr-${Date.now()}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      fieldName: data.fieldName,
      fieldKey: data.fieldKey,
      currentValue: data.currentValue,
      proposedValue: data.proposedValue,
      reason: data.reason,
      submittedAt: new Date().toLocaleString('en-IN'),
      status: 'Pending',
    };

    setProfileRequests((prev) => [newReq, ...prev]);

    // Also add to system notifications for HR
    setNotifications((prev) => [
      {
        id: `notif-pcr-${Date.now()}`,
        title: 'Profile Change Request Pending',
        message: `${data.employeeName} requested to update ${data.fieldName} to "${data.proposedValue}".`,
        type: 'info',
        timestamp: new Date().toLocaleString('en-IN'),
        isRead: false,
        link: '/admin/profile-requests',
      },
      ...prev,
    ]);

    showToast('Change Request Submitted', `Profile change request submitted for HR review.`);
    return newReq;
  };

  const reviewProfileChangeRequest = (
    requestId: string,
    action: 'approve' | 'reject',
    reviewerComments: string
  ) => {
    const req = profileRequests.find((r) => r.id === requestId);
    if (!req) return;

    if (action === 'approve') {
      // 1. Update official profile in master application state
      updateEmployeeProfile(req.employeeId, {
        [req.fieldKey]: req.proposedValue,
      });

      // 2. Mark request as Approved
      setProfileRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'Approved' as const,
                reviewedBy: `${currentUser.name} (${currentUser.role})`,
                reviewedAt: new Date().toLocaleString('en-IN'),
                reviewerComments,
              }
            : r
        )
      );

      showToast(
        'Request Approved',
        `Approved change for ${req.employeeName}. Official profile updated with "${req.proposedValue}".`
      );
    } else {
      // Reject request -> official profile remains unchanged
      setProfileRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'Rejected' as const,
                reviewedBy: `${currentUser.name} (${currentUser.role})`,
                reviewedAt: new Date().toLocaleString('en-IN'),
                reviewerComments,
              }
            : r
        )
      );

      showToast(
        'Request Rejected',
        `Rejected change request for ${req.employeeName}. Official profile left unchanged.`,
        'warning'
      );
    }
  };

  const updateEmployeeProfile = (employeeId: string, updatedFields: Partial<EmployeeProfile>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId || emp.id === employeeId) {
          return { ...emp, ...updatedFields };
        }
        return emp;
      })
    );

    // Sync RoleContext active user profile override
    updateProfileOverride(employeeId, {
      name: updatedFields.name,
      email: updatedFields.email,
      designation: updatedFields.designation,
      department: updatedFields.department,
    });

    // Cascade name or designation changes across associated data views
    if (updatedFields.name || updatedFields.designation) {
      if (updatedFields.name) {
        setTimesheets((prev) =>
          prev.map((ts) =>
            ts.employeeId === employeeId ? { ...ts, employeeName: updatedFields.name! } : ts
          )
        );
      }

      setPurchaseOrders((prev) =>
        prev.map((po) => ({
          ...po,
          assignedEmployees: po.assignedEmployees.map((ae) => {
            if (ae.employeeId === employeeId) {
              return {
                ...ae,
                employeeName: updatedFields.name || ae.employeeName,
                designation: updatedFields.designation || ae.designation,
              };
            }
            return ae;
          }),
        }))
      );
    }

    showToast(
      'Profile Updated',
      `Official employee profile for ${employeeId} updated by ${currentUser.name} (${currentUser.role}).`
    );
  };

  const updateUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferences((prev) => ({ ...prev, ...prefs }));
    showToast('Preferences Saved', 'User account preferences updated.');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        sows,
        quotations,
        purchaseOrders,
        candidates,
        employees,
        timesheets,
        notifications,
        profileRequests,
        userPreferences,
        addProject,
        createPO,
        updatePO,
        deletePO,
        renewPO,
        addInvoice,
        updateInvoiceStatus,
        cancelInvoice,
        assignEmployeeToPO,
        unassignEmployeeFromPO,
        addSOW,
        addQuotation,
        inviteCandidate,
        updateCandidateOnboarding,
        editCandidateDetails,
        cancelCandidateOnboarding,
        reviewCandidateForm,
        releaseOfferLetter,
        confirmCandidateJoining,
        completeOnboarding,
        updateCandidateChecklist,
        updateSalaryStructure,
        submitTimesheet,
        approveTimesheet,
        rejectTimesheet,
        requestUnlockTimesheet,
        approveUnlockTimesheet,
        rejectUnlockTimesheet,
        bulkApproveTimesheets,
        bulkRejectTimesheets,
        createTimesheet,
        createProfileChangeRequest,
        reviewProfileChangeRequest,
        updateEmployeeProfile,
        updateUserPreferences,
        markNotificationRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

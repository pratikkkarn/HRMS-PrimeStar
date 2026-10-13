import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  CandidateStatus,
  TimesheetStatus,
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
} from '../services/mockData';
import { useNotification } from './NotificationContext';
import { useRole } from './RoleContext';

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
  }) => PurchaseOrder;
  updatePO: (poId: string, data: Partial<PurchaseOrder>) => void;
  renewPO: (oldPoId: string, newPoNumber: string, newAmountExclGst: number, newStartDate: string, newExpiryDate: string) => PurchaseOrder;
  addInvoice: (poId: string, invoice: Omit<Invoice, 'id' | 'poId' | 'gstAmount' | 'totalAmountInclGst'>) => void;
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
  }) => CandidateOnboarding;
  updateCandidateOnboarding: (token: string, data: Partial<CandidateOnboarding>) => void;
  reviewCandidateForm: (candidateId: string, action: 'approve' | 'return_for_correction', hrComments: string) => void;
  releaseOfferLetter: (candidateId: string) => void;
  confirmCandidateJoining: (candidateId: string) => void;

  // Employee & Salary Actions
  updateSalaryStructure: (employeeId: string, updatedStructure: Partial<SalaryStructure>) => void;

  // Timesheet Actions
  submitTimesheet: (timesheetId: string) => void;
  approveTimesheet: (timesheetId: string) => void;
  rejectTimesheet: (timesheetId: string, reason: string) => void;
  requestUnlockTimesheet: (timesheetId: string, reason: string) => void;
  approveUnlockTimesheet: (timesheetId: string) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [sows, setSows] = useState<StatementOfWork[]>(INITIAL_SOWS);
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [candidates, setCandidates] = useState<CandidateOnboarding[]>(INITIAL_CANDIDATES);
  const [employees, setEmployees] = useState<EmployeeProfile[]>(INITIAL_EMPLOYEES);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(INITIAL_TIMESHEETS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  const { showToast } = useNotification();
  const { currentUser } = useRole();

  // Helper to re-calculate PO financial state
  const recalculatePOBalances = (po: PurchaseOrder): PurchaseOrder => {
    let invoicedExclGst = 0;
    let creditNotesExclGst = 0;

    po.invoices.forEach((inv) => {
      if (inv.status !== 'Cancelled') {
        if (inv.isCreditNote) {
          creditNotesExclGst += inv.amountExclGst;
        } else {
          invoicedExclGst += inv.amountExclGst;
        }
      }
    });

    // Remaining balance = PO amount excluding GST - issued invoices + credit notes
    const remainingBalanceExclGst = Math.max(0, po.amountExclGst - invoicedExclGst + creditNotesExclGst);

    let status: POStatus = po.status;
    if (status !== 'Renewed' && status !== 'Closed') {
      if (remainingBalanceExclGst === 0) {
        status = 'Fully Utilized';
      } else if (remainingBalanceExclGst / po.amountExclGst <= 0.15) {
        status = 'Low Balance';
      } else {
        // Expiry check (within 60 days)
        const expDate = new Date(po.expiryDate);
        const now = new Date();
        const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 0) {
          status = 'Expired';
        } else if (diffDays <= 60) {
          status = 'Expiring Soon';
        } else {
          status = 'Active';
        }
      }
    }

    return {
      ...po,
      invoicedExclGst,
      creditNotesExclGst,
      remainingBalanceExclGst,
      status,
    };
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

    setPurchaseOrders((prev) =>
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

  const cancelInvoice = (poId: string, invoiceId: string) => {
    setPurchaseOrders((prev) =>
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
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: 'Submitted',
              submittedAt: new Date().toLocaleString('en-IN'),
            }
          : ts
      )
    );
    showToast('Timesheet Submitted', 'Timesheet locked and sent to Project Manager for approval.');
  };

  const approveTimesheet = (timesheetId: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: 'Approved',
              approverName: currentUser.name,
            }
          : ts
      )
    );
    showToast('Timesheet Approved', 'Timesheet status updated to Approved.');
  };

  const rejectTimesheet = (timesheetId: string, reason: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: 'Rejected',
              rejectionReason: reason,
              approverName: currentUser.name,
            }
          : ts
      )
    );
    showToast('Timesheet Returned', 'Timesheet returned to employee for revision.', 'warning');
  };

  const requestUnlockTimesheet = (timesheetId: string, reason: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: 'Unlock Requested',
              unlockReason: reason,
            }
          : ts
      )
    );
    showToast('Unlock Requested', 'Unlock request sent to Manager for approval.');
  };

  const approveUnlockTimesheet = (timesheetId: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? {
              ...ts,
              status: 'Draft',
              unlockReason: undefined,
            }
          : ts
      )
    );
    showToast('Timesheet Unlocked', 'Timesheet unlocked and set to Draft for edits.');
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
        addProject,
        createPO,
        updatePO,
        renewPO,
        addInvoice,
        cancelInvoice,
        assignEmployeeToPO,
        unassignEmployeeFromPO,
        addSOW,
        addQuotation,
        inviteCandidate,
        updateCandidateOnboarding,
        reviewCandidateForm,
        releaseOfferLetter,
        confirmCandidateJoining,
        updateSalaryStructure,
        submitTimesheet,
        approveTimesheet,
        rejectTimesheet,
        requestUnlockTimesheet,
        approveUnlockTimesheet,
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

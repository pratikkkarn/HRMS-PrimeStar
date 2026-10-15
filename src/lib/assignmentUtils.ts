import { EmployeeAssignment } from '../types/domain';

export interface AllocationValidationResult {
  valid: boolean;
  error?: string;
  currentActiveAllocation: number;
  requestedAllocation: number;
  proposedTotal: number;
}

/**
 * Validates an employee's total allocation percentage across active simultaneous assignments.
 * Ensures that total active allocation does not exceed 100%.
 */
export function validateEmployeeAllocation(params: {
  employeeId: string;
  employeeName: string;
  requestedAllocation: number;
  assignments: EmployeeAssignment[];
  editingAssignmentId?: string | null;
  status: string;
  assignedFrom?: string;
  assignedTo?: string;
}): AllocationValidationResult {
  const {
    employeeId,
    employeeName,
    requestedAllocation,
    assignments,
    editingAssignmentId,
    status,
    assignedFrom,
    assignedTo,
  } = params;

  if (isNaN(requestedAllocation) || requestedAllocation <= 0 || requestedAllocation > 100) {
    return {
      valid: false,
      error: 'Allocation percentage must be a valid number greater than 0% and at most 100%.',
      currentActiveAllocation: 0,
      requestedAllocation,
      proposedTotal: requestedAllocation,
    };
  }

  // Non-active assignments do not consume active allocation capacity
  if (status !== 'Active' && status !== 'Ending Soon') {
    return {
      valid: true,
      currentActiveAllocation: 0,
      requestedAllocation,
      proposedTotal: requestedAllocation,
    };
  }

  const currentActiveAllocation = assignments
    .filter((a) => {
      // Exclude current assignment if editing
      if (editingAssignmentId && String(a.id).trim() === String(editingAssignmentId).trim()) return false;
      // Must be same employee
      if (String(a.employeeId).trim() !== String(employeeId).trim()) return false;
      // Must be active or ending soon
      if (a.status !== 'Active' && a.status !== 'Ending Soon') return false;
      // Check date overlap if both assignments have start & end dates
      if (assignedFrom && assignedTo && a.assignedFrom && a.assignedTo) {
        const start1 = new Date(assignedFrom).getTime();
        const end1 = new Date(assignedTo).getTime();
        const start2 = new Date(a.assignedFrom).getTime();
        const end2 = new Date(a.assignedTo).getTime();
        if (!isNaN(start1) && !isNaN(end1) && !isNaN(start2) && !isNaN(end2)) {
          const overlaps = start1 <= end2 && end1 >= start2;
          if (!overlaps) return false;
        }
      }
      return true;
    })
    .reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);

  const proposedTotal = currentActiveAllocation + requestedAllocation;

  if (proposedTotal > 100) {
    return {
      valid: false,
      error: `Total active allocation for ${employeeName} cannot exceed 100%. Current active allocation is ${currentActiveAllocation}%, requested is ${requestedAllocation}% (Total: ${proposedTotal}%).`,
      currentActiveAllocation,
      requestedAllocation,
      proposedTotal,
    };
  }

  return {
    valid: true,
    currentActiveAllocation,
    requestedAllocation,
    proposedTotal,
  };
}

/**
 * Resolves the target project ID when an employee is selected in the assignment form.
 * - If employee has exactly 1 active/applicable existing assignment -> auto-select that project ID.
 * - If employee has multiple active existing assignments -> return current project ID if valid, otherwise first existing project ID.
 * - If employee has 0 existing assignments -> retain current valid project selection or return default fallback.
 */
export function getTargetProjectForEmployee(params: {
  employeeId: string;
  assignments: EmployeeAssignment[];
  currentProjectId?: string;
  defaultProjectId?: string;
  employees?: { employeeId: string; projectName?: string }[];
  projects?: { id: string; name: string }[];
  editingAssignmentId?: string | null;
}): { projectId: string; hasSingleExistingProject: boolean; existingProjects: string[] } {
  const {
    employeeId,
    assignments,
    currentProjectId,
    employees = [],
    projects = [],
    editingAssignmentId,
  } = params;

  // 1. Find active/applicable project IDs for this employee from assignments (excluding the editing assignment)
  const employeeActiveAssignments = assignments.filter(
    (a) =>
      a.employeeId === employeeId &&
      (!editingAssignmentId || a.id !== editingAssignmentId) &&
      (a.status === 'Active' || a.status === 'Ending Soon')
  );

  const existingAssignmentProjectIds = Array.from(
    new Set(employeeActiveAssignments.map((a) => a.projectId).filter(Boolean))
  );

  // 2. Check if employee profile matches an active client project
  const empProfile = employees.find((e) => e.employeeId === employeeId);
  const empProjName = empProfile?.projectName;
  let profileMatchedProjectId = '';
  if (empProjName && projects.length > 0) {
    const matchedProj = projects.find(
      (p) =>
        p.id === empProjName ||
        p.name.toLowerCase().includes(empProjName.toLowerCase()) ||
        empProjName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matchedProj) {
      profileMatchedProjectId = matchedProj.id;
    }
  }

  // Combine unique applicable project IDs
  const applicableProjectIds = Array.from(
    new Set([
      ...existingAssignmentProjectIds,
      ...(profileMatchedProjectId ? [profileMatchedProjectId] : []),
    ])
  );

  if (applicableProjectIds.length === 1) {
    // Exactly 1 applicable project -> auto select that project
    return {
      projectId: applicableProjectIds[0],
      hasSingleExistingProject: true,
      existingProjects: applicableProjectIds,
    };
  }

  if (applicableProjectIds.length > 1) {
    // Multiple applicable projects -> keep current selection if valid for this employee; otherwise default to first
    const isCurrentValid = currentProjectId && applicableProjectIds.includes(currentProjectId);
    return {
      projectId: isCurrentValid ? currentProjectId : applicableProjectIds[0],
      hasSingleExistingProject: false,
      existingProjects: applicableProjectIds,
    };
  }

  // 0 applicable projects for this employee:
  // If editing an existing assignment record (editingAssignmentId is present), preserve currentProjectId as the project being reassigned.
  if (
    editingAssignmentId &&
    currentProjectId &&
    projects.some((p) => p.id === currentProjectId)
  ) {
    return {
      projectId: currentProjectId,
      hasSingleExistingProject: false,
      existingProjects: [],
    };
  }

  // If creating a new assignment (editingAssignmentId is null/undefined), clear project selection to prompt user
  return {
    projectId: '',
    hasSingleExistingProject: false,
    existingProjects: [],
  };
}

/**
 * Checks if a selected PO ID remains valid for a newly selected project.
 * Returns the selected PO ID if valid, or empty string (Direct Project Allocation) if invalid.
 */
export function getValidPoForProject(
  selectedPoId: string,
  newProjectId: string,
  purchaseOrders: { id: string; projectId: string }[]
): string {
  if (!selectedPoId) return '';
  const isValid = purchaseOrders.some(
    (po) => po.id === selectedPoId && po.projectId === newProjectId
  );
  return isValid ? selectedPoId : '';
}

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export interface ProrationResult {
  eligibleDays: number;
  totalDaysInMonth: number;
  eligibleAmount: number;
  isFullMonth: boolean;
  prorationApplied: boolean;
  effectiveStartDateStr: string;
  effectiveEndDateStr: string;
}

/**
 * Calculates calendar-day prorated billing amount for an employee assignment in a specific billing month.
 * Formula: Eligible amount = Monthly employee billing amount * Eligible calendar days / Total calendar days in billing month.
 * Departure date treatment: Employee is billable ON and up to the effective termination date (inclusive).
 */
export function calculateProratedBillingAmount(params: {
  monthlyBillingRate: number;
  assignedFrom: string; // YYYY-MM-DD
  assignedTo: string; // YYYY-MM-DD
  effectiveTerminationDate?: string; // YYYY-MM-DD
  billingYear: number;
  billingMonth: number | string; // 1..12 or "October" or "October 2026"
}): ProrationResult {
  const {
    monthlyBillingRate,
    assignedFrom,
    assignedTo,
    effectiveTerminationDate,
    billingYear,
    billingMonth,
  } = params;

  if (isNaN(monthlyBillingRate) || monthlyBillingRate <= 0) {
    return {
      eligibleDays: 0,
      totalDaysInMonth: 30,
      eligibleAmount: 0,
      isFullMonth: false,
      prorationApplied: false,
      effectiveStartDateStr: '',
      effectiveEndDateStr: '',
    };
  }

  // Parse Month Index (0..11)
  let monthIndex = 0;
  if (typeof billingMonth === 'number') {
    monthIndex = Math.max(0, Math.min(11, billingMonth - 1));
  } else {
    const cleanMonthStr = String(billingMonth).toLowerCase().trim().split(' ')[0];
    const foundIdx = MONTH_NAMES.findIndex((m) => m.startsWith(cleanMonthStr));
    if (foundIdx !== -1) {
      monthIndex = foundIdx;
    }
  }

  // Calculate Total Days in Month (e.g. 28, 29, 30, 31)
  const year = billingYear || new Date().getFullYear();
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const monthStartStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const monthEndStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
    totalDaysInMonth
  ).padStart(2, '0')}`;

  const effectiveEnd = effectiveTerminationDate || assignedTo;

  // Determine effective range for this month
  const effectiveStartForMonth = assignedFrom > monthStartStr ? assignedFrom : monthStartStr;
  const effectiveEndForMonth = effectiveEnd < monthEndStr ? effectiveEnd : monthEndStr;

  if (
    effectiveStartForMonth > effectiveEndForMonth ||
    assignedFrom > monthEndStr ||
    effectiveEnd < monthStartStr
  ) {
    return {
      eligibleDays: 0,
      totalDaysInMonth,
      eligibleAmount: 0,
      isFullMonth: false,
      prorationApplied: true,
      effectiveStartDateStr: effectiveStartForMonth,
      effectiveEndDateStr: effectiveEndForMonth,
    };
  }

  // Calculate inclusive calendar days
  const startDate = new Date(effectiveStartForMonth);
  const endDate = new Date(effectiveEndForMonth);
  const diffTime = endDate.getTime() - startDate.getTime();
  const eligibleDays = Math.max(0, Math.round(diffTime / (1000 * 3600 * 24)) + 1);

  if (eligibleDays >= totalDaysInMonth) {
    return {
      eligibleDays: totalDaysInMonth,
      totalDaysInMonth,
      eligibleAmount: monthlyBillingRate,
      isFullMonth: true,
      prorationApplied: false,
      effectiveStartDateStr: monthStartStr,
      effectiveEndDateStr: monthEndStr,
    };
  }

  const eligibleAmount = Math.round((monthlyBillingRate * eligibleDays) / totalDaysInMonth);

  return {
    eligibleDays,
    totalDaysInMonth,
    eligibleAmount,
    isFullMonth: false,
    prorationApplied: true,
    effectiveStartDateStr: effectiveStartForMonth,
    effectiveEndDateStr: effectiveEndForMonth,
  };
}

export interface EmployeeEligibleBillingItem {
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  monthlyBillingRate: number;
  eligibleDays: number;
  totalDaysInMonth: number;
  eligibleAmount: number;
  isFullMonth: boolean;
  prorationApplied: boolean;
  status: string;
  effectiveTerminationDate?: string;
  terminationReason?: string;
}

/**
 * Computes eligible billing amounts for all employees assigned to a Purchase Order for a given month and year.
 */
export function getPOEmployeeEligibleBillingForMonth(params: {
  poId: string;
  assignments: EmployeeAssignment[];
  billingYear: number;
  billingMonth: number | string;
}): EmployeeEligibleBillingItem[] {
  const { poId, assignments, billingYear, billingMonth } = params;

  const poAssignments = assignments.filter((a) => a.poId === poId);

  return poAssignments.map((asgn) => {
    const rate = asgn.billingRatePerMonth || 0;
    const proration = calculateProratedBillingAmount({
      monthlyBillingRate: rate,
      assignedFrom: asgn.assignedFrom,
      assignedTo: asgn.assignedTo,
      effectiveTerminationDate: asgn.effectiveTerminationDate,
      billingYear,
      billingMonth,
    });

    return {
      assignmentId: asgn.id,
      employeeId: asgn.employeeId,
      employeeName: asgn.employeeName,
      designation: asgn.designation,
      monthlyBillingRate: rate,
      eligibleDays: proration.eligibleDays,
      totalDaysInMonth: proration.totalDaysInMonth,
      eligibleAmount: proration.eligibleAmount,
      isFullMonth: proration.isFullMonth,
      prorationApplied: proration.prorationApplied,
      status: asgn.status,
      effectiveTerminationDate: asgn.effectiveTerminationDate,
      terminationReason: asgn.terminationReason,
    };
  });
}

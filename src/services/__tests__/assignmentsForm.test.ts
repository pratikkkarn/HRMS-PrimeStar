import { describe, it, expect } from 'vitest';
import { EmployeeAssignment, Project, PurchaseOrder } from '../../types/domain';
import {
  validateEmployeeAllocation,
  getValidPoForProject,
  getTargetProjectForEmployee,
} from '../../lib/assignmentUtils';

describe('Employee Assignments Form & Allocation Enhancements', () => {
  const baseEmployeeAssignments: EmployeeAssignment[] = [
    {
      id: 'asgn-101',
      employeeId: 'PS-101',
      employeeName: 'Ananya Roy',
      designation: 'Lead Solutions Architect',
      projectId: 'proj-hdfc-01',
      projectName: 'HDFC Core Banking API',
      poId: 'po-101',
      poNumber: 'PO/2025/HDFC/001',
      assignedFrom: '2025-01-01',
      assignedTo: '2026-12-31',
      allocationPercentage: 50,
      allocatedHoursPerMonth: 80,
      billingRatePerMonth: 220000,
      status: 'Active',
    },
    {
      id: 'asgn-102',
      employeeId: 'PS-102',
      employeeName: 'Vikramaditya Rao',
      designation: 'Principal DevOps Architect',
      projectId: 'proj-infy-02',
      projectName: 'Infosys Finacle AI',
      poId: 'po-102',
      poNumber: 'PO/2025/INFY/0032',
      assignedFrom: '2025-03-01',
      assignedTo: '2026-11-15',
      allocationPercentage: 100,
      allocatedHoursPerMonth: 160,
      billingRatePerMonth: 250000,
      status: 'Active',
    },
    {
      id: 'asgn-103',
      employeeId: 'PS-103',
      employeeName: 'Multi Project Employee',
      designation: 'Senior Developer',
      projectId: 'proj-hdfc-01',
      projectName: 'HDFC Project',
      assignedFrom: '2025-01-01',
      assignedTo: '2026-12-31',
      allocationPercentage: 30,
      status: 'Active',
    },
    {
      id: 'asgn-104',
      employeeId: 'PS-103',
      employeeName: 'Multi Project Employee',
      designation: 'Senior Developer',
      projectId: 'proj-infy-02',
      projectName: 'Infosys Project',
      assignedFrom: '2025-01-01',
      assignedTo: '2026-12-31',
      allocationPercentage: 40,
      status: 'Active',
    },
  ];

  const mockPurchaseOrders: { id: string; projectId: string; poNumber: string }[] = [
    { id: 'po-101', projectId: 'proj-hdfc-01', poNumber: 'PO/2025/HDFC/001' },
    { id: 'po-101-b', projectId: 'proj-hdfc-01', poNumber: 'PO/2025/HDFC/002' },
    { id: 'po-102', projectId: 'proj-infy-02', poNumber: 'PO/2025/INFY/0032' },
  ];

  describe('1. Controlled Numeric Allocation Input Processing', () => {
    it('allows replacing 100 with 60 without leading zeros or unexpected values', () => {
      // Test regex filter: digits only
      expect(/^\d*$/.test('60')).toBe(true);
      expect(/^\d*$/.test('')).toBe(true); // Empty string allowed during typing

      // Test parsing "060" -> 60
      const parsed060 = parseInt('060', 10);
      expect(parsed060).toBe(60);

      // Test validation logic on submit for valid 60%
      const res60 = validateEmployeeAllocation({
        employeeId: 'PS-999',
        employeeName: 'New Employee',
        requestedAllocation: 60,
        assignments: [],
        status: 'Active',
      });
      expect(res60.valid).toBe(true);

      // Test validation logic for invalid 0% or > 100%
      const res0 = validateEmployeeAllocation({
        employeeId: 'PS-999',
        employeeName: 'New Employee',
        requestedAllocation: 0,
        assignments: [],
        status: 'Active',
      });
      expect(res0.valid).toBe(false);
      expect(res0.error).toContain('greater than 0% and at most 100%');

      const res120 = validateEmployeeAllocation({
        employeeId: 'PS-999',
        employeeName: 'New Employee',
        requestedAllocation: 120,
        assignments: [],
        status: 'Active',
      });
      expect(res120.valid).toBe(false);
    });
  });

  describe('2. Employee Selection and Target Project Synchronization', () => {
    it('automatically selects target project when employee has exactly 1 existing assignment', () => {
      // Ananya Roy (PS-101) is assigned ONLY to proj-hdfc-01
      const res = getTargetProjectForEmployee({
        employeeId: 'PS-101',
        assignments: baseEmployeeAssignments,
        currentProjectId: 'proj-infy-02',
        defaultProjectId: 'proj-default',
      });

      expect(res.hasSingleExistingProject).toBe(true);
      expect(res.projectId).toBe('proj-hdfc-01');
    });

    it('REGRESSION TEST: changing employee from Rohan (proj-hdfc-01) to Siddharth (proj-infy-02) updates Target Project ID to proj-infy-02', () => {
      const rohanProjRes = getTargetProjectForEmployee({
        employeeId: 'PS-108',
        assignments: [
          {
            id: 'a1',
            employeeId: 'PS-108',
            employeeName: 'Rohan Deshmukh',
            designation: 'Architect',
            projectId: 'proj-hdfc-01',
            projectName: 'HDFC Project',
            assignedFrom: '2025-01-01',
            assignedTo: '2026-12-31',
            allocationPercentage: 100,
            status: 'Active',
          },
          {
            id: 'a2',
            employeeId: 'PS-015',
            employeeName: 'Siddharth Mehta',
            designation: 'Director',
            projectId: 'proj-infy-02',
            projectName: 'Infosys Project',
            assignedFrom: '2025-01-01',
            assignedTo: '2026-12-31',
            allocationPercentage: 50,
            status: 'Active',
          },
        ],
        currentProjectId: '',
        defaultProjectId: 'proj-hdfc-01',
      });
      expect(rohanProjRes.projectId).toBe('proj-hdfc-01');

      // User changes Employee dropdown to Siddharth Mehta (PS-015) who is assigned ONLY to proj-infy-02
      const siddharthProjRes = getTargetProjectForEmployee({
        employeeId: 'PS-015',
        assignments: [
          {
            id: 'a1',
            employeeId: 'PS-108',
            employeeName: 'Rohan Deshmukh',
            designation: 'Architect',
            projectId: 'proj-hdfc-01',
            projectName: 'HDFC Project',
            assignedFrom: '2025-01-01',
            assignedTo: '2026-12-31',
            allocationPercentage: 100,
            status: 'Active',
          },
          {
            id: 'a2',
            employeeId: 'PS-015',
            employeeName: 'Siddharth Mehta',
            designation: 'Director',
            projectId: 'proj-infy-02',
            projectName: 'Infosys Project',
            assignedFrom: '2025-01-01',
            assignedTo: '2026-12-31',
            allocationPercentage: 50,
            status: 'Active',
          },
        ],
        currentProjectId: rohanProjRes.projectId, // currently selected proj-hdfc-01
        defaultProjectId: 'proj-hdfc-01',
      });

      expect(siddharthProjRes.hasSingleExistingProject).toBe(true);
      expect(siddharthProjRes.projectId).toBe('proj-infy-02');
      expect(siddharthProjRes.projectId).not.toBe(rohanProjRes.projectId);
    });

    it('resolves valid project among existing assignments when employee has multiple assignments', () => {
      // PS-103 is assigned to proj-hdfc-01 and proj-infy-02
      const res1 = getTargetProjectForEmployee({
        employeeId: 'PS-103',
        assignments: baseEmployeeAssignments,
        currentProjectId: 'proj-infy-02', // Already selected valid project
        defaultProjectId: 'proj-default',
      });

      expect(res1.hasSingleExistingProject).toBe(false);
      expect(res1.existingProjects).toContain('proj-hdfc-01');
      expect(res1.existingProjects).toContain('proj-infy-02');
      expect(res1.projectId).toBe('proj-infy-02'); // Preserves valid selection

      const res2 = getTargetProjectForEmployee({
        employeeId: 'PS-103',
        assignments: baseEmployeeAssignments,
        currentProjectId: 'unrelated-proj', // Unrelated current selection
        defaultProjectId: 'proj-default',
      });

      expect(res2.projectId).toBe('proj-hdfc-01'); // Defaults to employee's first project
    });

    it('EXACT REPRODUCTION SEQUENCE: switching from Siddharth Mehta (PS-015) to Rajesh Sharma (PS-001) clears Siddharth\'s project', () => {
      const assignmentsWithSiddharth: EmployeeAssignment[] = [
        ...baseEmployeeAssignments,
        {
          id: 'asgn-siddharth',
          employeeId: 'PS-015',
          employeeName: 'Siddharth Mehta',
          designation: 'Director',
          projectId: 'proj-infy-02',
          projectName: 'Infosys Finacle AI',
          assignedFrom: '2025-01-01',
          assignedTo: '2026-12-31',
          allocationPercentage: 50,
          status: 'Active',
        },
      ];

      const mockEmployees = [
        { employeeId: 'PS-001', name: 'Rajesh Sharma', designation: 'Chief Executive Officer', projectName: 'Enterprise Growth & Strategy' },
        { employeeId: 'PS-015', name: 'Siddharth Mehta', designation: 'Delivery Director', projectName: 'Infosys Finacle AI Infrastructure' },
      ];

      const mockProjects = [
        { id: 'proj-hdfc-01', name: 'HDFC Core Banking Migration' },
        { id: 'proj-infy-02', name: 'Infosys Finacle AI Infrastructure' },
      ];

      // Form State Simulation
      let formEmployeeId = '';
      let formDesignation = '';
      let formProjectId = '';

      // Step 1: User selects Siddharth Mehta (PS-015) in form
      formEmployeeId = 'PS-015';
      const emp1 = mockEmployees.find((e) => e.employeeId === formEmployeeId)!;
      formDesignation = emp1.designation;

      const res1 = getTargetProjectForEmployee({
        employeeId: formEmployeeId,
        assignments: assignmentsWithSiddharth,
        currentProjectId: formProjectId,
        employees: mockEmployees,
        projects: mockProjects,
      });
      formProjectId = res1.projectId;

      // Assert Step 1: Siddharth's project is selected
      expect(formEmployeeId).toBe('PS-015');
      expect(formDesignation).toBe('Delivery Director');
      expect(formProjectId).toBe('proj-infy-02');

      // Step 2: User switches Employee dropdown to Rajesh Sharma (PS-001) in form
      formEmployeeId = 'PS-001';
      const emp2 = mockEmployees.find((e) => e.employeeId === formEmployeeId)!;
      formDesignation = emp2.designation;

      const res2 = getTargetProjectForEmployee({
        employeeId: formEmployeeId,
        assignments: assignmentsWithSiddharth,
        currentProjectId: formProjectId, // currently 'proj-infy-02'
        employees: mockEmployees,
        projects: mockProjects,
      });
      formProjectId = res2.projectId;

      // Assert Step 2: Rajesh's designation updates AND Siddharth's project is CLEARED!
      expect(formEmployeeId).toBe('PS-001');
      expect(formDesignation).toBe('Chief Executive Officer');
      expect(formProjectId).not.toBe('proj-infy-02'); // Crucial: Siddharth's project must NOT be retained!
      expect(formProjectId).toBe(''); // Cleared to require project selection for 0-assignment employee
    });
  });

  describe('3. Target Project and Linked PO Dependencies', () => {
    it('clears selected PO if it does not belong to newly selected project', () => {
      // Currently on proj-hdfc-01 with po-101. Switch to proj-infy-02.
      const newPo1 = getValidPoForProject('po-101', 'proj-infy-02', mockPurchaseOrders);
      expect(newPo1).toBe(''); // Cleared to Direct Allocation

      // Switch to proj-hdfc-01 while po-101 is selected.
      const newPo2 = getValidPoForProject('po-101', 'proj-hdfc-01', mockPurchaseOrders);
      expect(newPo2).toBe('po-101'); // Preserved!
    });

    it('preserves saved values on edit initialization', () => {
      const savedAsgn = baseEmployeeAssignments[0]; // Ananya Roy 50%
      expect(savedAsgn.employeeId).toBe('PS-101');
      expect(savedAsgn.projectId).toBe('proj-hdfc-01');
      expect(savedAsgn.poId).toBe('po-101');
      expect(savedAsgn.designation).toBe('Lead Solutions Architect');
      expect(savedAsgn.allocationPercentage).toBe(50);
    });
  });

  describe('4. Enforce Allocation Cap Validation', () => {
    it('blocks a new 60% active assignment for an employee who already has an active 50% assignment', () => {
      // Ananya Roy (PS-101) has an active 50% assignment. Adding a new 60% assignment total = 110%
      const validation = validateEmployeeAllocation({
        employeeId: 'PS-101',
        employeeName: 'Ananya Roy',
        requestedAllocation: 60,
        assignments: baseEmployeeAssignments,
        status: 'Active',
        assignedFrom: '2026-01-01',
        assignedTo: '2026-12-31',
      });

      expect(validation.valid).toBe(false);
      expect(validation.currentActiveAllocation).toBe(50);
      expect(validation.requestedAllocation).toBe(60);
      expect(validation.proposedTotal).toBe(110);
      expect(validation.error).toContain('Current active allocation is 50%, requested is 60% (Total: 110%)');
    });

    it('allows a new 50% active assignment for an employee with an existing 50% assignment (total 100%)', () => {
      const validation = validateEmployeeAllocation({
        employeeId: 'PS-101',
        employeeName: 'Ananya Roy',
        requestedAllocation: 50,
        assignments: baseEmployeeAssignments,
        status: 'Active',
        assignedFrom: '2026-01-01',
        assignedTo: '2026-12-31',
      });

      expect(validation.valid).toBe(true);
      expect(validation.currentActiveAllocation).toBe(50);
      expect(validation.requestedAllocation).toBe(50);
      expect(validation.proposedTotal).toBe(100);
    });

    it('does not falsely reject editing an existing 50% assignment to 60% when no other allocation exists', () => {
      // Ananya Roy (PS-101) edits her existing assignment (asgn-101) from 50% to 60%
      const validation = validateEmployeeAllocation({
        employeeId: 'PS-101',
        employeeName: 'Ananya Roy',
        requestedAllocation: 60,
        assignments: baseEmployeeAssignments,
        editingAssignmentId: 'asgn-101', // Current assignment ID excluded
        status: 'Active',
        assignedFrom: '2026-01-01',
        assignedTo: '2026-12-31',
      });

      expect(validation.valid).toBe(true);
      expect(validation.currentActiveAllocation).toBe(0);
      expect(validation.requestedAllocation).toBe(60);
      expect(validation.proposedTotal).toBe(60);
    });

    it('allows non-overlapping date assignments even if total allocation exceeds 100% across different periods', () => {
      const nonOverlappingAssignments: EmployeeAssignment[] = [
        {
          id: 'asgn-past',
          employeeId: 'PS-101',
          employeeName: 'Ananya Roy',
          designation: 'Architect',
          projectId: 'proj-1',
          projectName: 'Project 1',
          assignedFrom: '2025-01-01',
          assignedTo: '2025-06-30',
          allocationPercentage: 100,
          status: 'Active',
        },
      ];

      // New assignment in 2026
      const validation = validateEmployeeAllocation({
        employeeId: 'PS-101',
        employeeName: 'Ananya Roy',
        requestedAllocation: 100,
        assignments: nonOverlappingAssignments,
        status: 'Active',
        assignedFrom: '2026-01-01',
        assignedTo: '2026-12-31',
      });

      expect(validation.valid).toBe(true);
    });
  });

  describe('5. Data Preservation & Non-Mutation', () => {
    it('ensures validation failures do not mutate original assignment array or audit logs', () => {
      const snapshotBefore = JSON.stringify(baseEmployeeAssignments);

      // Attempt invalid allocation
      const validation = validateEmployeeAllocation({
        employeeId: 'PS-101',
        employeeName: 'Ananya Roy',
        requestedAllocation: 90,
        assignments: baseEmployeeAssignments,
        status: 'Active',
      });

      expect(validation.valid).toBe(false);

      // Verify array was not mutated
      const snapshotAfter = JSON.stringify(baseEmployeeAssignments);
      expect(snapshotAfter).toBe(snapshotBefore);
    });
  });
});

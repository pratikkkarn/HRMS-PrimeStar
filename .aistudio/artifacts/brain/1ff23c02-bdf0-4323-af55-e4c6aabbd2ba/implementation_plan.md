# Prime Star HRMS — Comprehensive Master Implementation Plan

An enterprise-grade, non-destructive architectural upgrade to Prime Star HRMS introducing multi-manager project support, manager-wise employee groupings, decoupled PO requester governance, strict multi-project split-time employee allocation caps, and explicit monthly invoice billing period tracking backed by automated pre-migration snapshots, idempotent data migration, credit-note validation against previously invoiced totals, financial report reconciliation, and a comprehensive unit test suite.

---

## Identified Issues & Planned Architectural Resolutions

| # | Identified Issue / Risk | Root Cause Analysis | Planned Architectural Resolution |
| :- | :--- | :--- | :--- |
| **1** | **Credit Note Validation Failure on Low Remaining PO Balance** | Validating credit notes against `remainingBalanceExclGst` causes valid credit notes to be rejected when a PO balance is low/zero. | Validate credit notes against **Eligible Previously Invoiced Tax Amount** ($\sum \text{activeTaxInvoices.amountExclGst} - \sum \text{activeCreditNotes.amountExclGst}$) for that PO. |
| **2** | **Over-Crediting Risk** | Raising credit notes greater than total issued tax invoices on a PO could lead to negative net invoiced amounts or phantom PO balances. | Enforce $\text{New Credit Note Amount} \le \text{Total Active Tax Invoiced Amount} - \text{Total Existing Active Credit Notes}$ for that PO. |
| **3** | **Hardcoded 18% GST Assumptions** | Financial calculations in some components override stored `gstRate` with a hardcoded $18\%$. | Enforce `inv.gstAmount = inv.amountExclGst * (inv.gstRate / 100)` using the stored `gstRate` field on each invoice record. |
| **4** | **Allocation Self-Inclusion on Edit** | Editing an active assignment adds its requested allocation to its existing allocation, causing false over-allocation errors ($>100\%$). | Calculate active allocation sum for the employee **excluding `editingAssignment.id`** before validating new allocation percentage. |
| **5** | **Dashboard Static Zero Data Discrepancy** | `AdminDashboardView.tsx` renders static zero metrics from `dashboardData.ts` instead of dynamic `DataContext` totals. | Re-wire `AdminDashboardView.tsx` to compute summary metrics dynamically from `purchaseOrders`, `projects`, `candidates`, `timesheets`, and `notifications`. |
| **6** | **Unbacked Storage Migration Risk** | Code inspection revealed 13 distinct `localStorage` keys across `DataContext`, `DocumentsView`, and `AssignmentsView`. Omitting keys like `primestar_deleted_doc_ids` breaks state. | Create a verified timestamped snapshot (`primestar_backup_<timestamp>`) covering all **13 data keys** in `localStorage` before migration. Abort if backup creation or verification fails. |
| **7** | **Duplicate Employee Profiles in Manager Groups** | Grouping employees under multiple project managers could duplicate employee records in the directory. | Keep canonical employee records strictly singletons in `employees` array; group views query `assignments` and `employees` by `employeeId` without duplicating profiles. |

---

## User Review & Confirmed System Safeguards

> [!IMPORTANT]
> The following non-negotiable safeguards, financial rules, and backup protocols govern this implementation:

### 1. Verified 13-Key Backup & Recovery Protocol
- **Exhaustive Key Inventory (13 Keys Inspected in Code)**:
  `primestar_projects`, `primestar_sows`, `primestar_quotations`, `primestar_purchase_orders`, `primestar_candidates`, `primestar_employees`, `primestar_timesheets`, `primestar_notifications`, `primestar_profile_requests`, `primestar_user_preferences`, `primestar_custom_documents`, `primestar_deleted_doc_ids`, `primestar_employee_assignments`.
- **Pre-Migration Backup Verification**:
  1. Reads raw JSON strings from all 13 keys into a `snapshot` object.
  2. Writes `localStorage.setItem('primestar_backup_' + timestamp, JSON.stringify(snapshot))`.
  3. **Verification Check**: Reads back `localStorage.getItem('primestar_backup_' + timestamp)`, parses JSON, and verifies that all 13 key entries exist in the stored backup.
  4. If backup creation, JSON stringification, storage write, or backup verification fails (or throws `QuotaExceededError`), **migration is aborted immediately**, zero records are mutated, and an explicit error alert is displayed.
- **Recovery Procedure**: `restoreFromBackup(backupKey)` restores raw JSON strings from the backup snapshot back into individual `localStorage` keys if post-migration validation fails.

### 2. Credit-Note Consistency & Formula Status Rules
- **Consistent Eligible Credit Calculation**:
  $$\text{Eligible Amount to Credit} = \sum \text{Tax Invoices (Issued / Paid)} - \sum \text{Credit Notes (Issued / Paid)}$$
- **Status Effect Matrix**:
  - `Issued` / `Paid`: Active financial transactions. Mutate net invoiced totals and PO balances.
  - `Pending`: Draft/unapproved status. Has **zero financial effect** on active PO balance or net invoiced totals until approved and transitioned to `Issued` or `Paid`.
  - `Cancelled`: Voided status. Has **zero financial effect** across all metrics.
- **Single-Application Balance Restoration**: All invoice and credit note amounts are stored as **positive numbers ($> 0$)**. Active credit notes (`isCreditNote: true` with status `Issued` or `Paid`) restore available PO balance exactly once via:
  $$\text{Remaining PO Balance} = \text{PO Value Excl GST} - (\text{Gross Active Tax Invoiced} - \text{Total Active Credit Notes})$$

### 3. Historical Data & Financial Preservation Guarantee
- **No Historical Overwrite**: No existing project codes, PO numbers, invoice numbers, credit notes, payment statuses, or activity audit logs will be reset, deleted, overwritten, or re-seeded.
- **Discrepancy Reporting**: Any pre-existing data inconsistency found during migration is logged to an audit report rather than silently overwriting historical financial records.
- **Authoritative Line-Item Source**: `po.invoices` array inside each Purchase Order is the single authoritative line-item source of truth. Summary totals (`po.invoicedExclGst`, `po.creditNotesExclGst`, `po.remainingBalanceExclGst`, Project totals, Dashboard, and Reports) are derived dynamically via `poUtils.ts`.

### 4. Self-Excluding Allocation & Configurable Hours
- **Self-Exclusion**: Editing an assignment excludes `editingAssignment.id` from the employee's active allocation sum before adding the requested allocation percentage. If $\text{Existing Active Allocation} + \text{New Allocation} > 100\%$, saving is strictly blocked with a clear validation toast.
- **Configurable Hours**: Monthly allocated hours are computed as $\text{Configurable Standard Monthly Hours} \times (\text{Allocation \%} / 100)$, where standard monthly working hours defaults to **160 hours** (20 days $\times$ 8 hrs) and remains configurable.

---

## 1. Overview & Core Concept

### What It Does
This enhancement extends Prime Star HRMS across four core operational areas:
1. **Multi-Manager Projects & Manager-Wise Groupings**: Projects support multiple assigned Project Managers. Project team rosters display employees grouped under their respective managers without duplicating employee profile records.
2. **Decoupled PO & Assignment Governance**: `poRequester`, `projectManagers`, and `assignedEmployee` exist as independent relational links.
3. **Multi-PO Split-Time Allocations**: Employees can be allocated across multiple POs/projects simultaneously (tracking allocation percentage and monthly hours) capped strictly at 100% total active capacity.
4. **Monthly Invoice Billing Ledgers**: Invoices feature explicit Month (Jan–Dec) and Year selectors for operational billing tracking, supporting partial or multiple milestone invoices per month while preserving credit-note & cancellation rules.

---

## 2. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND APP                              │
│                                                                             │
│  ┌────────────────────┐   ┌─────────────────────┐   ┌────────────────────┐  │
│  │   Projects View    │   │  PO Tracker View    │   │  Assignments View  │  │
│  │(Manager Groupings) │   │ (PO Requester Decou)│   │ (Split-Time & 100%)│  │
│  └─────────┬──────────┘   └──────────┬──────────┘   └─────────┬──────────┘  │
│            │                         │                        │             │
│            └─────────────────────────┼────────────────────────┘             │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            DATA CONTEXT                               │  │
│  │                                                                       │  │
│  │  - Verified Backup Snapshot Creation across 13 Inspected Storage Keys │  │
│  │  - Idempotent Migration Transformer (_migrated_v2 check)              │  │
│  │  - Authoritative Financial Derivation Engine (poUtils.ts)             │  │
│  │  - Dynamic Dashboard & Executive Reports Integration                  │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOCAL STORAGE PERSISTENCE                         │
│                                                                             │
│  [13 Standard App Keys] + [primestar_backup_<timestamp>]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model Changes (`src/types/domain.ts`)

```typescript
// 1. Extended Project Interface
export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  projectManager: string;       // Primary PM (backward compatible)
  projectManagers?: string[];   // Multi-manager array
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'On Hold';
  description?: string;
  totalPoValue?: number;
  remainingBalance?: number;
  assignedHeadcount?: number;
  _migrated_v2?: boolean;
}

// 2. Extended Purchase Order Interface
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectId: string;
  projectName: string;
  poRequester: string;          // Decoupled PO Requester
  amountExclGst: number;
  gstRate: number;
  amountInclGst: number;
  invoicedExclGst: number;
  creditNotesExclGst: number;
  remainingBalanceExclGst: number;
  invoices: Invoice[];
  activityLogs?: POActivityLog[];
  _migrated_v2?: boolean;
}

// 3. Extended Employee Assignment Interface
export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department?: string;
  projectId: string;
  projectName: string;
  poId?: string;
  poNumber?: string;
  projectManager?: string;       // Assigned manager for grouping
  assignedFrom: string;
  assignedTo: string;
  allocationPercentage: number;  // Capped at 100% total
  allocatedHoursPerMonth?: number; // Calculated hours (alloc % * standard hours)
  billingRatePerMonth?: number;
  status: AssignmentStatus;
  notes?: string;
}

// 4. Extended Invoice Interface
export interface Invoice {
  id: string;
  poId: string;
  invoiceNumber: string;
  invoiceDate: string;
  billingMonth: string;          // E.g., "October"
  billingYear: number;           // E.g., 2026
  billingPeriod?: string;        // E.g., "October 2026"
  amountExclGst: number;         // Stored positive (> 0)
  gstRate: number;               // Dynamic stored rate (e.g. 18, 12, 5)
  gstAmount: number;             // Calculated using stored gstRate
  totalAmountInclGst: number;
  status: InvoiceStatus;
  isCreditNote?: boolean;
  notes?: string;
}
```

---

## 3. Module-by-Module Implementation & Testing Checklist

### Module 1: Data Model, Verified Backup & Migration Layer (`DataContext.tsx`, `poUtils.ts`, `domain.ts`)
- [ ] Extend TypeScript interfaces in `domain.ts` for `Project`, `PurchaseOrder`, `EmployeeAssignment`, and `Invoice`.
- [ ] Add `createVerifiedLocalStorageBackup()` covering all 13 `localStorage` keys in `DataContext.tsx` with verification & quota exception handling.
- [ ] Implement `migrateLegacyDataIdempotent()` in `DataContext.tsx` that safely transforms stored JSON and sets `_migrated_v2: true`.
- [ ] Update `recalculatePOBalances()` in `poUtils.ts` to enforce positive credit-note storage, single-application balance restoration, Pending status exclusions, and dynamic stored GST rates.
- [ ] Implement `validateNewInvoiceAmount()` and `validateNewCreditNoteAmount()` helper functions in `poUtils.ts`.

### Module 2: Projects & Multi-Manager Employee Groupings (`ProjectsView.tsx`)
- [ ] Update Project Modal with searchable multi-manager selection.
- [ ] Display Project Managers as clean badges on project cards and tables.
- [ ] Render team members grouped under their respective managers without duplicating canonical employee profile records.

### Module 3: Employee Assignments & Allocation Safety (`AssignmentsView.tsx`)
- [ ] Ensure PO Requester, Project Manager, and Employee Assignment selection dropdowns operate independently.
- [ ] Add `allocatedHoursPerMonth` calculation field using configurable monthly hours (default 160 hrs).
- [ ] Implement self-excluding allocation sum validation ($> 100\%$ validation error block).

### Module 4: Purchase Orders, Ledgers & Monthly Invoicing (`POTrackerMain.tsx`, `PODetailPage.tsx`, `POInvoiceModal.tsx`, `InvoicesView.tsx`)
- [ ] Keep `poRequester` independent from project managers in PO creation and edit modals.
- [ ] Add explicit Month (Jan–Dec) and Year dropdown selectors to PO Invoice creation modal.
- [ ] Support partial/multiple invoices per billing month while enforcing remaining PO balance limits.
- [ ] Validate credit notes against eligible previously invoiced tax totals regardless of remaining PO balance.

### Module 5: Admin Dashboard & Executive Reports Integration (`AdminDashboardView.tsx`, `ReportsView.tsx`)
- [ ] Re-wire `AdminDashboardView.tsx` to compute summary metrics dynamically from `purchaseOrders`, `projects`, `candidates`, `timesheets`, and `notifications`.
- [ ] Reconcile Executive Reports financial tables and charts against live PO details and invoice ledgers.

---

## 4. Extended Unit Test Suite (15 Scenarios)

New Vitest unit tests will be added in `src/services/__tests__/financialAndAllocation.test.ts`:

1. **Test Scenario 1 (Multi-Manager Grouping)**: Verify projects support `projectManagers: string[]` and group assigned employees under each manager without duplicate employee profile records.
2. **Test Scenario 2 (Independent PO Requester)**: Verify `poRequester` remains separate from project managers during PO creation, update, and renewal.
3. **Test Scenario 3 (Allocation Cap on New Assignment)**: Verify creating an assignment that pushes total active allocation $> 100\%$ is blocked.
4. **Test Scenario 4 (Allocation Cap Self-Exclusion on Edit)**: Verify editing an assignment excludes `editingAssignment.id` from the existing allocation sum before validating the new value.
5. **Test Scenario 5 (Multiple Invoices in Same Billing Month)**: Verify issuing two partial invoices (e.g. ₹5L + ₹3L) for the same billing month on a ₹10L PO succeeds and updates remaining balance to ₹2L.
6. **Test Scenario 6 (Billing Period Migration)**: Verify legacy invoices without `billingMonth` have billing period derived correctly from `invoiceDate`.
7. **Test Scenario 7 (Invoice Overbilling Prevention)**: Verify attempting to issue a tax invoice greater than remaining PO balance is blocked.
8. **Test Scenario 8 (Credit Note on Low Remaining PO Balance)**: Verify a credit note is accepted when remaining PO balance is zero, provided issued tax invoices exist on the PO.
9. **Test Scenario 9 (Credit Note Restoration & Subsequent Invoice)**: Verify issuing a credit note restores PO balance exactly once, allowing a subsequent tax invoice to be issued.
10. **Test Scenario 10 (Credit Note Cancellation Effect)**: Verify cancelling a credit note removes its balance restoration effect with zero net double-counting.
11. **Test Scenario 11 (Dynamic GST Rates)**: Verify invoices with 12% or 5% GST calculate `gstAmount` and `totalAmountInclGst` using their stored rate rather than hardcoding 18%.
12. **Test Scenario 12 (Pending Credit Note Inaction)**: Verify a Pending credit note has zero financial effect on active PO balance until approved/issued.
13. **Test Scenario 13 (Backup Failure Abort)**: Verify migration aborts without mutating data if `localStorage` backup creation or verification fails.
14. **Test Scenario 14 (Interrupted Migration Recovery & Re-runs)**: Verify interrupted migration re-runs safely using `_migrated_v2` markers without duplicating records or audit logs.
15. **Test Scenario 15 (Financial Reconciliation Across Screens)**: Verify PO detail ledger, master invoice table, and executive reports display identical net invoiced and remaining balance totals.

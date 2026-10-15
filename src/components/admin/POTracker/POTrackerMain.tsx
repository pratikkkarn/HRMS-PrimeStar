import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useRole } from '../../../context/RoleContext';
import { StatCard, Badge, Button, Card, Modal, Input } from '../../common/UIComponents';
import { formatINR, formatINRCompact, formatDate, getDaysRemaining } from '../../../lib/utils';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  RotateCcw,
  Building2,
  DollarSign,
  Briefcase,
  FolderOpen,
} from 'lucide-react';
import { POCreateModal } from './POCreateModal';
import { PODetailPage } from './PODetailPage';
import { PurchaseOrder } from '../../../types/domain';

interface POTrackerMainProps {
  selectedPoId?: string;
  initialStatusFilter?: string;
  initialProjectFilter?: string;
  onNavigate?: (tab: string, params?: any) => void;
}

export const POTrackerMain: React.FC<POTrackerMainProps> = ({
  selectedPoId,
  initialStatusFilter,
  initialProjectFilter,
  onNavigate,
}) => {
  const { purchaseOrders, projects, updatePO, deletePO } = useData();
  const { permissions, currentUser } = useRole();

  const [activePoId, setActivePoId] = useState<string | null>(selectedPoId || null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Edit PO state
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [editPoNumber, setEditPoNumber] = useState('');
  const [editRequester, setEditRequester] = useState('');
  const [editAmountExclGst, setEditAmountExclGst] = useState<number>(0);
  const [editGstRate, setEditGstRate] = useState<number>(18);
  const [editNotes, setEditNotes] = useState('');

  // Delete confirmation state
  const [deletingPoId, setDeletingPoId] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (initialProjectFilter) {
      setProjectFilter(initialProjectFilter);
    }
  }, [initialProjectFilter]);

  React.useEffect(() => {
    if (selectedPoId) {
      setActivePoId(selectedPoId);
    }
  }, [selectedPoId]);

  // Dynamic Summary Metrics
  const summary = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const activePOs = purchaseOrders.filter((p) => p.status === 'Active').length;
    const expiringSoon = purchaseOrders.filter((p) => p.status === 'Expiring Soon').length;
    const lowBalance = purchaseOrders.filter((p) => p.status === 'Low Balance').length;

    const totalPOValue = purchaseOrders.reduce((sum, p) => sum + (p.amountExclGst || 0), 0);
    const remainingBalance = purchaseOrders.reduce(
      (sum, p) => sum + (p.remainingBalanceExclGst || 0),
      0
    );

    return {
      totalPOs,
      activePOs,
      expiringSoon,
      lowBalance,
      totalPOValue,
      remainingBalance,
    };
  }, [purchaseOrders]);

  // Filtering Logic
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.poRequester.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProject = projectFilter === 'ALL' || po.projectId === projectFilter;
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

      let matchesExpiry = true;
      if (expiryFilter !== 'ALL') {
        const days = getDaysRemaining(po.expiryDate);
        if (expiryFilter === '30') matchesExpiry = days <= 30 && days >= 0;
        else if (expiryFilter === '60') matchesExpiry = days <= 60 && days >= 0;
        else if (expiryFilter === 'EXPIRED') matchesExpiry = days < 0 || po.status === 'Expired';
      }

      return matchesSearch && matchesProject && matchesStatus && matchesExpiry;
    });
  }, [purchaseOrders, searchTerm, projectFilter, statusFilter, expiryFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setProjectFilter('ALL');
    setStatusFilter('ALL');
    setExpiryFilter('ALL');
  };

  const handleOpenEditModal = (po: PurchaseOrder) => {
    setEditingPo(po);
    setEditPoNumber(po.poNumber);
    setEditRequester(po.poRequester);
    setEditAmountExclGst(po.amountExclGst);
    setEditGstRate(po.gstRate || 18);
    setEditNotes(po.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPo) return;

    updatePO(editingPo.id, {
      poNumber: editPoNumber,
      poRequester: editRequester,
      amountExclGst: editAmountExclGst,
      gstRate: editGstRate,
      amountInclGst: editAmountExclGst * (1 + editGstRate / 100),
      notes: editNotes,
    });

    setEditingPo(null);
  };

  const handleConfirmDelete = () => {
    if (deletingPoId) {
      deletePO(deletingPoId);
      setDeletingPoId(null);
    }
  };

  // If viewing a single PO detail page
  const currentViewingPO = purchaseOrders.find((p) => p.id === activePoId);
  if (currentViewingPO) {
    return <PODetailPage po={currentViewingPO} onBack={() => setActivePoId(null)} />;
  }

  const canManage = permissions.canManagePOs || currentUser.role === 'CEO';

  return (
    <div className="space-y-6 text-xs">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 mt-0.5">
            Track purchase orders, expiry dates, financial commitments and project assignments.
          </p>
        </div>

        {canManage && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Add PO
          </Button>
        )}
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total POs"
          value={summary.totalPOs}
          subtitle="Registered orders"
          icon={<FileText className="w-4 h-4 text-blue-600" />}
          onClick={() => resetFilters()}
          className={statusFilter === 'ALL' && projectFilter === 'ALL' && expiryFilter === 'ALL' ? 'ring-2 ring-blue-500/20 bg-blue-50/20' : ''}
        />
        <StatCard
          title="Active POs"
          value={summary.activePOs}
          subtitle="Nominal status"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          onClick={() => {
            resetFilters();
            setStatusFilter('Active');
          }}
          className={statusFilter === 'Active' ? 'ring-2 ring-emerald-500/20 bg-emerald-50/20' : ''}
        />
        <StatCard
          title="Expiring Soon"
          value={summary.expiringSoon}
          subtitle="Within 60 days"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          onClick={() => {
            resetFilters();
            setStatusFilter('Expiring Soon');
          }}
          className={statusFilter === 'Expiring Soon' ? 'ring-2 ring-amber-500/20 bg-amber-50/20' : ''}
        />
        <StatCard
          title="Low Balance"
          value={summary.lowBalance}
          subtitle="< 15% remaining"
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          onClick={() => {
            resetFilters();
            setStatusFilter('Low Balance');
          }}
          className={statusFilter === 'Low Balance' ? 'ring-2 ring-red-500/20 bg-red-50/20' : ''}
        />
        <StatCard
          title="Total PO Value"
          value={formatINRCompact(summary.totalPOValue)}
          subtitle="Committed amount"
          icon={<DollarSign className="w-4 h-4 text-purple-600" />}
          onClick={() => resetFilters()}
        />
        <StatCard
          title="Remaining Balance"
          value={formatINRCompact(summary.remainingBalance)}
          subtitle="Available for billing"
          icon={<Briefcase className="w-4 h-4 text-indigo-600" />}
          onClick={() => resetFilters()}
        />
      </div>

      {/* 3. SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO number, project name, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PROJECT FILTER */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Low Balance">Low Balance</option>
            <option value="Fully Utilized">Fully Utilized</option>
            <option value="Renewed">Renewed</option>
            <option value="Closed">Closed</option>
          </select>

          {/* EXPIRY FILTER */}
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Expiry Dates</option>
            <option value="30">Expiring in 30 Days</option>
            <option value="60">Expiring in 60 Days</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {(searchTerm || projectFilter !== 'ALL' || statusFilter !== 'ALL' || expiryFilter !== 'ALL') && (
            <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 4. PO TABLE OR EMPTY STATE */}
      {purchaseOrders.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-slate-900">No purchase orders yet</h3>
            <p className="text-xs text-slate-500">
              Add a purchase order and associate it with a project.
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Add PO
            </Button>
          )}
        </Card>
      ) : filteredPOs.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-white">
          <p className="text-sm font-semibold text-slate-700">No purchase orders match your filter criteria.</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 bg-white border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">PO Number</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5">Requester</th>
                  <th className="p-3.5">Start Date</th>
                  <th className="p-3.5">End Date</th>
                  <th className="p-3.5 text-right">Amount (Excl. GST)</th>
                  <th className="p-3.5 text-right">Amount (Incl. GST)</th>
                  <th className="p-3.5 text-right">Remaining Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.map((po) => {
                  const daysLeft = getDaysRemaining(po.expiryDate);
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-700">{po.poNumber}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{po.projectName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {po.projectId}</span>
                      </td>
                      <td className="p-3.5 text-slate-700">{po.poRequester}</td>
                      <td className="p-3.5 text-slate-600">{formatDate(po.startDate)}</td>
                      <td className="p-3.5 text-slate-600">
                        {formatDate(po.expiryDate)}
                        {daysLeft <= 60 && daysLeft > 0 && (
                          <span className="block text-[10px] text-amber-600 font-semibold">
                            ({daysLeft}d left)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-medium text-slate-900">
                        {formatINR(po.amountExclGst)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(po.amountInclGst || po.amountExclGst * 1.18)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                        {formatINR(po.remainingBalanceExclGst)}
                      </td>
                      <td className="p-3.5">
                        <Badge status={po.status} />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setActivePoId(po.id)}
                          >
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                                onClick={() => handleOpenEditModal(po)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                onClick={() => setDeletingPoId(po.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EDIT PO MODAL */}
      {editingPo && (
        <Modal
          isOpen={!!editingPo}
          onClose={() => setEditingPo(null)}
          title={`Edit Purchase Order (${editingPo.poNumber})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <Input
              label="PO Number *"
              value={editPoNumber}
              onChange={(e) => setEditPoNumber(e.target.value)}
              required
            />
            <Input
              label="PO Requester *"
              value={editRequester}
              onChange={(e) => setEditRequester(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount Excl. GST (₹) *"
                type="number"
                value={editAmountExclGst}
                onChange={(e) => setEditAmountExclGst(Number(e.target.value))}
                required
              />
              <div>
                <label className="block font-medium text-slate-700 mb-1">GST Rate (%)</label>
                <select
                  value={editGstRate}
                  onChange={(e) => setEditGstRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value={18}>18%</option>
                  <option value={12}>12%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Notes / Comments</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setEditingPo(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPoId && (
        <Modal
          isOpen={!!deletingPoId}
          onClose={() => setDeletingPoId(null)}
          title="Delete Purchase Order"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Are you sure you want to delete this purchase order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDeletingPoId(null)}>
                Cancel
              </Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600" onClick={handleConfirmDelete}>
                Delete PO
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE PO MODAL */}
      {createModalOpen && (
        <POCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onNavigateToProjects={onNavigate ? () => onNavigate('projects') : undefined}
        />
      )}
    </div>
  );
};

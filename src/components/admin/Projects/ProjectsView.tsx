import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, StatCard, Button, Badge, Input, Select, Modal } from '../../common/UIComponents';
import { formatINRCompact, formatDate } from '../../../lib/utils';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wallet,
  CheckCircle,
  XCircle,
  Filter,
  RotateCcw,
  FolderPlus,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects, purchaseOrders, addProject } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [code, setCode] = useState(`PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
  const [projectManager, setProjectManager] = useState('Siddharth Mehta');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');

  // Compute metrics dynamically from projects and linked POs
  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'Active').length;


    let totalPOs = 0;
    let totalPOValue = 0;
    let remainingBalance = 0;

    projects.forEach((p) => {
      const linkedPOs = purchaseOrders.filter((po) => po.projectId === p.id);
      totalPOs += linkedPOs.length;
      linkedPOs.forEach((po) => {
        totalPOValue += po.amountExclGst || 0;
        remainingBalance += po.remainingBalanceExclGst || 0;
      });
    });

    return {
      totalProjects,
      activeProjects,
      totalPOs,
      totalPOValue,
      remainingBalance,
    };
  }, [projects, purchaseOrders]);

  // Filter projects by search and status
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectManager.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
  };

  const resetModalForm = () => {
    setName('');
    setClientName('');
    setCode(`PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
    setProjectManager('Siddharth Mehta');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;

    addProject({
      name: name.trim(),
      clientName: clientName.trim(),
      code: code.trim() || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      projectManager: projectManager.trim() || 'Siddharth Mehta',
      startDate,
      endDate,
      status: 'Active',
    });

    resetModalForm();
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-0.5">
            Manage projects and their associated purchase orders.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetModalForm();
            setModalOpen(true);
          }}
        >
          Add New Project
        </Button>
      </div>

      {/* SUMMARY CARDS (DYNAMIC, INITIALIZED TO ZERO) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Projects"
          value={projectStats.totalProjects}
          subtitle="All registered projects"
          icon={<Briefcase className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="Active Projects"
          value={projectStats.activeProjects}
          subtitle="Currently ongoing"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Total POs"
          value={projectStats.totalPOs}
          subtitle="Linked purchase orders"
          icon={<FileText className="w-4 h-4 text-purple-600" />}
        />
        <StatCard
          title="Total PO Value"
          value={formatINRCompact(projectStats.totalPOValue)}
          subtitle="Total committed amount"
          icon={<DollarSign className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          title="Remaining Balance"
          value={formatINRCompact(projectStats.remainingBalance)}
          subtitle="Unbilled balance"
          icon={<Wallet className="w-4 h-4 text-indigo-600" />}
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name, ID, client, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          {(searchQuery || statusFilter !== 'All') && (
            <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* EMPTY STATE OR PROJECT CARDS */}
      {projects.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FolderPlus className="w-8 h-8 text-blue-600" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-slate-900">No projects yet</h3>
            <p className="text-xs text-slate-500">
              Create a project to organize purchase orders, managers and financial information.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetModalForm();
              setModalOpen(true);
            }}
          >
            Add New Project
          </Button>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-white">
          <p className="text-sm font-semibold text-slate-700">No projects match your filter criteria.</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const projPOs = purchaseOrders.filter((po) => po.projectId === p.id);
            const totalVal = projPOs.reduce((s, po) => s + (po.amountExclGst || 0), 0);
            const remBal = projPOs.reduce((s, po) => s + (po.remainingBalanceExclGst || 0), 0);

            return (
              <Card key={p.id} className="p-5 space-y-4 hover:shadow-md transition-all bg-white border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-blue-600 font-bold block">{p.code}</span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {p.clientName}
                    </p>
                  </div>
                  <Badge status={p.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Total PO Commitment</span>
                    <span className="font-bold font-mono text-slate-900">{formatINRCompact(totalVal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Unbilled Balance</span>
                    <span className="font-bold font-mono text-indigo-700">{formatINRCompact(remBal)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    PM: <strong className="text-slate-800">{p.projectManager}</strong>
                  </span>
                  <span className="font-medium text-slate-700">{projPOs.length} Active POs</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD NEW PROJECT MODAL */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add New Project"
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="Project Name *"
              placeholder="e.g. Core Banking API Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Client Company Name *"
              placeholder="e.g. Apex Financial Corp"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Project ID / Code *"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Input
                label="Project Manager *"
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief project summary or scope description..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />}>
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

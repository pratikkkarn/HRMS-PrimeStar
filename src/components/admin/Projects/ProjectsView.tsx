import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Button, Badge, Input, Modal } from '../../common/UIComponents';
import { formatINRCompact, formatDate } from '../../../lib/utils';
import { Briefcase, Plus, Search, Building2, Users } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects, purchaseOrders, addProject } = useData();
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [code, setCode] = useState(`PRJ-${Math.floor(100 + Math.random() * 900)}`);
  const [projectManager, setProjectManager] = useState('Siddharth Mehta');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName) return;
    addProject({
      name,
      clientName,
      code,
      projectManager,
      startDate,
      endDate,
      status: 'Active',
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Projects Directory</h1>
          <p className="text-slate-500 mt-0.5">
            Overview of active delivery contracts, assigned project managers & financial PO commitments.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
          Add New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const projPOs = purchaseOrders.filter((po) => po.projectId === p.id);
          const totalVal = projPOs.reduce((s, po) => s + po.amountExclGst, 0);
          const remBal = projPOs.reduce((s, po) => s + po.remainingBalanceExclGst, 0);

          return (
            <Card key={p.id} className="p-5 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold block">{p.code}</span>
                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                  <p className="text-slate-500 text-[11px] font-medium mt-0.5">{p.clientName}</p>
                </div>
                <Badge status={p.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total PO Commitment</span>
                  <span className="font-bold font-mono text-slate-900">{formatINRCompact(totalVal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Unbilled Balance</span>
                  <span className="font-bold font-mono text-indigo-700">{formatINRCompact(remBal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
                <span>PM: <strong>{p.projectManager}</strong></span>
                <span>{projPOs.length} Active POs</span>
              </div>
            </Card>
          );
        })}
      </div>

      {modalOpen && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Client Project" maxWidth="md">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input label="Project Name *" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Client Company Name *" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Project Code *" value={code} onChange={(e) => setCode(e.target.value)} required />
              <Input label="Project Manager *" value={projectManager} onChange={(e) => setProjectManager(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <Input label="End Date *" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Create Project</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

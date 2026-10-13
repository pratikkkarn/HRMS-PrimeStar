import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Badge, Modal, Input } from '../common/UIComponents';
import { formatDate } from '../../lib/utils';
import { Clock, Lock, Unlock, Send, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { TimesheetEntry } from '../../types/domain';

export const PortalTimesheets: React.FC = () => {
  const { currentUser } = useRole();
  const { timesheets, submitTimesheet, requestUnlockTimesheet } = useData();

  const employeeTimesheets = timesheets.filter((t) => t.employeeName.includes(currentUser.name.split(' ')[0]) || t.employeeId === currentUser.employeeId);
  const activeTimesheet = employeeTimesheets[0] || timesheets[0];

  const [unlockReason, setUnlockReason] = useState('');
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  const isLocked = activeTimesheet?.status === 'Submitted' || activeTimesheet?.status === 'Approved';

  const handleUnlockRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) return;
    requestUnlockTimesheet(activeTimesheet.id, unlockReason);
    setUnlockModalOpen(false);
    setUnlockReason('');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* HEADER & STATUS */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status={activeTimesheet?.status || 'Draft'} />
              {isLocked && (
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Locked (Submitted to Manager)
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Timesheet Period: {formatDate(activeTimesheet?.periodStartDate || '')} – {formatDate(activeTimesheet?.periodEndDate || '')}
            </h2>
            <p className="text-slate-500">
              Project: <strong className="text-slate-800">{activeTimesheet?.projectName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isLocked && activeTimesheet?.status !== 'Unlock Requested' && (
              <Button
                variant="primary"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={() => submitTimesheet(activeTimesheet.id)}
              >
                Submit Timesheet
              </Button>
            )}

            {isLocked && (
              <Button
                variant="outline"
                icon={<Unlock className="w-3.5 h-3.5" />}
                onClick={() => setUnlockModalOpen(true)}
              >
                Request Timesheet Unlock
              </Button>
            )}
          </div>
        </div>

        {activeTimesheet?.unlockReason && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Unlock requested with reason: <strong>"{activeTimesheet.unlockReason}"</strong>. Awaiting Manager approval.
            </span>
          </div>
        )}

        {/* DAILY LOGS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Work Category</th>
                <th className="p-3">Task Description</th>
                <th className="p-3 text-right">Hours Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTimesheet?.dailyLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{formatDate(log.date)}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {log.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 max-w-md">{log.taskDescription}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{log.hoursSpent} hrs</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td colSpan={3} className="p-3 text-slate-900">
                  Total Weekly Hours Logged
                </td>
                <td className="p-3 text-right font-mono text-indigo-700 text-sm">
                  {activeTimesheet?.totalHours || 40} hrs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* UNLOCK REQUEST MODAL */}
      {unlockModalOpen && (
        <Modal
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          title="Request Timesheet Unlock"
          subtitle="Submitted timesheets are locked to prevent billing discrepancies. Please provide a reason to unlock."
          maxWidth="md"
        >
          <form onSubmit={handleUnlockRequestSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Reason for Unlock *</label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g. Correcting hours spent on Payment Gateway deployment task..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setUnlockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Send Unlock Request to Manager
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

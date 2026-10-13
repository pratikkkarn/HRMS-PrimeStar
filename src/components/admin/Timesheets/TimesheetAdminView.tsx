import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, Button, Badge, Modal } from '../../common/UIComponents';
import { formatDate } from '../../../lib/utils';
import { Clock, CheckCircle2, AlertTriangle, Unlock, Lock } from 'lucide-react';

export const TimesheetAdminView: React.FC = () => {
  const { timesheets, approveTimesheet, rejectTimesheet, approveUnlockTimesheet } = useData();
  const [rejectionModalTsId, setRejectionModalTsId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionModalTsId && rejectionReason.trim()) {
      rejectTimesheet(rejectionModalTsId, rejectionReason);
      setRejectionModalTsId(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Timesheet Administration</h1>
        <p className="text-slate-500 mt-0.5">
          Approve consultant weekly timesheets, inspect logged deliverable hours & handle unlock requests.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Project</th>
                <th className="p-3">Period</th>
                <th className="p-3 text-right">Hours Logged</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Approvals & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{ts.employeeName}</td>
                  <td className="p-3 text-slate-700">{ts.projectName}</td>
                  <td className="p-3 text-slate-600">
                    {formatDate(ts.periodStartDate)} – {formatDate(ts.periodEndDate)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{ts.totalHours} hrs</td>
                  <td className="p-3">
                    <Badge status={ts.status} />
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {ts.status === 'Submitted' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => approveTimesheet(ts.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectionModalTsId(ts.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {ts.status === 'Unlock Requested' && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Unlock className="w-3.5 h-3.5" />}
                        onClick={() => approveUnlockTimesheet(ts.id)}
                      >
                        Approve Unlock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rejectionModalTsId && (
        <Modal
          isOpen={!!rejectionModalTsId}
          onClose={() => setRejectionModalTsId(null)}
          title="Reject / Return Timesheet"
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Reason for Rejection *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify what task details need revision..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setRejectionModalTsId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Return Timesheet
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

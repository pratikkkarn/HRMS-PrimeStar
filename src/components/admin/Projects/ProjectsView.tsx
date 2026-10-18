import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../../context/DataContext';
import { Card, StatCard, Button, Badge, Input, Select, Modal } from '../../common/UIComponents';
import { formatINRCompact, formatDate, formatINR } from '../../../lib/utils';
import {
  processPOReferenceFile,
  validatePOFile,
  ExtractedPOData,
} from '../../../lib/poExtractionUtils';
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
  Filter,
  RotateCcw,
  FolderPlus,
  UserCheck,
  Upload,
  FileUp,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

interface ProjectsViewProps {
  onNavigate?: (tab: string, params?: any) => void;
  initialStatusFilter?: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigate, initialStatusFilter }) => {
  const { projects, purchaseOrders, employees, addProject } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'All');

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Project Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [code, setCode] = useState(`PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedPms, setSelectedPms] = useState<string[]>(['Siddharth Mehta']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Upload PO Reference state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPOData | null>(null);
  const [extractionSource, setExtractionSource] = useState<'ai' | 'local' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available PM list from directory
  const availablePmOptions = useMemo(() => {
    const list = new Set<string>(['Siddharth Mehta', 'Rohan Deshmukh', 'Priya Sharma']);
    employees.forEach((e) => {
      if (e.name) list.add(e.name);
    });
    return Array.from(list).sort();
  }, [employees]);

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
      const pms =
        p.projectManagers && p.projectManagers.length > 0
          ? p.projectManagers
          : [p.projectManager || 'Siddharth Mehta'];
      const pmMatch = pms.some((pm) => pm.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pmMatch;

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
    setSelectedPms(['Siddharth Mehta']);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDescription('');
    setIsPrefilled(false);
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setIsExtracting(false);
    setUploadError(null);
    setExtractedData(null);
    setExtractionSource(null);
    setIsDragging(false);
  };

  const togglePmSelection = (pmName: string) => {
    setSelectedPms((prev) =>
      prev.includes(pmName)
        ? prev.length > 1
          ? prev.filter((p) => p !== pmName)
          : prev
        : [...prev, pmName]
    );
  };

  const handleFileProcess = async (file: File) => {
    const val = validatePOFile(file);
    if (!val.isValid) {
      setUploadError(val.error || 'Invalid file format');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionSource(null);

    try {
      const res = await processPOReferenceFile(file);
      setExtractedData(res.data);
      setExtractionSource(res.source);
    } catch (err: any) {
      console.error('Error processing PO reference file:', err);
      setUploadError(err?.message || 'An error occurred while processing the file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplyExtractionToForm = () => {
    if (!extractedData && !selectedFile) return;

    // Determine values with fallback
    const fallbackName = selectedFile
      ? selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ')
      : '';

    setName(extractedData?.projectName || fallbackName || '');
    setClientName(extractedData?.clientName || '');
    if (extractedData?.projectCode) {
      setCode(extractedData.projectCode);
    } else {
      setCode(`PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    if (extractedData?.startDate) {
      setStartDate(extractedData.startDate);
    }
    if (extractedData?.endDate) {
      setEndDate(extractedData.endDate);
    }

    const descParts: string[] = [];
    if (extractedData?.description) {
      descParts.push(extractedData.description);
    }
    if (extractedData?.poNumber) {
      descParts.push(`PO Reference Ref: ${extractedData.poNumber}`);
    }
    if (extractedData?.amountExclGst) {
      descParts.push(`PO Value: ${formatINR(extractedData.amountExclGst)} (Excl. GST)`);
    }
    setDescription(descParts.join(' | '));

    setIsPrefilled(true);
    setUploadModalOpen(false);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;

    const primaryPm = selectedPms[0] || 'Siddharth Mehta';

    addProject({
      name: name.trim(),
      clientName: clientName.trim(),
      code: code.trim() || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      projectManager: primaryPm,
      projectManagers: selectedPms,
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Projects
          </h1>
          <p className="text-slate-500 mt-0.5">
            Manage projects and their associated purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<Upload className="w-4 h-4 text-blue-600" />}
            onClick={() => {
              resetUploadState();
              setUploadModalOpen(true);
            }}
          >
            Upload PO Reference
          </Button>

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
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Projects"
          value={projectStats.totalProjects}
          subtitle="All registered projects"
          icon={<Briefcase className="w-4 h-4 text-blue-600" />}
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('All');
          }}
          className={statusFilter === 'All' ? 'ring-2 ring-blue-500/20 bg-blue-50/20' : ''}
        />
        <StatCard
          title="Active Projects"
          value={projectStats.activeProjects}
          subtitle="Currently ongoing"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('Active');
          }}
          className={statusFilter === 'Active' ? 'ring-2 ring-emerald-500/20 bg-emerald-50/20' : ''}
        />
        <StatCard
          title="Total POs"
          value={projectStats.totalPOs}
          subtitle="Linked purchase orders"
          icon={<FileText className="w-4 h-4 text-purple-600" />}
          onClick={() => onNavigate?.('po-tracker', { statusFilter: 'ALL' })}
        />
        <StatCard
          title="Total PO Value"
          value={formatINRCompact(projectStats.totalPOValue)}
          subtitle="Total committed amount"
          icon={<DollarSign className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigate?.('po-tracker', { statusFilter: 'ALL' })}
        />
        <StatCard
          title="Remaining Balance"
          value={formatINRCompact(projectStats.remainingBalance)}
          subtitle="Unbilled balance"
          icon={<Wallet className="w-4 h-4 text-indigo-600" />}
          onClick={() => onNavigate?.('po-tracker', { statusFilter: 'ALL' })}
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
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetFilters}
            >
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<Upload className="w-4 h-4 text-blue-600" />}
              onClick={() => {
                resetUploadState();
                setUploadModalOpen(true);
              }}
            >
              Upload PO Reference
            </Button>
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
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-white">
          <p className="text-sm font-semibold text-slate-700">
            No projects match your filter criteria.
          </p>
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
              <Card
                key={p.id}
                className="p-5 space-y-4 hover:shadow-md transition-all bg-white border-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-blue-600 font-bold block">
                      {p.code}
                    </span>
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
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Total PO Commitment
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatINRCompact(totalVal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Unbilled Balance
                    </span>
                    <span className="font-bold font-mono text-indigo-700">
                      {formatINRCompact(remBal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="flex items-center gap-1 flex-wrap">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-slate-500">PMs:</span>
                    {(
                      p.projectManagers && p.projectManagers.length > 0
                        ? p.projectManagers
                        : [p.projectManager || 'Siddharth Mehta']
                    ).map((pm, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 font-semibold px-1.5 py-0.5 rounded text-[10px]"
                      >
                        {pm}
                      </span>
                    ))}
                  </span>
                  <span className="font-medium text-slate-700 shrink-0">
                    {projPOs.length} Active POs
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* UPLOAD PO REFERENCE MODAL */}
      {uploadModalOpen && (
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload PO Reference Document"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* HIDDEN FILE INPUT */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.xls,.xlsx,.xlsm,.csv,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
            />

            {/* DROPZONE AREA */}
            {!isExtracting && !extractedData && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <FileUp className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="font-bold text-slate-900 text-sm">
                    Click to upload or drag & drop PO reference
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Upload client Purchase Order or Statement of Work reference document to automatically extract project details.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                    Excel (XLS, XLSX, XLSM)
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                    CSV / Text
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                    Word (DOC, DOCX)
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium">
                    Images (PNG, JPG)
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 font-medium">
                    Max 10 MB
                  </span>
                </div>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Upload / Extraction Error</p>
                  <p>{uploadError}</p>
                </div>
              </div>
            )}

            {/* EXTRACTION IN PROGRESS SPINNER */}
            {isExtracting && (
              <div className="p-8 bg-blue-50/40 border border-blue-200 rounded-xl text-center space-y-4 flex flex-col items-center justify-center">
                <div className="relative">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Analyzing PO Reference Document...
                  </h4>
                  <p className="text-slate-600 text-xs">
                    Extracting project name, client company, dates, PO numbers, and scope of work for{' '}
                    <span className="font-semibold text-slate-800">{selectedFile?.name}</span>
                  </p>
                </div>
              </div>
            )}

            {/* EXTRACTED METADATA PREVIEW */}
            {extractedData && !isExtracting && (
              <div className="space-y-4">
                {/* EXTRACTION BADGE HEADER */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {extractionSource === 'ai' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 border border-purple-200 text-purple-800 rounded-full text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        AI Extraction Completed (Gemini 2.5 Flash)
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 border border-blue-200 text-blue-800 rounded-full text-[11px] font-bold">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        Document Parser Completed
                      </div>
                    )}
                    {typeof extractedData.confidenceScore === 'number' && (
                      <span className="text-[11px] font-semibold text-slate-600">
                        Match Confidence:{' '}
                        <span className="text-emerald-700 font-bold">
                          {Math.round(extractedData.confidenceScore * 100)}%
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                    {selectedFile?.name}
                  </span>
                </div>

                {/* AMBIGUITY WARNINGS IF ANY */}
                {extractedData.ambiguityReasons && extractedData.ambiguityReasons.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Review Warnings Detected:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {extractedData.ambiguityReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* EXTRACTED VALUES SUMMARY GRID */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 bg-slate-100/70 font-bold text-slate-800 text-xs flex justify-between items-center">
                    <span>Extracted Project Metadata</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Verify values before prefilling form
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-3 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Project Name
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {extractedData.projectName || (
                            <span className="text-slate-400 font-normal italic">
                              Not detected (Will use filename)
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Client Company Name
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {extractedData.clientName || (
                            <span className="text-amber-600 font-normal italic">
                              Not detected (Manual entry required)
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          PO Number / Reference
                        </span>
                        <span className="font-mono text-slate-800 font-bold text-xs">
                          {extractedData.poNumber || (
                            <span className="text-slate-400 font-normal italic">Not detected</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Start Date
                          </span>
                          <span className="font-medium text-slate-800 text-xs">
                            {extractedData.startDate ? (
                              formatDate(extractedData.startDate)
                            ) : (
                              <span className="text-slate-400 italic font-normal">Today</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            End Date
                          </span>
                          <span className="font-medium text-slate-800 text-xs">
                            {extractedData.endDate ? (
                              formatDate(extractedData.endDate)
                            ) : (
                              <span className="text-slate-400 italic font-normal">+1 Year</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          PO Contract Value (Excl. GST)
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {extractedData.amountExclGst ? (
                            formatINR(extractedData.amountExclGst)
                          ) : (
                            <span className="text-slate-400 font-normal italic">
                              Not detected
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Project ID / Code
                        </span>
                        <span className="font-mono font-bold text-blue-600 text-xs">
                          {extractedData.projectCode || (
                            <span className="text-slate-500 font-normal italic">
                              Auto-generates upon submit
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {extractedData.description && (
                    <div className="p-3 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Scope / Description
                      </span>
                      <p className="text-slate-700 text-[11px] line-clamp-2 mt-0.5">
                        {extractedData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL FOOTER ACTIONS */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>

              {extractedData ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetUploadState}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Select Different File
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleApplyExtractionToForm}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Prefill Project Form
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Choose Document
                </Button>
              )}
            </div>
          </div>
        </Modal>
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
            {/* PREFILLED NOTIFICATION BANNER */}
            {isPrefilled && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    Form prefilled from PO Reference document. Review and customize fields as needed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrefilled(false)}
                  className="text-purple-700 hover:text-purple-900 font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Project Managers *
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto">
                  {availablePmOptions.map((pmName) => {
                    const isSelected = selectedPms.includes(pmName);
                    return (
                      <button
                        type="button"
                        key={pmName}
                        onClick={() => togglePmSelection(pmName)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <UserCheck className="w-3 h-3" />}
                        <span>{pmName}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Select one or more managers responsible for this project.
                </p>
              </div>
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
              <label className="block font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
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


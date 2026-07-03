import { useState } from 'react';
import { Invoice, INDIAN_STATES, Customer } from '../types';
import { HiveIcon } from './HiveIcon';
import { getCompanyDetails } from '../utils/companyHelper';
import { generateInvoicePdfBase64 } from '../utils/pdfHelper';
import { supabase } from '../utils/supabaseClient';
import {
  Search,
  Calendar,
  MapPin,
  Plus,
  Download,
  Share2,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface InvoiceDashboardProps {
  invoices: Invoice[];
  onAddInvoiceClick: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  company: any;
  customers: Customer[];
}

export function InvoiceDashboard({
  invoices,
  onAddInvoiceClick,
  onEditInvoice,
  onDeleteInvoice,
  company,
  customers,
}: InvoiceDashboardProps) {
  const companyDetails = {
    tradeName: company?.trade_name || 'BillHive',
    businessSubtitle: company?.business_subtitle || '',
    legalName: company?.legal_name || 'N/A',
    gstin: company?.gstin || 'N/A',
    logo: company?.logo || '',
    addresses: company?.addresses || [],
    bankDetails: {
      bankName: company?.bank_name || 'N/A',
      accountNumber: company?.account_number || 'N/A',
      branch: company?.branch || 'N/A',
      ifscCode: company?.ifsc_code || 'N/A',
    }
  };
  const primaryAddress = companyDetails.addresses.find((a: any) => a.isPrimary) || companyDetails.addresses[0];
  const addressString = primaryAddress 
    ? `${primaryAddress.line1}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.pincode}`
    : 'No office address specified';

  // Filter States
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterState, setFilterState] = useState('');

  // UI interaction states
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [sharingInvoice, setSharingInvoice] = useState<Invoice | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Helpers for date ranges
  const getRanges = () => {
    const today = new Date();
    const formatDateObj = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // This Week: Monday to Sunday
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date().setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // This Month
    const y = today.getFullYear();
    const m = today.getMonth();
    const firstDayThisMonth = new Date(y, m, 1);
    const lastDayThisMonth = new Date(y, m + 1, 0);

    // Last Month
    const firstDayLastMonth = new Date(y, m - 1, 1);
    const lastDayLastMonth = new Date(y, m, 0);

    // This FY (April 1 to March 31)
    let startYearThisFY = y;
    if (m < 3) {
      startYearThisFY = y - 1;
    }
    const firstDayThisFY = new Date(startYearThisFY, 3, 1);
    const lastDayThisFY = new Date(startYearThisFY + 1, 2, 31);

    // Last FY
    const firstDayLastFY = new Date(startYearThisFY - 1, 3, 1);
    const lastDayLastFY = new Date(startYearThisFY, 2, 31);

    return {
      thisWeek: [formatDateObj(monday), formatDateObj(sunday)],
      thisMonth: [formatDateObj(firstDayThisMonth), formatDateObj(lastDayThisMonth)],
      lastMonth: [formatDateObj(firstDayLastMonth), formatDateObj(lastDayLastMonth)],
      thisFY: [formatDateObj(firstDayThisFY), formatDateObj(lastDayThisFY)],
      lastFY: [formatDateObj(firstDayLastFY), formatDateObj(lastDayLastFY)],
    };
  };

  const handleRangeChipClick = (rangeKey: 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisFY' | 'lastFY') => {
    const ranges = getRanges();
    const [start, end] = ranges[rangeKey];
    setStartDate(start);
    setEndDate(end);
  };

  const isRangeActive = (rangeKey: 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisFY' | 'lastFY') => {
    const ranges = getRanges();
    const [start, end] = ranges[rangeKey];
    return startDate === start && endDate === end;
  };

  // Filter application
  const filteredInvoices = invoices.filter((inv) => {
    // Exact match filter (case insensitive) if entered
    if (searchName.trim()) {
      const match = inv.customerName.toLowerCase() === searchName.trim().toLowerCase();
      if (!match) return false;
    }
    // Date range filter
    if (startDate) {
      if (inv.date < startDate) return false;
    }
    if (endDate) {
      if (inv.date > endDate) return false;
    }
    // State filter
    if (filterState) {
      if (inv.state !== filterState) return false;
    }
    return true;
  });

  const ensureInvoicePdfData = async (inv: Invoice): Promise<string> => {
    if (inv.pdfData) return inv.pdfData;
    
    // Compile on the fly
    const customer = customers.find(c => c.companyName === inv.customerName || c.id === inv.customerId);
    const compiledPdf = await generateInvoicePdfBase64(inv, company, customer);
    
    // Save to database silently
    inv.pdfData = compiledPdf;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ pdf_data: compiledPdf })
        .eq('id', inv.id);
      if (error) throw error;
    } catch (err: any) {
      console.warn('Failed to silently cache compiled PDF in database:', err.message);
    }
    
    return compiledPdf;
  };

  // Download PDF file
  const handleDownload = async (inv: Invoice) => {
    try {
      const pdfBase64 = await ensureInvoicePdfData(inv);
      const link = document.createElement('a');
      link.href = pdfBase64;
      link.download = `${inv.invoiceNumber}_${inv.customerName}.pdf`;
      link.click();
    } catch (err: any) {
      alert('Failed to generate or download PDF: ' + err.message);
    }
  };

  // Open view modal and compile preview if missing
  const handleOpenViewInvoice = async (inv: Invoice) => {
    setViewingInvoice(inv);
    try {
      const pdfBase64 = await ensureInvoicePdfData(inv);
      setViewingInvoice({ ...inv, pdfData: pdfBase64 });
    } catch (err: any) {
      console.error('Failed to compile PDF preview:', err.message);
    }
  };

  // Share simulation
  const handleShare = (inv: Invoice) => {
    setSharingInvoice(inv);
  };

  // Export CSV of filtered invoices
  const handleExport = () => {
    if (filteredInvoices.length === 0) {
      alert('No filtered invoices available to export.');
      return;
    }

    setIsExporting(true);
    setExportMessage('');

    try {
      const headers = ['Invoice Number', 'Date', 'Customer Name', 'Amount (Tax Incl.)', 'Status', 'Payment Mode', 'CGST', 'SGST', 'IGST'];
      const rows = filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.date,
        inv.customerName,
        inv.amount,
        inv.status,
        inv.paymentMode || 'N/A',
        inv.taxCgst || 0,
        inv.taxSgst || 0,
        inv.taxIgst || 0
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `billhive_invoices_export_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportMessage('Invoices exported successfully as CSV!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="invoice-dashboard-container" className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Sales Invoices</h1>
          <p className="text-sm text-[#64748b]">Track and manage your business accounts receivables.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-export-invoices"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center px-4 py-2 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            id="btn-create-invoice-top"
            onClick={onAddInvoiceClick}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#3b82f6] hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Invoice
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex items-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          {exportMessage}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Search Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Customer Name Filter - Exact match */}
          <div className="relative md:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name (Exact Match)</label>
            <div className="relative">
              <input
                id="filter-search-name"
                type="text"
                placeholder="Type exact customer name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] placeholder-slate-400 text-slate-800"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              {searchName && (
                <button
                  onClick={() => setSearchName('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Date Filter -> Changed to Date Range with Quick Chips */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="filter-search-start-date"
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400 font-semibold flex-shrink-0">to</span>
              <div className="relative flex-1">
                <input
                  id="filter-search-end-date"
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Quick:</span>
              {[
                { label: 'This Week', key: 'thisWeek' },
                { label: 'This Month', key: 'thisMonth' },
                { label: 'Last Month', key: 'lastMonth' },
                { label: 'This FY', key: 'thisFY' },
                { label: 'Last FY', key: 'lastFY' },
              ].map((chip) => {
                const active = isRangeActive(chip.key as any);
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleRangeChipClick(chip.key as any)}
                    className={`px-2 py-0.5 text-[11px] rounded-full font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#3b82f6] text-white shadow-sm'
                        : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* State Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1">State Filter</label>
            <div className="relative">
              <select
                id="filter-search-state"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-slate-800 appearance-none bg-white"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Filters helper feedback */}
        {(searchName || startDate || endDate || filterState) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>Active filters:</span>
              {searchName && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono">Name: "{searchName}"</span>}
              {startDate && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono">From: {startDate}</span>}
              {endDate && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono">To: {endDate}</span>}
              {filterState && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono">State: {filterState}</span>}
            </div>
            <button
              id="btn-clear-filters"
              onClick={() => {
                setSearchName('');
                setStartDate('');
                setEndDate('');
                setFilterState('');
              }}
              className="text-[#3b82f6] hover:text-[#2563eb] font-semibold flex items-center gap-1 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Invoice Table Grid */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table id="invoice-dashboard-table" className="min-w-full divide-y divide-[#e2e8f0] text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Invoice Number</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Client Name</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Amount</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Date</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">State</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-base font-medium">No matching invoices found</p>
                    <p className="text-xs mt-1">Try relaxing filters or check spelling for exact matches.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      {inv.paymentMode && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {inv.paymentMode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₹ {inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      {inv.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {inv.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Action */}
                      <button
                        onClick={() => handleOpenViewInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Detailed Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Share Action */}
                      <button
                        onClick={() => handleShare(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Share Invoice Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Download Action */}
                      <button
                        onClick={() => handleDownload(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                            onDeleteInvoice(inv.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detailed Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-500 rounded text-white">
                  <HiveIcon className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-wide">Invoice PDF Preview - {viewingInvoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Iframe Viewer */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col items-center justify-center">
              {viewingInvoice.pdfData ? (
                <iframe
                  src={viewingInvoice.pdfData}
                  className="w-full h-full border-0"
                  title="Invoice PDF Preview"
                />
              ) : (
                <div className="p-8 text-center space-y-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto animate-pulse"></div>
                  <p className="text-sm font-semibold text-slate-500">Compiling 3-Page PDF document on the fly...</p>
                  <p className="text-xs text-slate-400">Please wait while the recipient, transporter, and supplier copies are generated.</p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => handleDownload(viewingInvoice)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download PDF
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                Share Invoice {sharingInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setSharingInvoice(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Copy the direct billing checkout link or share instantly via workspace channels.</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs text-slate-600">
              <span className="truncate">https://billhive.io/checkout/{sharingInvoice.invoiceNumber}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://billhive.io/checkout/${sharingInvoice.invoiceNumber}`);
                  alert('Copied to clipboard!');
                }}
                className="ml-2 text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  alert('Shared successfully via WhatsApp!');
                  setSharingInvoice(null);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                WhatsApp
              </button>
              <button
                onClick={() => {
                  alert('Shared successfully via Email!');
                  setSharingInvoice(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

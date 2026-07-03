import { useState } from 'react';
import { Customer, INDIAN_STATES } from '../types';
import {
  Search,
  Phone,
  MapPin,
  UserPlus,
  FileSpreadsheet,
  Eye,
  Edit2,
  Trash2,
  X,
  Building,
  Landmark,
  User,
  CheckCircle,
} from 'lucide-react';
import { HiveIcon } from './HiveIcon';

interface CurrentCustomersProps {
  customers: Customer[];
  onAddCustomerClick: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CurrentCustomers({
  customers,
  onAddCustomerClick,
  onEditCustomer,
  onDeleteCustomer,
}: CurrentCustomersProps) {
  // Filter states
  const [searchName, setSearchName] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [filterStates, setFilterStates] = useState<string[]>([]);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // Selected customer for full profile modal view
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Applying Filters
  const filteredCustomers = customers.filter((cust) => {
    // Search based on name both company Name and SPOC (exact match or row containing that string, case insensitive)
    if (searchName.trim()) {
      const searchNameLower = searchName.trim().toLowerCase();
      const companyMatch = cust.companyName.toLowerCase().includes(searchNameLower);
      const spocMatch = (cust.spocDetails?.name || '').toLowerCase().includes(searchNameLower);
      const anyPocMatch = cust.pocs?.some(p => (p.name || '').toLowerCase().includes(searchNameLower)) || false;
      if (!companyMatch && !spocMatch && !anyPocMatch) {
        return false;
      }
    }

    // Search based on mobile number (contains match or exact)
    if (searchNumber.trim()) {
      const searchNumClean = searchNumber.trim().replace(/\D/g, '');
      const mob = (cust.spocDetails?.mobileNumber || '').replace(/\D/g, '');
      const anyMobMatch = cust.pocs?.some(p => (p.mobileNumber || '').replace(/\D/g, '').includes(searchNumClean)) || false;
      if (!mob.includes(searchNumClean) && !anyMobMatch) {
        return false;
      }
    }

    // Multi select state filter
    if (filterStates.length > 0) {
      if (!filterStates.includes(cust.state)) {
        return false;
      }
    }

    return true;
  });

  // Export to CSV of filtered customers
  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      alert('No filtered customers available to export.');
      return;
    }

    setIsExporting(true);
    setExportMessage('');

    try {
      const headers = ['Company Name', 'Primary Address', 'GSTIN', 'State', 'SPOC Name', 'SPOC Email', 'SPOC Phone', 'Pocs (JSON)', 'Bank Details (JSON)'];
      const rows = filteredCustomers.map(c => [
        c.companyName,
        c.addresses?.[0]?.line1 || c.address || '',
        c.addresses?.[0]?.gstin || c.gstin || '',
        c.state,
        c.spocDetails?.name || '',
        c.spocDetails?.email || '',
        c.spocDetails?.mobileNumber || '',
        JSON.stringify(c.pocs || []),
        JSON.stringify(c.bankDetails || {})
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `billhive_customers_export_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportMessage('Customers exported successfully as CSV!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="current-customers-container" className="space-y-6">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Active Customer Directory</h1>
          <p className="text-sm text-[#64748b]">View profile information, tax details, and SPOC contact lines.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-export-customers"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center px-4 py-2 border border-[#e2e8f0] text-sm font-medium rounded-lg text-[#64748b] bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            id="btn-add-customer-top"
            onClick={onAddCustomerClick}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#3b82f6] hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Customer
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex items-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          {exportMessage}
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Search Filters</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Company / SPOC Name Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Company / SPOC Name</label>
            <div className="relative">
              <input
                id="customer-filter-name"
                type="text"
                placeholder="Search based on name..."
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

          {/* Number Search */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number Search</label>
            <div className="relative">
              <input
                id="customer-filter-number"
                type="text"
                placeholder="Search based on number..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] placeholder-slate-400 text-slate-800"
              />
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              {searchNumber && (
                <button
                  onClick={() => setSearchNumber('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* State Multi-Select Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1">State Filter</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-slate-800 bg-white shadow-xs font-medium flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">
                  {filterStates.length === 0
                    ? 'All States'
                    : `${filterStates.length} State${filterStates.length > 1 ? 's' : ''} Selected`}
                </span>
                <span className="text-slate-400 text-2xs">▼</span>
              </button>
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              
              {isStateDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsStateDropdownOpen(false)}
                  />
                  <div className="absolute right-0 left-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-40 p-2 space-y-1">
                    {INDIAN_STATES.map((st) => {
                      const isChecked = filterStates.includes(st);
                      return (
                        <label 
                          key={st} 
                          className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer select-none text-xs text-slate-700 font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFilterStates(filterStates.filter(s => s !== st));
                              } else {
                                setFilterStates([...filterStates, st]);
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 border-[#e2e8f0] focus:ring-blue-500"
                          />
                          <span>{st}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {(searchName || searchNumber || filterStates.length > 0) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>Active filters:</span>
              {searchName && <span className="px-2 py-0.5 bg-blue-50 text-[#3b82f6] rounded-full font-mono">Name: "{searchName}"</span>}
              {searchNumber && <span className="px-2 py-0.5 bg-blue-50 text-[#3b82f6] rounded-full font-mono">Number: "{searchNumber}"</span>}
              {filterStates.length > 0 && <span className="px-2 py-0.5 bg-blue-50 text-[#3b82f6] rounded-full font-mono">States ({filterStates.length})</span>}
            </div>
            <button
              id="btn-customer-clear-filters"
              onClick={() => {
                setSearchName('');
                setSearchNumber('');
                setFilterStates([]);
              }}
              className="text-[#3b82f6] hover:text-[#2563eb] font-semibold flex items-center gap-1 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table id="customer-directory-table" className="min-w-full divide-y divide-[#e2e8f0] text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Company Name</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">SPOC</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">Number</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">GSTIN</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">State</th>
                <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-sm text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-base font-medium">No customers registered yet</p>
                    <p className="text-xs mt-1">Add details manually or fetch with GSTIN to quickly register accounts.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 border-b border-[#e2e8f0]/60">
                      <div className="font-bold text-[#334155]">{cust.companyName}</div>
                      <div className="text-xs text-[#64748b] truncate max-w-xs">{cust.address}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 border-b border-[#e2e8f0]/60">
                      {cust.spocDetails.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[#64748b] border-b border-[#e2e8f0]/60">
                      {cust.spocDetails.mobileNumber ? `+91 ${cust.spocDetails.mobileNumber}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[#64748b] border-b border-[#e2e8f0]/60">
                      {cust.gstin}
                    </td>
                    <td className="px-6 py-4 border-b border-[#e2e8f0]/60">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {cust.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap border-b border-[#e2e8f0]/60">
                      {/* View Action */}
                      <button
                        onClick={() => setViewingCustomer(cust)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => onEditCustomer(cust)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit Customer Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete customer ${cust.companyName}?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Record"
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

      {/* Customer Full Profile Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm tracking-wide">Customer Profile Card</span>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Name & Basic Info */}
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{viewingCustomer.companyName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Primary GSTIN: {viewingCustomer.gstin}</p>
              </div>

              {/* Registered Addresses */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Registered Addresses ({viewingCustomer.addresses?.length || 1})
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {viewingCustomer.addresses && viewingCustomer.addresses.length > 0 ? (
                    viewingCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {addr.type}
                          </span>
                          {addr.stateCode && (
                            <span className="bg-blue-100/80 text-blue-800 font-mono text-2xs px-2 py-0.5 rounded font-bold">
                              State Code: {addr.stateCode}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 space-y-1">
                          <p><span className="text-slate-400 font-medium">Address:</span> {addr.line1}, {addr.city} - {addr.pincode}</p>
                          <p><span className="text-slate-400 font-medium">State:</span> {addr.state}</p>
                          <p className="font-mono text-2xs text-slate-500"><span className="text-slate-400 font-sans font-medium text-xs">GSTIN:</span> {addr.gstin}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800">Primary Address</div>
                      <p><span className="text-slate-400">Address:</span> {viewingCustomer.address}</p>
                      <p><span className="text-slate-400">State:</span> {viewingCustomer.state}</p>
                      <p className="font-mono text-2xs text-slate-500"><span className="text-slate-400 font-sans text-xs">GSTIN:</span> {viewingCustomer.gstin}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SPOC Details */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  Points of Contact (POC)
                </p>
                {viewingCustomer.pocs && viewingCustomer.pocs.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {viewingCustomer.pocs.map((poc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <span className="font-bold text-slate-700 block">
                          POC #{idx + 1} {idx === 0 ? '(Primary SPOC)' : ''}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Name:</span>
                            <span className="font-semibold text-slate-800">{poc.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Mobile:</span>
                            <span className="font-semibold text-slate-800 font-mono">{poc.mobileNumber ? `+91 ${poc.mobileNumber}` : 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 block">Email Address:</span>
                            <span className="font-semibold text-slate-800 font-mono">{poc.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Contact Name:</span>
                      <span className="font-semibold text-slate-800">{viewingCustomer.spocDetails.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mobile:</span>
                      <span className="font-semibold text-slate-800 font-mono">{viewingCustomer.spocDetails.mobileNumber ? `+91 ${viewingCustomer.spocDetails.mobileNumber}` : 'N/A'}</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-slate-400 block">Email Address:</span>
                      <span className="font-semibold text-slate-800 font-mono">{viewingCustomer.spocDetails.email || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  Bank Remittance Profile
                </p>
                {viewingCustomer.bankDetails.bankName ? (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    <div>
                      <span className="text-slate-500 block">Bank Name:</span>
                      <span className="font-semibold text-slate-800">{viewingCustomer.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch:</span>
                      <span className="font-semibold text-slate-800">{viewingCustomer.bankDetails.branch || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number:</span>
                      <span className="font-semibold text-slate-800 font-mono">{viewingCustomer.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">IFSC Code:</span>
                      <span className="font-semibold text-slate-800 font-mono">{viewingCustomer.bankDetails.ifscCode}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bank details provided for this customer.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[#e2e8f0] flex justify-end">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

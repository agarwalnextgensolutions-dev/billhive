import React, { useState } from 'react';
import { Invoice, AppUser } from '../types';
import { Truck, Check, HelpCircle, Save, Plus, ArrowRight, ShieldAlert, FileText, Lock } from 'lucide-react';
import { canUserUpdate, canUserExport } from '../utils/userHelper';

interface EWayBillProps {
  invoices: Invoice[];
  currentUser?: AppUser | null;
}

interface MockEWayBill {
  ewayBillNo: string;
  invoiceNo: string;
  transporterName: string;
  vehicleNo: string;
  fromPlace: string;
  toPlace: string;
  distance: number;
  dateGenerated: string;
}

export function EWayBill({ invoices, currentUser = null }: EWayBillProps) {
  const canUpdate = canUserUpdate(currentUser, 'ewayBill');
  // Mock generated bills list
  const [bills, setBills] = useState<MockEWayBill[]>([
    {
      ewayBillNo: '381920491024',
      invoiceNo: 'INV/2026-27/3819',
      transporterName: 'VRL Logistics Logistics Ltd',
      vehicleNo: 'KA-51-MD-9042',
      fromPlace: 'Bengaluru, KA',
      toPlace: 'Mumbai, MH',
      distance: 980,
      dateGenerated: '2026-06-24',
    },
  ]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [transporterName, setTransporterName] = useState('DTDC Express');
  const [vehicleNo, setVehicleNo] = useState('');
  const [fromPlace, setFromPlace] = useState('Mumbai, Maharashtra');
  const [toPlace, setToPlace] = useState('Pune, Maharashtra');
  const [distance, setDistance] = useState<number>(150);

  const [message, setMessage] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      alert('Please select an invoice to generate its E-Way bill.');
      return;
    }
    if (!vehicleNo.trim()) {
      alert('Please provide transport vehicle registration number.');
      return;
    }

    const selectedInv = invoices.find((inv) => inv.id === selectedInvoiceId);
    const invoiceNo = selectedInv ? selectedInv.invoiceNumber : 'INV/2026/MOCK';

    const randomBillNo = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const newBill: MockEWayBill = {
      ewayBillNo: randomBillNo,
      invoiceNo: invoiceNo,
      transporterName: transporterName.trim(),
      vehicleNo: vehicleNo.trim().toUpperCase(),
      fromPlace: fromPlace.trim(),
      toPlace: toPlace.trim(),
      distance: distance,
      dateGenerated: new Date().toISOString().split('T')[0],
    };

    setBills([newBill, ...bills]);
    setMessage('E-Way Bill generated and registered successfully with National Portal!');
    
    // Clear inputs
    setSelectedInvoiceId('');
    setVehicleNo('');
    
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div id="eway-bill-container" className="space-y-6">
      <div className="border-b border-[#e2e8f0] pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
          <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-[#3b82f6]" />
          E-Way Bill Compliance
        </h1>
        <p className="text-xs sm:text-sm text-[#64748b]">Generate electronic waybills for heavy cargo movement across state borders.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex items-center shadow-sm">
          <Check className="w-4 h-4 mr-2 text-emerald-600" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GENERATOR CARD */}
        <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-sm space-y-4">
          <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#3b82f6]" />
            Issue E-Way Bill
          </h3>
          <p className="text-xs text-[#64748b]">Attach standard invoices and declare transporter detail.</p>

          {!canUpdate ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>You do not have permission to issue new E-Way bills. View-only access.</span>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
            {/* Invoice Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Select Tax Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 focus:border-[#3b82f6]"
              >
                <option value="">-- Choose Invoice --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customerName} (₹{inv.amount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Transporter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Transporter Name</label>
              <input
                type="text"
                required
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 font-medium focus:border-[#3b82f6]"
              />
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Vehicle Registration No. <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. MH-12-PQ-9874"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 focus:border-[#3b82f6]"
              />
            </div>

            {/* From Place */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Origin / Dispatch Location</label>
              <input
                type="text"
                required
                value={fromPlace}
                onChange={(e) => setFromPlace(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 focus:border-[#3b82f6]"
              />
            </div>

            {/* To Place */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Destination Location</label>
              <input
                type="text"
                required
                value={toPlace}
                onChange={(e) => setToPlace(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 focus:border-[#3b82f6]"
              />
            </div>

            {/* Distance */}
            <div>
              <label className="block text-xs font-semibold text-slate-500">Approximate Distance (KM)</label>
              <input
                type="number"
                min={1}
                required
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-slate-800 focus:border-[#3b82f6]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Generate Official E-Way Bill
            </button>
          </form>
          )}
        </div>

        {/* COMPLIANCE LISTING */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <span className="font-bold">E-Way Bill Compliance Notice:</span>
              <p>Under GST rules, generating an E-Way Bill is mandatory for any shipment crossing state boundaries where the total valuation exceeds ₹50,000.</p>
            </div>
          </div>

          <h3 className="font-bold text-base text-[#0f172a]">Generated E-Way Logs</h3>

          <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden divide-y divide-[#e2e8f0]">
            {bills.map((b) => (
              <div key={b.ewayBillNo} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 bg-blue-50 text-[#3b82f6] rounded-md text-xs font-bold font-mono">
                      Bill No: {b.ewayBillNo}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      Invoice ref: {b.invoiceNo}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748b] font-mono">
                    Issued: {b.dateGenerated}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Carrier/Transporter:</span>
                    <span className="font-semibold text-slate-800">{b.transporterName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vehicle No:</span>
                    <span className="font-semibold text-slate-800 font-mono">{b.vehicleNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Route Path:</span>
                    <span className="font-semibold text-slate-800 truncate block">{b.fromPlace} → {b.toPlace}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Declared Distance:</span>
                    <span className="font-semibold text-slate-800 font-mono">{b.distance} KM</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

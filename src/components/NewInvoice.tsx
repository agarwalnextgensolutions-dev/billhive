import React, { useState, useEffect } from 'react';
import { Invoice, Customer, Product, InvoiceItem, CustomerAddress, AppUser } from '../types';
import { getNextInvoiceNumber } from '../utils/invoiceHelper';
import { 
  FileText, 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search, 
  MapPin, 
  Calendar, 
  Truck, 
  User, 
  CheckCircle, 
  Info,
  Package,
  Sparkles,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { AddCustomer } from './AddCustomer';
import { generateInvoicePdfBase64 } from '../utils/pdfHelper';

interface NewInvoiceProps {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onAddCustomer: (customer: Customer) => any;
  onCancel: () => void;
  editingInvoice?: Invoice | null;
  company: any;
  currentUser?: AppUser | null;
}

export function NewInvoice({
  customers,
  products,
  invoices,
  onSaveInvoice,
  onAddCustomer,
  onCancel,
  editingInvoice,
  company,
  currentUser = null,
}: NewInvoiceProps) {
  // Form Basic details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Reference Details with check box same as Invoice
  const [refSameAsInv, setRefSameAsInv] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceDate, setReferenceDate] = useState('');

  // Dispatch details with check box same as Invoice
  const [dispatchSameAsInv, setDispatchSameAsInv] = useState(false);
  const [dispatchDocNo, setDispatchDocNo] = useState('');
  const [dispatchThrough, setDispatchThrough] = useState('');
  const [destination, setDestination] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');

  // Customer & Shipping selection
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [shipToAddress, setShipToAddress] = useState<CustomerAddress | null>(null);

  // Products selection list
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [productSearchText, setProductSearchText] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Cancelled'>('Paid');
  const [paymentMode, setPaymentMode] = useState<string>('');

  // Customer modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Auto-fill or initialize details
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setDate(editingInvoice.date);
      setEwayBillNo(editingInvoice.ewayBillNo || '');
      setDeliveryNote(editingInvoice.deliveryNote || '');
      setPaymentTerms(editingInvoice.termsOfDelivery || ''); // payment terms mapped
      setReferenceNumber(editingInvoice.referenceNumber || '');
      setReferenceDate(editingInvoice.referenceDate || '');
      setRefSameAsInv(editingInvoice.referenceNumber === editingInvoice.invoiceNumber);
      setDispatchDocNo(editingInvoice.dispatchDocNo || '');
      setDispatchSameAsInv(editingInvoice.dispatchDocNo === editingInvoice.invoiceNumber);
      setDispatchThrough(editingInvoice.dispatchThrough || '');
      setDestination(editingInvoice.destination || '');
      setTermsOfDelivery(editingInvoice.termsOfDelivery || '');
      setStatus(editingInvoice.status);
      setPaymentMode(editingInvoice.paymentMode || '');

      const found = customers.find((c) => c.companyName === editingInvoice.customerName);
      if (found) {
        setSelectedCustomerId(found.id);
        setCustomerName(found.companyName);
        if (editingInvoice.shipToAddress) {
          setShipToAddress(editingInvoice.shipToAddress);
        } else if (found.addresses && found.addresses.length > 0) {
          setShipToAddress(found.addresses[0]);
        }
      } else {
        setSelectedCustomerId('custom');
        setCustomerName(editingInvoice.customerName);
      }

      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setInvoiceItems(editingInvoice.items);
      } else {
        // legacy fallback
        setInvoiceItems([
          {
            name: 'Consulting Service / Product',
            hsnCode: '99831300',
            quantity: 1,
            unit: 'Nos',
            rate: editingInvoice.amount / 1.18,
            amount: editingInvoice.amount / 1.18,
          }
        ]);
      }
    } else {
      // Auto-generate invoice details based on the highest bill number
      const nextNum = getNextInvoiceNumber(invoices);
      setInvoiceNumber(nextNum);
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setReferenceDate(todayStr);
      setRefSameAsInv(true);
      setDispatchSameAsInv(false);
      setInvoiceItems([]);
    }
  }, [editingInvoice, customers, invoices]);

  // Mirror invoice number if checkboxes are checked
  useEffect(() => {
    if (refSameAsInv) {
      setReferenceNumber(invoiceNumber);
    }
  }, [invoiceNumber, refSameAsInv]);

  useEffect(() => {
    if (dispatchSameAsInv) {
      setDispatchDocNo(invoiceNumber);
    }
  }, [invoiceNumber, dispatchSameAsInv]);

  // Recalculate invoice total
  useEffect(() => {
    const subtotal = invoiceItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const userState = company?.addresses?.[0]?.state || '';
    const shippingState = shipToAddress?.state || '';
    const isSameState = userState.toLowerCase().trim() === shippingState.toLowerCase().trim();

    const taxCgst = isSameState ? Number((subtotal * 0.09).toFixed(2)) : 0;
    const taxSgst = isSameState ? Number((subtotal * 0.09).toFixed(2)) : 0;
    const taxIgst = !isSameState ? Number((subtotal * 0.18).toFixed(2)) : 0;
    
    setAmount(parseFloat((subtotal + taxCgst + taxSgst + taxIgst).toFixed(2)));
  }, [invoiceItems, company, shipToAddress]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === '' || customerId === 'custom') {
      setCustomerName('');
      setShipToAddress(null);
    } else {
      const found = customers.find((c) => c.id === customerId);
      if (found) {
        setCustomerName(found.companyName);
        if (found.addresses && found.addresses.length > 0) {
          setShipToAddress(found.addresses[0]);
        } else {
          // Fallback constructed address
          setShipToAddress({
            type: 'Billing Address',
            gstin: found.gstin,
            line1: found.address,
            pincode: '',
            city: '',
            state: found.state,
            stateCode: found.gstin ? found.gstin.substring(0, 2) : ''
          });
        }
      }
    }
  };

  // Keyboard navigation focus mover (Enter key triggers next focus)
  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        const focusable = Array.from(
          form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button[type=submit]'
          )
        );
        const index = focusable.indexOf(e.currentTarget);
        if (index > -1 && index + 1 < focusable.length) {
          const nextElement = focusable[index + 1] as HTMLElement | undefined;
          if (nextElement) {
            nextElement.focus();
          }
        }
      }
    }
  };

  // Product dropdown filter matches
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchText.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearchText.toLowerCase()) ||
    (p.hsnCode && p.hsnCode.includes(productSearchText))
  );

  const handleSelectProduct = (product: Product) => {
    const activeParams: Record<string, string> = {};
    if (product.parameters) {
      Object.entries(product.parameters).forEach(([key, value]) => {
        if (value) {
          activeParams[key] = ''; // initialize empty field
        }
      });
    }

    const newItem: InvoiceItem = {
      name: product.name,
      hsnCode: product.hsnCode || '',
      quantity: 1,
      unit: product.unit || 'Nos',
      rate: product.price || 0,
      amount: product.price || 0,
      parameters: activeParams
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setProductSearchText('');
    setShowProductDropdown(false);
  };

  const handleItemPropertyChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? value : item.quantity;
        const r = field === 'rate' ? value : item.rate;
        updated.amount = q * r;
      }
      return updated;
    }));
  };

  const handleItemParamChange = (index: number, paramKey: string, val: string) => {
    setInvoiceItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        parameters: {
          ...item.parameters,
          [paramKey]: val
        }
      };
    }));
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddManualItem = () => {
    const newItem: InvoiceItem = {
      name: '',
      hsnCode: '',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      parameters: {}
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please select or register a customer first.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter an Invoice Number.');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one product item to compile this invoice.');
      return;
    }

    // Validate item inputs
    for (let i = 0; i < invoiceItems.length; i++) {
      const it = invoiceItems[i];
      if (!it.name.trim()) {
        alert(`Product name cannot be empty for row #${i + 1}.`);
        return;
      }
      if (it.quantity <= 0) {
        alert(`Please specify a valid quantity greater than zero for row #${i + 1}.`);
        return;
      }
      if (it.rate < 0) {
        alert(`Unit rate cannot be negative for row #${i + 1}.`);
        return;
      }
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const compiledInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : 'new-' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: invoiceNumber.trim(),
      customerName: customerName.trim(),
      customerId: selectedCustomerId,
      amount: amount,
      date: date || new Date().toISOString().split('T')[0],
      state: shipToAddress?.state || selectedCustomer?.state || 'Maharashtra',
      status: status,
      paymentMode: paymentMode.trim() || undefined,
      
      // Extended fields
      ewayBillNo: ewayBillNo.trim() || undefined,
      deliveryNote: deliveryNote.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      referenceDate: referenceDate || undefined,
      dispatchDocNo: dispatchDocNo.trim() || undefined,
      dispatchThrough: dispatchThrough.trim() || undefined,
      destination: destination.trim() || undefined,
      termsOfDelivery: termsOfDelivery.trim() || undefined,
      shipToAddress: shipToAddress || undefined,
      items: invoiceItems
    };

    // Asynchronously generate PDF before saving to database
    setIsGeneratingPdf(true);
    generateInvoicePdfBase64(compiledInvoice, company, selectedCustomer)
      .then((pdfBase64) => {
        compiledInvoice.pdfData = pdfBase64;
        onSaveInvoice(compiledInvoice);
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
        // Fallback: save without PDF if pdf generation completely fails
        onSaveInvoice(compiledInvoice);
      })
      .finally(() => {
        setIsGeneratingPdf(false);
      });
  };

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  return (
    <div id="new-invoice-container" className="max-w-5xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e2e8f0] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            {editingInvoice ? 'Edit Sales Invoice' : 'Create Sales Invoice'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b]">Draft compliant GST Tax Invoices, attach references, specify ship-to details, and item parameters.</p>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="text-xs sm:text-sm font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-colors flex items-center cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Cancel & Return
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BASIC DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 border-b border-[#e2e8f0] pb-3">
            <FileText className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="font-bold text-base">Basic Details</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: REQUIRED BILLING & REFERENCE INFO */}
            <div className="space-y-6 lg:pr-8">
              <div className="flex items-center gap-2 pb-1">
                <span className="w-1.5 h-6 bg-[#3b82f6] rounded-full"></span>
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Mandatory Billing & References</h4>
              </div>

              {/* Customer selection */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="invoice-customer" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Select Customer <span className="text-red-500">*</span>
                    </label>
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-3 py-1 text-xs font-bold rounded-full bg-[#fef3c7] text-[#78350f] hover:bg-[#fde68a] transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    Add New Customer
                  </button>
                </div>
                <div className="mt-2">
                  <select
                    id="invoice-customer"
                    required
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm bg-white text-slate-800 font-medium"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} (GST: {c.gstin})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid for Invoice Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div>
                  <label htmlFor="invoice-number" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoice-number"
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    onKeyDown={handleKeyDownEnter}
                    placeholder="e.g. INV/2026-27/001"
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono text-slate-900 font-bold bg-slate-50"
                  />
                </div>

                {/* Invoice Date */}
                <div>
                  <label htmlFor="invoice-date" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoice-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={handleKeyDownEnter}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Reference details panel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Reference Info</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#3b82f6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refSameAsInv}
                      onChange={(e) => {
                        setRefSameAsInv(e.target.checked);
                        if (e.target.checked) setReferenceNumber(invoiceNumber);
                      }}
                      className="rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-[#3b82f6]/20"
                    />
                    Same as Invoice No.
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Reference Number */}
                  <div>
                    <label htmlFor="ref-number" className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Reference Number
                    </label>
                    <input
                      id="ref-number"
                      type="text"
                      disabled={refSameAsInv}
                      placeholder="Enter PO or Ref Doc No."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      onKeyDown={handleKeyDownEnter}
                      className="mt-1.5 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-slate-900 font-semibold disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                    />
                  </div>

                  {/* Reference Date */}
                  <div>
                    <label htmlFor="ref-date" className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Reference Date
                    </label>
                    <input
                      id="ref-date"
                      type="date"
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                      onKeyDown={handleKeyDownEnter}
                      className="mt-1.5 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: OPTIONAL DISPATCH & LOGISTICS INFO */}
            <div className="space-y-6 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 pb-1">
                <span className="w-1.5 h-6 bg-slate-400 rounded-full"></span>
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Optional Logistics & Dispatch</h4>
              </div>

              {/* Grid for eway bill and delivery note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* e-Way Bill No. */}
                <div>
                  <label htmlFor="eway-bill" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    e-Way Bill No. <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="eway-bill"
                    type="text"
                    placeholder="12-digit eway bill number"
                    maxLength={12}
                    value={ewayBillNo}
                    onChange={(e) => setEwayBillNo(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKeyDownEnter}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Delivery Note */}
                <div>
                  <label htmlFor="delivery-note" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Delivery Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="delivery-note"
                    type="text"
                    placeholder="e.g. DN-1092"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    onKeyDown={handleKeyDownEnter}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Mode / Terms of Payment */}
              <div>
                <label htmlFor="payment-terms" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Mode / Terms of Payment <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="payment-terms"
                  type="text"
                  placeholder="e.g. Net 30, COD"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  onKeyDown={handleKeyDownEnter}
                  className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-slate-900"
                />
              </div>

              {/* Dispatch Section Panel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Dispatch details</span>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#3b82f6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchSameAsInv}
                      onChange={(e) => {
                        setDispatchSameAsInv(e.target.checked);
                        if (e.target.checked) setDispatchDocNo(invoiceNumber);
                      }}
                      className="rounded border-[#e2e8f0] text-[#3b82f6] focus:ring-[#3b82f6]/20"
                    />
                    Same as Invoice No.
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dispatch Doc No */}
                  <div>
                    <label htmlFor="dispatch-doc" className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Doc No.
                    </label>
                    <input
                      id="dispatch-doc"
                      type="text"
                      disabled={dispatchSameAsInv}
                      placeholder="Doc No."
                      value={dispatchDocNo}
                      onChange={(e) => setDispatchDocNo(e.target.value)}
                      onKeyDown={handleKeyDownEnter}
                      className="mt-1.5 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-slate-900 font-semibold disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                    />
                  </div>

                  {/* Dispatch Through */}
                  <div>
                    <label htmlFor="dispatch-through" className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Through
                    </label>
                    <input
                      id="dispatch-through"
                      type="text"
                      placeholder="e.g. DHL"
                      value={dispatchThrough}
                      onChange={(e) => setDispatchThrough(e.target.value)}
                      onKeyDown={handleKeyDownEnter}
                      className="mt-1.5 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-slate-900"
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <label htmlFor="destination" className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Destination
                    </label>
                    <input
                      id="destination"
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      onKeyDown={handleKeyDownEnter}
                      className="mt-1.5 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Terms of Delivery */}
            <div className="col-span-1 lg:col-span-2 pt-6 border-t border-slate-100">
              <label htmlFor="delivery-terms" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Terms of Delivery <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="delivery-terms"
                rows={2}
                placeholder="Freight paid / FOB / CIF terms of delivery description..."
                value={termsOfDelivery}
                onChange={(e) => setTermsOfDelivery(e.target.value)}
                className="mt-2 block w-full px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SHIP TO ADDRESS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 border-b border-[#e2e8f0] pb-3">
            <MapPin className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="font-bold text-base">Ship To Details</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select which registered business address location this invoice should be shipped to. Address properties will automatically apply.
            </p>

            {selectedCustomerId && selectedCustomerId !== 'custom' && selectedCustomerObj ? (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Available Addresses ({selectedCustomerObj.addresses?.length || 1})
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCustomerObj.addresses && selectedCustomerObj.addresses.length > 0 ? (
                    selectedCustomerObj.addresses.map((addr, idx) => {
                      const isSelected = shipToAddress?.line1 === addr.line1 && shipToAddress?.pincode === addr.pincode;
                      return (
                        <div
                          key={idx}
                          type="button"
                          onClick={() => setShipToAddress(addr)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected 
                              ? 'bg-blue-50/50 border-[#3b82f6] ring-2 ring-[#3b82f6]/15' 
                              : 'bg-white border-[#e2e8f0] hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">{addr.type}</span>
                              {addr.stateCode && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                                  State Code: {addr.stateCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{addr.line1}, {addr.city} - {addr.pincode}</p>
                            <p className="text-xs text-slate-400 font-semibold">{addr.state}</p>
                            <p className="text-[10px] text-[#64748b] font-mono">GSTIN: {addr.gstin}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Default constructed card
                    <div
                      onClick={() => {
                        setShipToAddress({
                          type: 'Primary Address',
                          gstin: selectedCustomerObj.gstin,
                          line1: selectedCustomerObj.address,
                          pincode: '',
                          city: '',
                          state: selectedCustomerObj.state,
                          stateCode: selectedCustomerObj.gstin ? selectedCustomerObj.gstin.substring(0, 2) : ''
                        });
                      }}
                      className="p-4 rounded-xl border text-left bg-blue-50/20 border-[#3b82f6] flex items-start gap-3"
                    >
                      <MapPin className="w-5 h-5 text-[#3b82f6] flex-shrink-0" />
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-slate-800">Primary Registered Address</span>
                        <p className="text-xs text-slate-600 font-medium">{selectedCustomerObj.address}</p>
                        <p className="text-xs text-slate-400 font-semibold">{selectedCustomerObj.state}</p>
                        <p className="text-[10px] text-[#64748b] font-mono">GSTIN: {selectedCustomerObj.gstin}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium py-6">
                Please select a registered customer above to view and select from their registered branch/shipping locations.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: PRODUCTS & LINE ITEMS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center space-x-2 text-slate-900">
              <Package className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="font-bold text-base">Line Item Specification</h3>
            </div>
            {invoiceItems.length > 0 && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {invoiceItems.length} Product{invoiceItems.length > 1 ? 's' : ''} Added
              </span>
            )}
          </div>

          {/* Product Search Input Block */}
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-[#3b82f6]" />
                Search & Add Items
              </label>
              <button
                type="button"
                onClick={handleAddManualItem}
                className="px-3 py-1 text-xs font-bold rounded-full bg-[#fef3c7] text-[#78350f] hover:bg-[#fde68a] transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                Add Manual Row
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by Name, SKU code or HSN number..."
                value={productSearchText}
                onChange={(e) => {
                  setProductSearchText(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] placeholder-slate-400 text-slate-800"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            {/* Absolute Dropdown Match Menu */}
            {showProductDropdown && productSearchText.trim() !== '' && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const activeParams = p.parameters
                      ? Object.keys(p.parameters).filter(k => p.parameters[k] === true || p.parameters[k] === 'true')
                      : [];

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-0.5 flex-1">
                          <p className="text-xs font-bold text-slate-800">{p.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>HSN: {p.hsnCode}</span>
                          </div>
                        </div>
                        
                        {activeParams.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                            {activeParams.map(param => (
                              <span key={param} className="bg-slate-100 text-slate-650 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border border-slate-200/50">
                                {param}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No matching products found. Try registering them in the Products directory.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Items View */}
          <div className="space-y-4">
            {invoiceItems.length > 0 ? (
              <>
                {/* Mobile Line Items Cards (block md:hidden) */}
                <div className="block md:hidden space-y-3">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-500 font-mono">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      {/* Item Description */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemPropertyChange(idx, 'name', e.target.value)}
                          placeholder="Item name..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>

                      {/* Specs / Parameters if any */}
                      {item.parameters && Object.keys(item.parameters).length > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specifications</label>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.keys(item.parameters).map((paramKey) => (
                              <div key={paramKey} className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1">
                                <span className="text-[10px] font-bold text-slate-500">{paramKey}:</span>
                                <input
                                  type="text"
                                  placeholder="Spec"
                                  value={item.parameters?.[paramKey] || ''}
                                  onChange={(e) => handleItemParamChange(idx, paramKey, e.target.value)}
                                  className="w-full text-[11px] font-mono font-bold text-slate-800 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HSN, Qty, Unit, Rate in a 2x2 grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">HSN Code</label>
                          <input
                            type="text"
                            required
                            value={item.hsnCode}
                            onChange={(e) => handleItemPropertyChange(idx, 'hsnCode', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemPropertyChange(idx, 'unit', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                          >
                            <option value="KG">KG</option>
                            <option value="Nos">Nos</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity || ''}
                            onChange={(e) => handleItemPropertyChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required
                            value={item.rate || ''}
                            onChange={(e) => handleItemPropertyChange(idx, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="font-semibold text-slate-500">Item Total:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹ {(item.quantity * item.rate).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Line Items Table (hidden md:block) */}
                <div className="hidden md:block border border-[#e2e8f0] rounded-xl overflow-x-auto shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Product Description & Specs</th>
                        <th className="px-4 py-3 w-32">HSN Code</th>
                        <th className="px-4 py-3 w-24">Qty</th>
                        <th className="px-4 py-3 w-28">Unit</th>
                        <th className="px-4 py-3 w-32">Unit Rate (₹)</th>
                        <th className="px-4 py-3 text-right w-36">Total Value (₹)</th>
                        <th className="px-4 py-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 align-top">
                          <td className="px-4 py-4 text-slate-400 font-bold font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-4 space-y-2">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => handleItemPropertyChange(idx, 'name', e.target.value)}
                              onKeyDown={handleKeyDownEnter}
                              placeholder="Enter item description..."
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] text-xs font-semibold text-slate-800"
                            />
                            {item.parameters && Object.keys(item.parameters).length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {Object.keys(item.parameters).map((paramKey) => (
                                  <div key={paramKey} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-md px-2 py-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{paramKey}:</span>
                                    <input
                                      type="text"
                                      placeholder="Spec"
                                      value={item.parameters?.[paramKey] || ''}
                                      onChange={(e) => handleItemParamChange(idx, paramKey, e.target.value)}
                                      onKeyDown={handleKeyDownEnter}
                                      className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] text-slate-700 font-bold focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              required
                              value={item.hsnCode}
                              onChange={(e) => handleItemPropertyChange(idx, 'hsnCode', e.target.value)}
                              onKeyDown={handleKeyDownEnter}
                              placeholder="HSN"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min={1}
                              required
                              value={item.quantity || ''}
                              onChange={(e) => handleItemPropertyChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                              onKeyDown={handleKeyDownEnter}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemPropertyChange(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] text-xs font-semibold text-slate-800 bg-white"
                            >
                              <option value="KG">KG</option>
                              <option value="Nos">Nos</option>
                              <option value="PCS">PCS</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              required
                              value={item.rate || ''}
                              onChange={(e) => handleItemPropertyChange(idx, 'rate', Math.max(0, parseFloat(e.target.value) || 0))}
                              onKeyDown={handleKeyDownEnter}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-[#3b82f6] text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-slate-800 text-sm align-middle">
                            ₹ {(item.quantity * item.rate).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30 text-slate-400 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No Products Added Yet</p>
                <p className="text-2xs max-w-xs mx-auto text-slate-400">Use the dynamic search box above to browse, select and insert itemized details into this billing register.</p>
              </div>
            )}
          </div>

          {/* Aggregate Live Subtotal Box */}
          {invoiceItems.length > 0 && (() => {
            const subtotalVal = invoiceItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
            const userState = company?.addresses?.[0]?.state || '';
            const shippingState = shipToAddress?.state || '';
            const isSameState = userState.toLowerCase().trim() === shippingState.toLowerCase().trim();

            const cgstVal = isSameState ? Number((subtotalVal * 0.09).toFixed(2)) : 0;
            const sgstVal = isSameState ? Number((subtotalVal * 0.09).toFixed(2)) : 0;
            const igstVal = !isSameState ? Number((subtotalVal * 0.18).toFixed(2)) : 0;

            return (
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Taxable Value (Item Subtotal):</span>
                  <span className="font-mono font-semibold text-slate-800">₹ {subtotalVal.toFixed(2)}</span>
                </div>
                
                {isSameState ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>CGST (9%):</span>
                      <span className="font-mono text-amber-600">₹ {cgstVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>SGST (9%):</span>
                      <span className="font-mono text-amber-600">₹ {sgstVal.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>IGST (18%):</span>
                    <span className="font-mono text-amber-600">₹ {igstVal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-[#e2e8f0] pt-2">
                  <span>Grand Total Invoice Amount (Tax Inclusive):</span>
                  <span className="font-mono text-[#3b82f6] text-base">₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* FORM FOOTER ACTION PANEL */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isGeneratingPdf}
            className="w-full sm:w-auto px-5 py-3 border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#64748b] font-semibold text-sm rounded-lg cursor-pointer transition-colors disabled:opacity-50 text-center"
          >
            Cancel & Return
          </button>
          <button
            type="submit"
            id="btn-invoice-save"
            disabled={isGeneratingPdf}
            className="w-full sm:w-auto px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition-colors disabled:opacity-75 disabled:cursor-not-allowed text-center"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Compiling Multi-Page PDF...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                {editingInvoice ? 'Update Invoice Details' : 'Generate Compliance Invoice'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* INLINE "ADD CUSTOMER" MODAL FOR SEAMLESS PROGRESS PRESERVATION */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button" 
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
            <AddCustomer 
              currentUser={currentUser}
              onSaveCustomer={async (newCust) => {
                const saved = await onAddCustomer(newCust);
                setSelectedCustomerId(saved.id);
                setCustomerName(saved.companyName);
                if (saved.addresses && saved.addresses.length > 0) {
                  setShipToAddress(saved.addresses[0]);
                }
                setShowAddCustomerModal(false);
              }}
              onCancel={() => setShowAddCustomerModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

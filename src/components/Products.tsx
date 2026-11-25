import React, { useState, useEffect } from 'react';
import { Product, AppUser } from '../types';
import {
  PackagePlus,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  X,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  isUserAdmin,
  canUserUpdate,
  canUserDelete,
  canUserExport,
} from '../utils/userHelper';

interface ProductsProps {
  products: Product[];
  deletedProducts?: Product[];
  currentUser?: AppUser | null;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRestoreProduct?: (id: string) => void;
  onPermanentDeleteProduct?: (id: string) => void;
  initialShowAddForm?: boolean;
}

export function Products({
  products,
  deletedProducts = [],
  currentUser = null,
  onSaveProduct,
  onDeleteProduct,
  onRestoreProduct,
  onPermanentDeleteProduct,
  initialShowAddForm = false,
}: ProductsProps) {
  // Access control
  const isAdmin = isUserAdmin(currentUser);
  const canUpdate = canUserUpdate(currentUser, 'product');
  const canDelete = canUserDelete(currentUser, 'product');
  const canExport = canUserExport(currentUser, 'product');

  const [viewDeleted, setViewDeleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [searchName, setSearchName] = useState('');
  const [searchHsn, setSearchHsn] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState({
    OD: false,
    ID: false,
    TH: false,
    Table: false,
    Size: false,
    Quantity: false,
    RF: false,
    PCD: false,
    HD: false,
  });

  // Commercial / Tax defaults for BillHive calculation compatibility
  const [price, setPrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [unit, setUnit] = useState('PCS');

  // Success message state
  const [message, setMessage] = useState('');

  // Synchronize state with prop-based tabs
  useEffect(() => {
    setShowAddForm(initialShowAddForm);
    if (!initialShowAddForm) {
      resetForm();
    }
  }, [initialShowAddForm]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setHsnCode('');
    setDescription('');
    setParameters({
      OD: false,
      ID: false,
      TH: false,
      Table: false,
      Size: false,
      Quantity: false,
      RF: false,
      PCD: false,
      HD: false,
    });
    setPrice(0);
    setGstRate(18);
    setUnit('PCS');
  };

  const handleEdit = (p: Product) => {
    if (!canUpdate) return;
    setEditingId(p.id);
    setName(p.name);
    setHsnCode(p.hsnCode || p.sku || '');
    setDescription(p.description || '');

    // Ensure all parameter checkboxes exist
    const defaultParams = {
      OD: false,
      ID: false,
      TH: false,
      Table: false,
      Size: false,
      Quantity: false,
      RF: false,
      PCD: false,
      HD: false,
    };
    setParameters({
      ...defaultParams,
      ...(p.parameters || {}),
    });

    setPrice(p.price || 0);
    setGstRate(p.gstRate || 18);
    setUnit(p.unit || 'PCS');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      alert('You do not have permission to register or update products.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a product/service name.');
      return;
    }
    if (!hsnCode.trim()) {
      alert('Please enter an HSN Code.');
      return;
    }

    const savedProduct: Product = {
      id: editingId || 'new-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      sku: hsnCode.trim().toUpperCase(),
      hsnCode: hsnCode.trim().toUpperCase(),
      description: description.trim() || undefined,
      parameters: { ...parameters },
      price: price > 0 ? price : 1.0,
      gstRate: gstRate,
      unit: unit,
    };

    onSaveProduct(savedProduct);

    const isEdit = !!editingId;
    resetForm();

    setMessage(isEdit ? 'Product successfully updated!' : 'Product successfully added!');
    setTimeout(() => setMessage(''), 3000);
    setShowAddForm(false);
  };

  const activeProductsToFilter = viewDeleted ? deletedProducts : products;

  const filteredProducts = activeProductsToFilter.filter((p) => {
    const nameMatch = !searchName.trim() || p.name.toLowerCase().includes(searchName.trim().toLowerCase());
    const hsnMatch = !searchHsn.trim() || (p.hsnCode || p.sku || '').toLowerCase().includes(searchHsn.trim().toLowerCase());
    return nameMatch && hsnMatch;
  });

  const handleExportCSV = () => {
    if (!canExport) {
      alert('You do not have permission to export product records.');
      return;
    }
    if (filteredProducts.length === 0) {
      alert('No filtered data available to export.');
      return;
    }

    const headers = ['Name', 'HSN Code', 'Parameters', 'Price', 'GST Rate', 'Unit', 'Description'];
    const rows = filteredProducts.map((p) => {
      const activeParams = p.parameters
        ? Object.entries(p.parameters)
            .filter(([_, active]) => active)
            .map(([key]) => key)
            .join('; ')
        : '';
      return [
        p.name,
        p.hsnCode || p.sku || '',
        activeParams,
        p.price,
        p.gstRate,
        p.unit,
        p.description || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `billhive_products_${viewDeleted ? 'deleted_' : ''}export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="products-page-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight font-sans">Enterprise Inventory</h1>
          <p className="text-sm text-[#64748b]">Configure standardized goods, services, and structural fabrication parameters.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!showAddForm && canExport && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
            >
              Export CSV
            </button>
          )}
          {canUpdate && !viewDeleted && (
            <button
              id="btn-toggle-product-form"
              onClick={() => {
                if (showAddForm) {
                  resetForm();
                  setShowAddForm(false);
                } else {
                  setShowAddForm(true);
                }
              }}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-all cursor-pointer shadow-sm"
            >
              {showAddForm ? (
                'View Existing Products'
              ) : (
                <>
                  <PackagePlus className="w-4.5 h-4.5 mr-1.5" />
                  Add Product
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Admin Tab Switcher: Active vs Deleted */}
      {isAdmin && !showAddForm && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setViewDeleted(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              !viewDeleted
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Products ({products.length})
          </button>
          <button
            onClick={() => setViewDeleted(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewDeleted
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            Deleted Items ({deletedProducts.length})
          </button>
        </div>
      )}

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center shadow-sm">
          <CheckCircle className="w-4.5 h-4.5 mr-2 text-emerald-600" />
          {message}
        </div>
      )}

      {showAddForm ? (
        /* ADD / EDIT PRODUCT FORM */
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 border-b border-[#e2e8f0] pb-3">
            <PackagePlus className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="font-bold text-base font-sans">
              {editingId ? 'Edit Product Parameters' : 'Product Registration'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: PRODUCT DETAILS */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Details</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="product-name" className="block text-sm font-semibold text-slate-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    placeholder="e.g. MS Flange Plate Class 150"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-[#0f172a]"
                  />
                </div>

                {/* HSN Code */}
                <div className="sm:col-span-2">
                  <label htmlFor="product-hsn" className="block text-sm font-semibold text-slate-700">
                    HSN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-hsn"
                    type="text"
                    required
                    placeholder="e.g. 73072100"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono text-[#0f172a]"
                  />
                </div>

                {/* Description (Optional) */}
                <div className="sm:col-span-2">
                  <label htmlFor="product-desc" className="block text-sm font-semibold text-slate-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="product-desc"
                    rows={2}
                    placeholder="Provide additional details or application instructions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-[#0f172a]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PARAMETERS (CHECKBOXES) */}
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Parameters</span>
                <span className="text-xs text-[#64748b]">Select the engineering / catalog attributes applicable to this product type.</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-[#e2e8f0]">
                {(Object.keys(parameters) as Array<keyof typeof parameters>).map((param) => (
                  <label
                    key={param}
                    className="flex items-center space-x-2.5 px-3 py-2 bg-white rounded-lg border border-[#e2e8f0]/80 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={parameters[param]}
                      onChange={(e) =>
                        setParameters({
                          ...parameters,
                          [param]: e.target.checked,
                        })
                      }
                      className="w-4.5 h-4.5 text-[#3b82f6] border-[#e2e8f0] rounded focus:ring-[#3b82f6]/20 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">{param}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* FORM FOOTER BUTTONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4.5 py-2.5 border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#64748b] text-sm font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-product-submit"
                className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg flex items-center shadow-sm cursor-pointer"
              >
                <Save className="w-4.5 h-4.5 mr-1.5" />
                {editingId ? 'Update Product' : 'Register Product'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* EXISTING PRODUCTS DIRECTORY */
        <div className="space-y-4">
          {/* Search bar & Metadata row */}
          <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
              {/* Search Name */}
              <div className="relative flex-1">
                <input
                  id="product-search-name"
                  type="text"
                  placeholder="Search based on name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-[#0f172a]"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                {searchName && (
                  <button
                    onClick={() => setSearchName('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search HSN */}
              <div className="relative flex-1">
                <input
                  id="product-search-hsn"
                  type="text"
                  placeholder="Search based on HSN..."
                  value={searchHsn}
                  onChange={(e) => setSearchHsn(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-[#0f172a] font-mono"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                {searchHsn && (
                  <button
                    onClick={() => setSearchHsn('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-[#64748b] font-mono font-medium whitespace-nowrap">
              {viewDeleted ? 'Deleted items' : 'Registered items'}: {filteredProducts.length} line
              {filteredProducts.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Mobile Products Card List */}
          <div className="block md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                <p className="text-sm font-semibold">
                  {viewDeleted ? 'No deleted products found' : 'No products match your search criteria'}
                </p>
                <p className="text-xs mt-1">
                  {viewDeleted
                    ? 'Products soft-deleted by users will appear here.'
                    : 'Register new parameters and parts to easily generate documents.'}
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const activeParams = p.parameters
                  ? Object.entries(p.parameters)
                      .filter(([_, isActive]) => isActive === true)
                      .map(([key]) => key)
                  : [];

                return (
                  <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{p.description}</div>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex-shrink-0">
                        {p.hsnCode || p.sku || '-'}
                      </span>
                    </div>

                    {activeParams.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {activeParams.map((param) => (
                          <span
                            key={param}
                            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                      {viewDeleted ? (
                        <>
                          {onRestoreProduct && (
                            <button
                              onClick={() => onRestoreProduct(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              title="Restore product"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore
                            </button>
                          )}
                          {onPermanentDeleteProduct && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `PERMANENT DELETION WARNING: Are you sure you want to permanently erase ${p.name}? This cannot be undone.`
                                  )
                                ) {
                                  onPermanentDeleteProduct(p.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                              title="Permanently erase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {canUpdate && (
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete product ${p.name}?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table Container */}
          <div className="hidden md:block bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table id="product-list-table" className="min-w-full divide-y divide-[#e2e8f0] text-left">
                <thead className="bg-[#f8fafc] text-[#64748b] text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">
                      HSN Code
                    </th>
                    <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0]">
                      Comma separated Parameters
                    </th>
                    <th scope="col" className="px-6 py-4 border-b border-[#e2e8f0] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-sm text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <p className="text-base font-semibold text-slate-500">
                          {viewDeleted ? 'No deleted products found' : 'No products match your search criteria'}
                        </p>
                        <p className="text-xs mt-1">
                          {viewDeleted
                            ? 'Products soft-deleted by users will appear here.'
                            : 'Register new parameters and parts to easily generate compliant legal documents.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const commaSeparatedParams = p.parameters
                        ? Object.entries(p.parameters)
                            .filter(([_, isActive]) => isActive === true)
                            .map(([key]) => key)
                            .join(', ')
                        : '';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Column 1: Name */}
                          <td className="px-6 py-4 border-b border-[#e2e8f0]/60">
                            <div>
                              <div className="font-bold text-[#334155]">{p.name}</div>
                              {p.description && (
                                <div className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">
                                  {p.description}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Column 2: HSN Code */}
                          <td className="px-6 py-4 font-mono text-xs text-[#475569] font-semibold border-b border-[#e2e8f0]/60">
                            {p.hsnCode || p.sku || '-'}
                          </td>

                          {/* Column 3: Comma separated Parameters */}
                          <td className="px-6 py-4 border-b border-[#e2e8f0]/60">
                            {commaSeparatedParams ? (
                              <span className="text-slate-700 font-medium">{commaSeparatedParams}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">No parameters</span>
                            )}
                          </td>

                          {/* Column 4: Actions */}
                          <td className="px-6 py-4 text-right border-b border-[#e2e8f0]/60 space-x-1.5 whitespace-nowrap">
                            {viewDeleted ? (
                              // Admin recovery actions
                              <>
                                {onRestoreProduct && (
                                  <button
                                    onClick={() => onRestoreProduct(p.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                    title="Restore product"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restore
                                  </button>
                                )}
                                {onPermanentDeleteProduct && (
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `PERMANENT DELETION WARNING: Are you sure you want to permanently erase ${p.name}? This cannot be undone.`
                                        )
                                      ) {
                                        onPermanentDeleteProduct(p.id);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                                    title="Permanently erase"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Permanently
                                  </button>
                                )}
                              </>
                            ) : (
                              // Standard actions with permissions
                              <>
                                {canUpdate && (
                                  <button
                                    onClick={() => handleEdit(p)}
                                    className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete product ${p.name}?`)) {
                                        onDeleteProduct(p.id);
                                      }
                                    }}
                                    className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { SidebarTab, AppUser } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  UserCheck,
  UserPlus,
  Boxes,
  PackagePlus,
  Truck,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';
import { HiveIcon } from './HiveIcon';
import {
  isUserAdmin,
  canUserView,
  canUserUpdate,
} from '../utils/userHelper';

interface SidebarProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  userPhone: string;
  currentUser?: AppUser | null;
  onLogout: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onTabChange,
  isCollapsed,
  setIsCollapsed,
  userPhone,
  currentUser = null,
  onLogout,
  isOpenOnMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    invoicing: true,
    customers: true,
    product: true,
  });

  const toggleSection = (section: 'invoicing' | 'customers' | 'product') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isAdmin = isUserAdmin(currentUser);
  const canAccessAdmin = isAdmin || canUserView(currentUser, 'userManagement');

  const showInvoicing = canUserView(currentUser, 'invoicing');
  const canCreateInvoice = canUserUpdate(currentUser, 'invoicing');

  const showCustomers = canUserView(currentUser, 'customers');
  const canCreateCustomer = canUserUpdate(currentUser, 'customers');

  const showProducts = canUserView(currentUser, 'product');
  const canCreateProduct = canUserUpdate(currentUser, 'product');

  const showEWayBill = canUserView(currentUser, 'ewayBill');
  const showCompanyDetails = canUserView(currentUser, 'companyDetails');

  return (
    <aside
      id="left-sidebar"
      className={`bg-[#0f172a] text-slate-400 flex flex-col border-r border-slate-800 transition-all duration-300 select-none fixed md:static inset-y-0 left-0 z-40 transform md:transform-none shadow-2xl md:shadow-none ${
        isCollapsed ? 'w-20' : 'w-72 max-w-[85vw]'
      } ${
        isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#3b82f6] rounded-lg text-white shadow-sm shadow-blue-500/20">
              <HiveIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">BillHive</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto p-1.5 bg-[#3b82f6] rounded-lg text-white">
            <HiveIcon className="w-5 h-5" />
          </div>
        )}

        {/* Desktop Collapse Button */}
        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {/* Mobile Close Button */}
        <button
          id="btn-close-sidebar-mobile"
          onClick={() => onCloseMobile?.()}
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Navigation Menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        
        {/* 1. ADMIN PANEL - AT THE TOP OF THE LEFT COLUMN */}
        {canAccessAdmin && (
          <div className="pb-3 border-b border-slate-800">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administration</span>
              </div>
            )}
            <button
              id="sidebar-tab-admin-panel"
              onClick={() => onTabChange('admin-panel')}
              className={`w-full flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'admin-panel'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'hover:bg-slate-800 text-amber-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-400" />
              {!isCollapsed && <span className="ml-3 truncate">Admin Panel</span>}
            </button>
          </div>
        )}

        {/* 2. INVOICING GROUP */}
        {showInvoicing && (
          <div>
            {!isCollapsed ? (
              <div
                className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-slate-300"
                onClick={() => toggleSection('invoicing')}
              >
                <span>Invoicing</span>
                <span className="text-[10px] text-slate-600">
                  {expandedSections.invoicing ? '▼' : '▶'}
                </span>
              </div>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(isCollapsed || expandedSections.invoicing) && (
              <div className="mt-1 space-y-1">
                <button
                  id="sidebar-tab-dashboard"
                  onClick={() => onTabChange('invoicing-dashboard')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    currentTab === 'invoicing-dashboard'
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">Dashboard</span>}
                </button>

                {canCreateInvoice && (
                  <button
                    id="sidebar-tab-new-invoice"
                    onClick={() => onTabChange('new-invoice')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      currentTab === 'new-invoice'
                        ? 'bg-[#3b82f6] text-white shadow-sm'
                        : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">New Invoice</span>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. CUSTOMERS GROUP */}
        {showCustomers && (
          <div>
            {!isCollapsed ? (
              <div
                className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-slate-300"
                onClick={() => toggleSection('customers')}
              >
                <span>Customers</span>
                <span className="text-[10px] text-slate-600">
                  {expandedSections.customers ? '▼' : '▶'}
                </span>
              </div>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(isCollapsed || expandedSections.customers) && (
              <div className="mt-1 space-y-1">
                <button
                  id="sidebar-tab-current-customers"
                  onClick={() => onTabChange('current-customers')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    currentTab === 'current-customers'
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">Current Customers</span>}
                </button>

                {canCreateCustomer && (
                  <button
                    id="sidebar-tab-add-customer"
                    onClick={() => onTabChange('add-customer')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      currentTab === 'add-customer'
                        ? 'bg-[#3b82f6] text-white shadow-sm'
                        : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">Add Customer</span>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. PRODUCT GROUP */}
        {showProducts && (
          <div>
            {!isCollapsed ? (
              <div
                className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-slate-300"
                onClick={() => toggleSection('product')}
              >
                <span>Product</span>
                <span className="text-[10px] text-slate-600">
                  {expandedSections.product ? '▼' : '▶'}
                </span>
              </div>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {(isCollapsed || expandedSections.product) && (
              <div className="mt-1 space-y-1">
                <button
                  id="sidebar-tab-current-products"
                  onClick={() => onTabChange('current-products')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    currentTab === 'current-products'
                      ? 'bg-[#3b82f6] text-white shadow-sm'
                      : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">Current Products</span>}
                </button>

                {canCreateProduct && (
                  <button
                    id="sidebar-tab-add-product"
                    onClick={() => onTabChange('add-product')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      currentTab === 'add-product'
                        ? 'bg-[#3b82f6] text-white shadow-sm'
                        : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                    }`}
                  >
                    <PackagePlus className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">Add Product</span>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. COMPLIANCE & SETTINGS */}
        {(showEWayBill || showCompanyDetails) && (
          <div className="pt-2 border-t border-slate-800 space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Compliance & Settings
              </div>
            )}
            {showEWayBill && (
              <button
                id="sidebar-tab-eway-bill"
                onClick={() => onTabChange('eway-bill')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  currentTab === 'eway-bill'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">E-Way Bill</span>}
              </button>
            )}

            {showCompanyDetails && (
              <button
                id="sidebar-tab-company-details"
                onClick={() => onTabChange('company-details')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  currentTab === 'company-details'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Company Details</span>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-col space-y-2">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase flex-shrink-0">
                {currentUser?.name ? currentUser.name[0] : <User className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white font-mono truncate">
                    {currentUser?.userId || 'Angs'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : 'USER'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.name || 'Administrator'}</p>
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              id="btn-logout-collapsed"
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

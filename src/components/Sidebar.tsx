import { useState } from 'react';
import { SidebarTab } from '../types';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  UserCheck,
  UserPlus,
  Package,
  Boxes,
  PackagePlus,
  Truck,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Phone,
} from 'lucide-react';
import { HiveIcon } from './HiveIcon';

interface SidebarProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  userPhone: string;
  onLogout: () => void;
  isOpenOnMobile?: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  isCollapsed,
  setIsCollapsed,
  userPhone,
  onLogout,
  isOpenOnMobile = false,
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

  return (
    <aside
      id="left-sidebar"
      className={`bg-[#0f172a] text-slate-400 flex flex-col border-r border-slate-800 transition-all duration-300 select-none fixed md:static inset-y-0 left-0 z-40 transform md:transform-none ${
        isCollapsed ? 'w-20' : 'w-72'
      } ${
        isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#3b82f6] rounded-lg text-white">
              <HiveIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">BillHive</span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto p-1.5 bg-[#3b82f6] rounded-lg text-white">
            <HiveIcon className="w-5 h-5" />
          </div>
        )}

        {/* Collapse Button */}
        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {/* INVOICING GROUP */}
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
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'invoicing-dashboard'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Dashboard</span>}
              </button>

              <button
                id="sidebar-tab-new-invoice"
                onClick={() => onTabChange('new-invoice')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'new-invoice'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">New Invoice</span>}
              </button>
            </div>
          )}
        </div>

        {/* CUSTOMERS GROUP */}
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
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'current-customers'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Current Customers</span>}
              </button>

              <button
                id="sidebar-tab-add-customer"
                onClick={() => onTabChange('add-customer')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'add-customer'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Add Customer</span>}
              </button>
            </div>
          )}
        </div>

        {/* PRODUCT GROUP */}
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
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'current-products'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Current Products</span>}
              </button>

              <button
                id="sidebar-tab-add-product"
                onClick={() => onTabChange('add-product')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentTab === 'add-product'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                <PackagePlus className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Add Product</span>}
              </button>
            </div>
          )}
        </div>

        {/* OTHERS */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-1 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
              Compliance
            </div>
          )}
          <button
            id="sidebar-tab-eway-bill"
            onClick={() => onTabChange('eway-bill')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              currentTab === 'eway-bill'
                ? 'bg-[#3b82f6] text-white shadow-sm'
                : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">E-Way Bill</span>}
          </button>

          <button
            id="sidebar-tab-company-details"
            onClick={() => onTabChange('company-details')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              currentTab === 'company-details'
                ? 'bg-[#3b82f6] text-white shadow-sm'
                : 'hover:bg-[#1e293b] text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">Company Details</span>}
          </button>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col space-y-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-400">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-mono font-medium truncate">{userPhone}</span>
            </div>
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Logout"
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
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

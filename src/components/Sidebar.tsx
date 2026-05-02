import React from 'react';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, ShoppingCart, Package, Settings, LogOut, Bell, Search, Menu, FolderTree, CreditCard, BarChart, Ticket, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: FolderTree, label: 'Categories', path: '/categories' },
    { icon: Ticket, label: 'Coupons', path: '/coupons' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: BarChart, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-gray-200 w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Package className="w-6 h-6" />
            <span>StoreAdmin</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
              return (
                <button
                  key={i}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

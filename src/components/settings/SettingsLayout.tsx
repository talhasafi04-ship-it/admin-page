import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Settings, Truck, Globe } from 'lucide-react';

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store's configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1">
             <NavLink
                to="/settings"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
             >
                <Globe className="w-4 h-4" />
                General Settings
             </NavLink>
             <NavLink
                to="/settings/shipping"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
             >
                <Truck className="w-4 h-4" />
                Shipping Settings
             </NavLink>
          </nav>
        </aside>

        <main className="flex-1">
           <Outlet />
        </main>
      </div>
    </div>
  );
}

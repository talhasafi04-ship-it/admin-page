import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, ShoppingBag, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = [];
        
        // 1. Fetch pending orders
        const qOrders = query(collection(db, 'orders'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(5));
        const ordersSnap = await getDocs(qOrders);
        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          alerts.push({
            id: `order-${doc.id}`,
            type: 'order',
            title: 'New Order Received',
            message: `Order ${data.orderNumber} is pending processing.`,
            link: `/orders/${doc.id}`,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
            read: false
          });
        });

        // 2. Fetch low stock products
        const qProducts = query(collection(db, 'products'), where('stock', '<=', 15), limit(5));
        const productsSnap = await getDocs(qProducts);
        productsSnap.docs.forEach(doc => {
          const data = doc.data();
          alerts.push({
            id: `stock-${doc.id}`,
            type: 'stock',
            title: 'Low Stock Alert',
            message: `${data.title} has only ${data.stock} units left.`,
            link: `/products/${doc.id}`,
            createdAt: new Date(), // Using current for demo, as products don't continuously alert
            read: false
          });
        });

        // 3. System messages (Mock for demonstration)
        alerts.push({
          id: 'sys-1',
          type: 'system',
          title: 'System Update',
          message: 'The platform was successfully updated to v1.2.0.',
          link: '#',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          read: false
        });

        alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(alerts);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };

    fetchAlerts();

    // Setup click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'stock': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'system': return <Info className="w-4 h-4 text-indigo-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'order': return 'bg-emerald-100';
      case 'stock': return 'bg-amber-100';
      case 'system': return 'bg-indigo-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-20 flex-shrink-0 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders, customers, or products..." 
            className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 relative" ref={dropdownRef}>
        <button 
           onClick={() => setShowNotifications(!showNotifications)}
           className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
             <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute top-full right-14 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                {notifications.length} new
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <li 
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.link && notif.link !== '#') navigate(notif.link);
                      }}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getBgForType(notif.type)}`}>
                        {getIconForType(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">You're all caught up!</p>
                  <p className="text-xs mt-1">No new notifications.</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                <button 
                   onClick={() => setNotifications([])}
                   className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
        
        <button className="flex items-center gap-2 cursor-pointer rounded-full p-1 -mr-1 hover:bg-gray-50">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-4 h-4" />
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-700">{user?.displayName || 'Admin User'}</p>
            <p className="text-[10px] text-gray-500 capitalize">{role || 'Staff'}</p>
          </div>
        </button>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Search, Edit, Trash2, Users, Loader2, ShieldAlert, CheckCircle, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked';
  totalOrders: number;
  totalSpent: number;
  createdAt: any;
  updatedAt?: any;
}

export function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { role } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(data);
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'customers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'block' : 'unblock'} this user?`)) return;
    
    setUpdating(id);
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await updateDoc(doc(db, 'customers', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setCustomers(customers.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `customers/${id}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely delete this user? This action cannot be undone.')) return;
    
    setUpdating(id);
    try {
      await deleteDoc(doc(db, 'customers', id));
      setCustomers(customers.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, 'delete' as any, `customers/${id}`);
    } finally {
      setUpdating(null);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users, view their orders, and update details.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No customers found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                        customer.status === 'active' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {customer.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {customer.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="font-medium bg-gray-100 rounded-full px-3 py-1">{customer.totalOrders || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {role === 'admin' && (
                          <>
                            <button 
                              onClick={() => handleToggleStatus(customer.id, customer.status)}
                              disabled={updating === customer.id}
                              className={cn(
                                "p-1.5 rounded-md transition-colors disabled:opacity-50",
                                customer.status === 'active' 
                                  ? "text-gray-500 hover:text-amber-600 hover:bg-amber-50" 
                                  : "text-red-500 hover:text-emerald-600 hover:bg-emerald-50"
                              )}
                              title={customer.status === 'active' ? 'Block User' : 'Unblock User'}
                            >
                              {updating === customer.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : customer.status === 'active' ? (
                                <ShieldAlert className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button 
                              onClick={() => handleDelete(customer.id)}
                              disabled={updating === customer.id}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

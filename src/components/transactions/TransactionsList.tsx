import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Search, Loader2, CreditCard, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPaymentStatusColor } from '../orders/OrdersList';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface Transaction {
  id: string; // which is orderId
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  transactionId?: string;
  createdAt: any;
  updatedAt: any;
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Querying orders for transactions since transactions map 1:1 with orders for now
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const orderData = doc.data();
        return {
          id: doc.id,
          orderNumber: orderData.orderNumber,
          customer: {
            name: orderData.customer?.name || '',
            email: orderData.customer?.email || ''
          },
          totalAmount: orderData.totalAmount || 0,
          paymentMethod: orderData.paymentMethod || 'Unknown',
          paymentStatus: orderData.paymentStatus || 'unpaid',
          transactionId: orderData.transactionId,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt
        };
      }) as Transaction[];
      setTransactions(data);
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
      t.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.transactionId && t.transactionId.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || t.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">View payment history and transaction details.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Txn ID, or customer..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No transactions found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {txn.orderNumber}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        {txn.createdAt?.seconds 
                          ? format(new Date(txn.createdAt.seconds * 1000), 'MMM d, yyyy h:mm a')
                          : 'Recent'
                        }
                      </div>
                      {txn.transactionId && (
                        <div className="text-xs text-emerald-600 font-mono mt-0.5">
                          Txn: {txn.transactionId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{txn.customer.name}</div>
                      <div className="text-xs text-gray-500">{txn.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {txn.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-md border",
                        getPaymentStatusColor(txn.paymentStatus)
                      )}>
                        {txn.paymentStatus.charAt(0).toUpperCase() + txn.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ${txn.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link 
                        to={`/orders/${txn.id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="View Order"
                      >
                         <ArrowRightLeft className="w-4 h-4" />
                      </Link>
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Customer } from './CustomersList';
import { Order, getOrderStatusColor } from '../orders/OrdersList';
import { ArrowLeft, Loader2, Mail, Phone, Calendar, ShoppingBag, DollarSign, Edit } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerAndOrders();
  }, [id]);

  const fetchCustomerAndOrders = async () => {
    try {
      // 1. Fetch Customer
      const docRef = doc(db, 'customers', id!);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        navigate('/customers');
        return;
      }
      
      const customerData = { id: docSnap.id, ...docSnap.data() } as Customer;
      setCustomer(customerData);

      // 2. Fetch Customer's Orders
      if (customerData.email) {
        const q = query(
          collection(db, 'orders'),
          where('customer.email', '==', customerData.email),
          // orderBy('createdAt', 'desc') - omitting as it requires composite index
        );
        const orderSnap = await getDocs(q);
        let orderData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
        // sort client side
        orderData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setOrders(orderData);
      }
    } catch (error) {
      handleFirestoreError(error, 'get' as any, `customers/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  const joinDate = customer.createdAt?.seconds 
    ? format(new Date(customer.createdAt.seconds * 1000), 'MMM d, yyyy')
    : 'Unknown';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/customers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Profile</h1>
          <span className={cn(
            "px-2.5 py-1 text-xs font-bold rounded-md border",
            customer.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
          )}>
            {customer.status === 'active' ? 'Active' : 'Blocked'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
            <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-700 font-bold text-3xl flex items-center justify-center mb-4">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{customer.name}</h2>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 break-all">
              <Mail className="w-4 h-4" /> {customer.email}
            </p>
          </div>
          
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" /> Phone
              </div>
              <span className="text-sm font-medium text-gray-900">{customer.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" /> Customer Since
              </div>
              <span className="text-sm font-medium text-gray-900">{joinDate}</span>
            </div>
          </div>
        </div>

        {/* Stats & Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 flex items-start gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Spent</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" /> Order History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-900">No orders placed yet</p>
                    <p className="text-sm mt-1">This customer hasn't made any purchases.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {order.createdAt?.seconds 
                          ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, yyyy')
                          : 'Recent'
                       }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md border",
                        getOrderStatusColor(order.status)
                      )}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View Order
                      </button>
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

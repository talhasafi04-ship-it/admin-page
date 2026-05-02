import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Search, Eye, Filter, Loader2, PackageSearch, Plus, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  transactionId?: string;
  trackingNumber?: string;
  courier?: string;
  createdAt: any;
  updatedAt: any;
}

export const getOrderStatusColor = (status: string) => {
  switch(status) {
    case 'delivered': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'processing': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch(status) {
    case 'paid': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'unpaid': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'refunded': return 'text-gray-700 bg-gray-50 border-gray-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(data);
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const simulateOrder = async () => {
    setSimulating(true);
    try {
      // 1. Fetch some products
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const availableProducts = allProducts.filter(p => (p.stock || 0) > 0);
      
      if (availableProducts.length === 0) {
        alert("No products in stock to simulate an order.");
        return;
      }
      
      // Randomly pick 1 to 2 products
      const numItems = Math.floor(Math.random() * 2) + 1;
      const orderItems = [];
      let subtotal = 0;
      
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      for (let i = 0; i < numItems; i++) {
         const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
         const qty = Math.min(Math.floor(Math.random() * 3) + 1, product.stock); // 1 to 3 items
         
         if (qty === 0 || orderItems.some(item => item.productId === product.id)) continue;

         orderItems.push({
            productId: product.id,
            productTitle: product.title,
            quantity: qty,
            price: product.price,
            image: product.images?.[0] || ''
         });
         
         subtotal += product.price * qty;
         
         // Auto-deduct stock
         const newStock = product.stock - qty;
         const newStatus = newStock === 0 ? 'out_of_stock' : product.status;
         batch.update(doc(db, 'products', product.id), { 
            stock: newStock,
            status: newStatus,
            updatedAt: timestamp
         });

         // Check for low stock alert
         if (newStock <= 15 && product.stock > 15) {
             const notifRef = doc(collection(db, 'notifications'));
             batch.set(notifRef, {
                 type: 'stock',
                 title: 'Low Stock Alert',
                 message: `${product.title} has only ${newStock} units left.`,
                 read: false,
                 referenceId: product.id,
                 createdAt: timestamp
             });
         }
      }

      if (orderItems.length === 0) return;

      const tax = subtotal * 0.08;
      const shipping = 5.99;
      const totalAmount = subtotal + tax + shipping;
      const orderNum = `ORD-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      const newOrderInfo = {
        orderNumber: orderNum,
        customer: { name: 'Simulated Customer', email: 'simulate@example.com', phone: '555-0192' },
        shippingAddress: { street: '456 Test Ave', city: 'Commerce', state: 'CA', zip: '90022', country: 'USA' },
        items: orderItems,
        subtotal,
        tax,
        shipping,
        totalAmount,
        status: 'pending',
        paymentMethod: 'Credit Card',
        paymentStatus: 'paid',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, newOrderInfo);

      // Notification for new order
      const orderNotifRef = doc(collection(db, 'notifications'));
      batch.set(orderNotifRef, {
          type: 'order',
          title: 'New Order Received',
          message: `Order ${orderNum} was just placed.`,
          read: false,
          referenceId: orderRef.id,
          createdAt: timestamp
      });

      await batch.commit();
      await fetchOrders();
      alert("Simulated order successfully placed! Inventory was automatically updated.");
    } catch (error) {
      console.error(error);
      alert("Error simulating order.");
    } finally {
      setSimulating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders.</p>
        </div>
        <button 
          onClick={simulateOrder}
          disabled={simulating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
        >
          {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Simulate Customer Order
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by order ID, name, or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No orders found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-xs text-gray-500">{order.customer.email}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md border",
                        getPaymentStatusColor(order.paymentStatus)
                      )}>
                        {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Unknown'}
                      </span>
                      {order.paymentMethod && <div className="text-xs text-gray-500 mt-1">{order.paymentMethod}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
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

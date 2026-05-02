import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Order, getOrderStatusColor, getPaymentStatusColor } from './OrdersList';
import { ArrowLeft, Printer, Loader2, MapPin, Package, User, Mail, Phone, Calendar, CreditCard, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const docRef = doc(db, 'orders', id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      handleFirestoreError(error, 'get' as any, `orders/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;
    setUpdating(true);
    
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setOrder({ ...order, status: newStatus });
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `orders/${order.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentUpdate = async (newStatus: Order['paymentStatus']) => {
    if (!order) return;
    setUpdating(true);
    
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        paymentStatus: newStatus,
        updatedAt: serverTimestamp()
      });
      setOrder({ ...order, paymentStatus: newStatus });
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `orders/${order.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!order) return;
    setUpdating(true);
    
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        trackingNumber: order.trackingNumber || '',
        courier: order.courier || '',
        updatedAt: serverTimestamp()
      });
      // Optionally show a toast here
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `orders/${order.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const orderDate = order.createdAt?.seconds 
    ? format(new Date(order.createdAt.seconds * 1000), 'MMMM d, yyyy h:mm a')
    : 'Recent';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full font-sans print:p-0 print:m-0 print:max-w-none">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link to="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order {order.orderNumber}</h1>
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-md border",
              getOrderStatusColor(order.status)
            )}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-md border",
              getPaymentStatusColor(order.paymentStatus)
            )}>
              {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Order:</span>
            <select 
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value as Order['status'])}
              disabled={updating}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 min-w-[130px]"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Payment:</span>
            <select 
              value={order.paymentStatus || 'unpaid'}
              onChange={(e) => handlePaymentUpdate(e.target.value as Order['paymentStatus'])}
              disabled={updating}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 min-w-[130px]"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <button 
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Area to Print */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        <div className="flex flex-col md:flex-row justify-between mb-8 pb-8 border-b border-gray-100 print:mb-6 print:pb-6">
          <div>
            <h2 className="text-xl font-bold text-indigo-600 mb-1">PHONE FIX PRO</h2>
            <p className="text-sm text-gray-500">Invoice pending, 123 Tech Avenue</p>
            <p className="text-sm text-gray-500">Suite 400, SF, CA 94107</p>
          </div>
          <div className="mt-4 md:mt-0 md:text-right">
            <p className="text-lg font-bold text-gray-900 mb-1">INVOICE</p>
            <p className="text-sm text-gray-600 font-medium">Order #: {order.orderNumber}</p>
            <div className="flex items-center text-sm text-gray-500 md:justify-end mt-1">
              <Calendar className="w-4 h-4 mr-1.5" /> {orderDate}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-100 print:mb-6 print:pb-6 print:grid-cols-2">
          <div className="space-y-3 col-span-1">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4 text-gray-400" /> Customer Details
            </h3>
            <div className="text-sm text-gray-600 space-y-1.5">
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400"/> {order.customer.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400"/> {order.customer.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-3 col-span-1">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-gray-400" /> Shipping Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1.5">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
          
          <div className="space-y-3 col-span-1 print:hidden">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-gray-400" /> Tracking Info
            </h3>
            <div className="text-sm text-gray-600 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Courier</label>
                <input 
                  type="text" 
                  value={order.courier || ''} 
                  onChange={e => setOrder({...order, courier: e.target.value})}
                  placeholder="e.g. FedEx, UPS"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tracking Number</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={order.trackingNumber || ''} 
                    onChange={e => setOrder({...order, trackingNumber: e.target.value})}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={handleTrackingUpdate}
                    disabled={updating}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 print:mb-6">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider mb-4">
            <Package className="w-4 h-4 text-gray-400" /> Order Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Qty</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Price</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-3">
                         {item.image && (
                           <img src={item.image} alt={item.productTitle} className="w-10 h-10 rounded-md object-cover border border-gray-100 print:hidden" />
                         )}
                         <span className="text-sm font-medium text-gray-900">{item.productTitle}</span>
                       </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>${order.shipping?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tax (20%)</span>
              <span>${order.tax?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total Amount</span>
              <span>${order.totalAmount?.toFixed(2)}</span>
            </div>
            {order.paymentMethod && (
               <div className="pt-2 text-xs text-gray-500 text-right print:hidden">
                 Paid via {order.paymentMethod}
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

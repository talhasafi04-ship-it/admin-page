import React, { useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { SalesChart } from './SalesChart';
import { motion } from 'motion/react';
import { DollarSign, ShoppingBag, Users as UsersIcon, Box, AlertTriangle, ChevronRight, PackageCheck, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status: string) => {
  switch(status) {
    case 'delivered': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'processing': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export function Dashboard() {
  const navigate = useNavigate();
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<{ id: string, name: string, stock: number, status: string }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const prodSnapshot = await getDocs(collection(db, 'products'));
        setTotalProducts(prodSnapshot.size);

        const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(qOrders);
        
        setTotalOrders(ordersSnapshot.size);
        let revenue = 0;
        
        // Compute revenue and aggregate product sales
        const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number; image: string }> = {};
        
        const recent: any[] = [];
        ordersSnapshot.docs.forEach((doc, index) => {
           const data = doc.data();
           revenue += (data.totalAmount || 0);
           
           if (index < 5) {
             recent.push({
               id: doc.id,
               orderNumber: data.orderNumber || doc.id,
               customer: data.customer?.name || 'Unknown',
               amount: data.totalAmount || 0,
               status: data.status || 'pending',
             });
           }

           if (Array.isArray(data.items)) {
             data.items.forEach((item: any) => {
               if (!productSalesMap[item.productId]) {
                 productSalesMap[item.productId] = {
                   id: item.productId,
                   name: item.name || 'Unknown Product',
                   quantity: 0,
                   revenue: 0,
                   image: item.images?.[0] || 'https://via.placeholder.com/100' // Default placeholder if missing
                 };
               }
               productSalesMap[item.productId].quantity += item.quantity || 1;
               productSalesMap[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
             });
           }
        });
        
        setTotalRevenue(revenue);
        setRecentOrders(recent);
        
        // Sort and get top 3 products
        const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
        setTopProducts(sortedProducts);

        const customersSnapshot = await getDocs(collection(db, 'customers'));
        setActiveCustomers(customersSnapshot.docs.filter(doc => doc.data().status === 'active').length);

        const lowStock = prodSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title,
              stock: data.stock,
              status: data.stock <= 5 ? 'critical' : 'warning'
            };
          })
          .filter(item => item.stock <= 15)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);
        
        setLowStockItems(lowStock);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">Here's what's happening with your store today.</p>
      </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <StatCard 
                  title="Total Revenue" 
                  value={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                  trend={12.5} 
                  icon={DollarSign} 
                  iconColorClass="text-emerald-600"
                  iconBgClass="bg-emerald-50"
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <StatCard 
                  title="Total Orders" 
                  value={String(totalOrders)} 
                  trend={8.2} 
                  icon={ShoppingBag} 
                  iconColorClass="text-blue-600"
                  iconBgClass="bg-blue-50"
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <StatCard 
                  title="Active Customers" 
                  value={String(activeCustomers)} 
                  trend={-2.4} 
                  icon={UsersIcon} 
                  iconColorClass="text-indigo-600"
                  iconBgClass="bg-indigo-50"
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <StatCard 
                  title="Total Products" 
                  value={String(totalProducts)} 
                  trend={4.1} 
                  icon={Box} 
                  iconColorClass="text-violet-600"
                  iconBgClass="bg-violet-50"
                />
              </motion.div>
            </div>

            {/* Charts & Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Left Column: Chart & Top Products (Spans 2 columns on lg) */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8 flex flex-col">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="h-[400px]"
                >
                  <SalesChart />
                </motion.div>

                {/* Top Selling Products */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex-1"
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                      <p className="text-sm text-gray-500">Highest revenue drivers this month.</p>
                    </div>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center cursor-pointer">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <div className="p-0">
                    <ul className="divide-y divide-gray-100">
                      {topProducts.map((product, i) => (
                        <li key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.quantity} sales</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900">${product.revenue.toFixed(2)}</span>
                          </div>
                        </li>
                      ))}
                      {topProducts.length === 0 && (
                        <li className="p-6 text-center text-sm text-gray-500">No products sold yet.</li>
                      )}
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Recent Orders & Alerts (Spans 1 col on lg) */}
              <div className="space-y-6 sm:space-y-8 flex flex-col">
                
                {/* Low Stock Alerts */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-red-100 overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-100 bg-red-50/50 flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 leading-tight">Inventory Alerts</h3>
                      <p className="text-xs text-red-600 font-medium">
                        {lowStockItems.length} items need restocking
                      </p>
                    </div>
                  </div>
                  <div className="p-0">
                    {lowStockItems.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">All products have sufficient stock.</div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {lowStockItems.map((item, i) => (
                          <li key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <PackageCheck className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[140px] sm:max-w-xs">{item.name}</span>
                            </div>
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-md",
                              item.status === 'critical' ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'
                            )}>
                              {item.stock} left
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>

                {/* Recent Orders */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex-1 flex flex-col"
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <button className="p-1 rounded text-gray-400 hover:bg-gray-100 cursor-pointer">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-0 overflow-y-auto">
                    <ul className="divide-y divide-gray-100">
                      {recentOrders.map((order, i) => (
                        <li key={i} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                            </div>
                            <span className="font-medium text-gray-900 text-sm">${order.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{order.customer}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              getStatusColor(order.status)
                            )}>
                              {order.status}
                            </span>
                          </div>
                        </li>
                      ))}
                      {recentOrders.length === 0 && (
                        <li className="p-6 text-center text-sm text-gray-500">No recent orders found.</li>
                      )}
                    </ul>
                  </div>
                  <div className="p-4 border-t border-gray-100 text-center mt-auto">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">
                      View all orders
                    </button>
                  </div>
                </motion.div>

              </div>
            </div>

    </div>
  );
}

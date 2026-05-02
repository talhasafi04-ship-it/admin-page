import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Loader2, Download, BarChart2, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';

export function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    newCustomers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders for the last 6 months to generate sales & product data
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const qOrders = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'asc')
      );
      
      const ordersSnap = await getDocs(qOrders);
      
      const monthlySales: Record<string, { month: string; revenue: number; orders: number }> = {};
      const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};
      
      let totalSales = 0;
      let totalOrders = 0;

      ordersSnap.docs.forEach(doc => {
        const order = doc.data();
        if (!order.createdAt) return;
        
        const orderDate = new Date(order.createdAt.seconds * 1000);
        if (orderDate >= sixMonthsAgo) {
          const monthKey = format(orderDate, 'MMM yyyy');
          
          if (!monthlySales[monthKey]) {
            monthlySales[monthKey] = { month: monthKey, revenue: 0, orders: 0 };
          }
          
          // only consider paid orders or delivered orders for revenue? Let's consider all for simplicity
          const amount = order.totalAmount || 0;
          monthlySales[monthKey].revenue += amount;
          monthlySales[monthKey].orders += 1;
          
          totalSales += amount;
          totalOrders += 1;

          // Process items for best selling products
          if (Array.isArray(order.items)) {
             order.items.forEach((item: any) => {
               if (!productSalesMap[item.productId]) {
                 productSalesMap[item.productId] = {
                   id: item.productId,
                   name: item.name || 'Unknown',
                   quantity: 0,
                   revenue: 0
                 };
               }
               productSalesMap[item.productId].quantity += item.quantity || 1;
               productSalesMap[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
             });
          }
        }
      });
      
      setSalesData(Object.values(monthlySales));
      
      setProductsData(
        Object.values(productSalesMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)
      );

      // 2. Fetch Customers for growth
      const qCustomers = query(
        collection(db, 'customers'),
        orderBy('createdAt', 'asc')
      );
      const customersSnap = await getDocs(qCustomers);
      
      const monthlyCustomers: Record<string, { month: string; customers: number }> = {};
      let newCustomersCount = 0;
      
      customersSnap.docs.forEach(doc => {
        const cust = doc.data();
        if (!cust.createdAt) return;
        
        const custDate = new Date(cust.createdAt.seconds * 1000);
        if (custDate >= sixMonthsAgo) {
          const monthKey = format(custDate, 'MMM yyyy');
          if (!monthlyCustomers[monthKey]) {
             monthlyCustomers[monthKey] = { month: monthKey, customers: 0 };
          }
          monthlyCustomers[monthKey].customers += 1;
          newCustomersCount += 1;
        }
      });
      
      setCustomerGrowth(Object.values(monthlyCustomers));
      
      setSummaryStats({
        totalSales,
        totalOrders,
        newCustomers: newCustomersCount
      });
      
    } catch (error) {
      handleFirestoreError(error, 'get' as any, 'reports data');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Performance Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(`Total Revenue (Last 6 Months): $${summaryStats.totalSales.toFixed(2)}`, 14, 38);
    doc.text(`Total Orders: ${summaryStats.totalOrders}`, 14, 44);
    doc.text(`New Customers: ${summaryStats.newCustomers}`, 14, 50);

    let yPos = 60;

    if (reportType === 'sales') {
      doc.setFontSize(14);
      doc.text('Monthly Revenue', 14, yPos);
      autoTable(doc, {
        startY: yPos + 6,
        head: [['Month', 'Orders', 'Revenue ($)']],
        body: salesData.map(row => [row.month, row.orders, row.revenue.toFixed(2)]),
      });
    } else if (reportType === 'products') {
      doc.setFontSize(14);
      doc.text('Best Selling Products', 14, yPos);
      autoTable(doc, {
        startY: yPos + 6,
        head: [['Product Name', 'Units Sold', 'Revenue ($)']],
        body: productsData.map(row => [row.name, row.quantity, row.revenue.toFixed(2)]),
      });
    } else if (reportType === 'customers') {
      doc.setFontSize(14);
      doc.text('Customer Growth', 14, yPos);
      autoTable(doc, {
        startY: yPos + 6,
        head: [['Month', 'New Customers']],
        body: customerGrowth.map(row => [row.month, row.customers]),
      });
    }

    doc.save(`report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const downloadExcel = () => {
    let ws;
    if (reportType === 'sales') {
        const data = salesData.map(row => ({
           Month: row.month,
           Orders: row.orders,
           Revenue: row.revenue
        }));
        ws = xlsx.utils.json_to_sheet(data);
    } else if (reportType === 'products') {
        const data = productsData.map(row => ({
            'Product Name': row.name,
            'Units Sold': row.quantity,
            'Revenue ($)': row.revenue
        }));
        ws = xlsx.utils.json_to_sheet(data);
    } else {
        const data = customerGrowth.map(row => ({
            Month: row.month,
            'New Customers': row.customers
        }));
        ws = xlsx.utils.json_to_sheet(data);
    }
    
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Report");
    xlsx.writeFile(wb, `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">View performance metrics and download reports.</p>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={downloadPDF}
             className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={downloadExcel}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue (6m)</p>
                  <p className="text-2xl font-bold text-gray-900">${summaryStats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders (6m)</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.totalOrders.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">New Customers (6m)</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.newCustomers.toLocaleString()}</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
            <div className="border-b border-gray-100 p-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setReportType('sales')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    reportType === 'sales'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Monthly Revenue
                </button>
                <button
                  onClick={() => setReportType('products')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    reportType === 'products'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Best Sellers
                </button>
                <button
                  onClick={() => setReportType('customers')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    reportType === 'customers'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Customer Growth
                </button>
              </nav>
            </div>

            <div className="p-6">
              {reportType === 'sales' && (
                <div className="h-[400px]">
                  {salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                            dx={-10}
                        />
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart2 className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No sales data for the selected period.</p>
                    </div>
                  )}
                </div>
              )}

              {reportType === 'products' && (
                <div className="h-[400px]">
                   {productsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dx={-10}
                        />
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="quantity" name="Units Sold" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="revenue" name="Revenue ($)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                   ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart2 className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No product sales data available.</p>
                    </div>
                   )}
                </div>
              )}

              {reportType === 'customers' && (
                <div className="h-[400px]">
                  {customerGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={customerGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            allowDecimals={false}
                            dx={-10}
                        />
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="customers" name="New Customers" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No new customers in the selected period.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

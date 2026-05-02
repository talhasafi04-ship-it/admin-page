import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Gift, Plus, Search, Loader2, Trash2, Edit2, Copy, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiryDate?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    expiryDate: '',
    usageLimit: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coupon[];
      setCoupons(data);
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value.toString(),
        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
        status: coupon.status
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        expiryDate: '',
        usageLimit: '',
        status: 'active'
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.code || !formData.value) {
      setFormError('Code and discount value are required');
      return;
    }

    const valueNum = parseFloat(formData.value);
    if (isNaN(valueNum) || valueNum <= 0) {
      setFormError('Discount value must be a positive number');
      return;
    }

    if (formData.type === 'percentage' && valueNum > 100) {
      setFormError('Percentage discount cannot exceed 100%');
      return;
    }

    setFormLoading(true);

    try {
      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), {
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: valueNum,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).getTime() : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          status: formData.status,
          updatedAt: serverTimestamp()
        });
      } else {
        const id = formData.code.toUpperCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'coupons', id), {
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: valueNum,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).getTime() : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          usageCount: 0,
          status: formData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await fetchCoupons();
      handleCloseModal();
    } catch (error: any) {
      handleFirestoreError(error, editingCoupon ? ('update' as any) : ('create' as any), 'coupons');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        await fetchCoupons();
      } catch (error) {
        handleFirestoreError(error, 'delete' as any, `coupons/${id}`);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional codes and special offers.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search coupons..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No coupons found</p>
                    <p className="text-sm mt-1">Create your first coupon code.</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md text-sm border border-gray-200">
                          {coupon.code}
                        </span>
                        <button 
                           onClick={() => copyToClipboard(coupon.code)}
                           className="text-gray-400 hover:text-indigo-600 transition-colors"
                           title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value.toFixed(2)} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ' used'}
                      </div>
                      {coupon.usageLimit && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 max-w-[80px]">
                          <div 
                             className="bg-indigo-600 h-1.5 rounded-full" 
                             style={{ width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {coupon.expiryDate ? format(new Date(coupon.expiryDate), 'MMM d, yyyy') : 'No Expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md border",
                        coupon.status === 'active' 
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-gray-700 bg-gray-50 border-gray-200"
                      )}>
                        {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleOpenModal(coupon)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button 
                 onClick={handleCloseModal}
                 className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4" /> {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                      placeholder="e.g. SUMMER24"
                      required
                   />
                   {!editingCoupon && (
                     <button type="button" onClick={generateCode} className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                        Generate
                     </button>
                   )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select 
                       value={formData.type}
                       onChange={e => setFormData({...formData, type: e.target.value as 'percentage' | 'fixed'})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                       <option value="percentage">Percentage (%)</option>
                       <option value="fixed">Fixed Amount ($)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                    <input 
                       type="number" 
                       step={formData.type === 'percentage' ? "1" : "0.01"}
                       min="0"
                       value={formData.value}
                       onChange={e => setFormData({...formData, value: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       placeholder={formData.type === 'percentage' ? "e.g. 20" : "e.g. 15.00"}
                       required
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input 
                       type="date" 
                       value={formData.expiryDate}
                       onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input 
                       type="number" 
                       min="1"
                       value={formData.usageLimit}
                       onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       placeholder="e.g. 100"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                   value={formData.status}
                   onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

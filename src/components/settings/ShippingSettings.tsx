import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Truck, Loader2, Save } from 'lucide-react';

export function ShippingSettings() {
  const [baseCharge, setBaseCharge] = useState<string>('0');
  const [freeThreshold, setFreeThreshold] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'shipping');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBaseCharge(data.baseCharge?.toString() || '0');
        setFreeThreshold(data.freeShippingThreshold?.toString() || '');
      }
    } catch (err) {
      handleFirestoreError(err, 'get' as any, 'settings/shipping');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'shipping'), {
        baseCharge: parseFloat(baseCharge) || 0,
        freeShippingThreshold: freeThreshold ? parseFloat(freeThreshold) : null,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, 'update' as any, 'settings/shipping');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Truck className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Delivery Charges</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Delivery Charge ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={baseCharge}
                  onChange={(e) => setBaseCharge(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">This is the default amount charged for shipping on all orders.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($) <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  placeholder="e.g. 50"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Orders above this amount will have their delivery charge waived.</p>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
            {success && (
              <span className="text-sm font-medium text-emerald-600 flex items-center">
                Settings saved successfully
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

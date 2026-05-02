import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Loader2, Save, Store, Image as ImageIcon, Phone, Share2 } from 'lucide-react';

export function GeneralSettings() {
  const [formData, setFormData] = useState({
    websiteName: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          websiteName: data.websiteName || '',
          logoUrl: data.logoUrl || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          contactAddress: data.contactAddress || '',
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          heroImage: data.heroImage || '',
          facebookUrl: data.facebookUrl || '',
          twitterUrl: data.twitterUrl || '',
          instagramUrl: data.instagramUrl || ''
        });
      }
    } catch (err) {
      handleFirestoreError(err, 'get' as any, 'settings/general');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, 'update' as any, 'settings/general');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      {/* Brand Settings */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Store className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Brand Identity</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website Name</label>
              <input
                type="text"
                name="websiteName"
                value={formData.websiteName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. My Awesome Store"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Hero Section</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Welcome to our store"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image URL</label>
              <input
                type="url"
                name="heroImage"
                value={formData.heroImage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
              <textarea
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Discover amazing products today."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Phone className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
              <textarea
                name="contactAddress"
                value={formData.contactAddress}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="123 Main St, City, Country"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Share2 className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Social Media</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
              <input
                type="url"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter / X URL</label>
              <input
                type="url"
                name="twitterUrl"
                value={formData.twitterUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
              <input
                type="url"
                name="instagramUrl"
                value={formData.instagramUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://instagram.com/..."
              />
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

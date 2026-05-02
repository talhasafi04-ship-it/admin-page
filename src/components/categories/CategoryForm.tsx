import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export function CategoryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit ? true : false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const docRef = doc(db, 'categories', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || '',
          description: data.description || '',
        });
      } else {
        navigate('/categories');
      }
    } catch (error) {
      handleFirestoreError(error, 'get' as any, `categories/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const categoryData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'categories', id!), categoryData);
      } else {
        const docRef = doc(collection(db, 'categories'));
        await setDoc(docRef, {
          ...categoryData,
          createdAt: serverTimestamp()
        });
      }
      navigate('/categories');
    } catch (error) {
      handleFirestoreError(error, isEdit ? ('update' as any) : ('create' as any), 'categories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full font-sans">
      <div className="mb-8">
        <Link to="/categories" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Categories
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isEdit ? 'Edit Category' : 'Add New Category'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. LCD Screens"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the category..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link 
            to="/categories"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}

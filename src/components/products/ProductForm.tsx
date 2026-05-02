import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, orderBy, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'LCD',
    price: 0,
    discount: 0,
    stock: 0,
    sku: '',
    status: 'active',
  });
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const catSnap = await getDocs(catQuery);
        const catData = catSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCategories(catData);
        
        if (catData.length > 0 && !isEdit) {
           setFormData(prev => ({ ...prev, category: catData[0].name }));
        }

        if (isEdit) {
          const docRef = doc(db, 'products', id!);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              title: data.title || '',
              description: data.description || '',
              category: data.category || (catData.length > 0 ? catData[0].name : ''),
              price: data.price || 0,
              discount: data.discount || 0,
              stock: data.stock || 0,
              sku: data.sku || '',
              status: data.status || 'active',
            });
            setImages(data.images || []);
          } else {
            navigate('/products');
          }
        }
      } catch (error) {
        handleFirestoreError(error, 'get' as any, isEdit ? `products/${id}` : 'categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEdit, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      if (images.length >= 10) {
        alert("Maximum 10 images allowed.");
        return;
      }
      setImages([...images, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const productData = {
        ...formData,
        images,
        updatedAt: serverTimestamp()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'products', id!), productData);
      } else {
        const docRef = doc(collection(db, 'products'));
        await setDoc(docRef, {
          ...productData,
          createdAt: serverTimestamp()
        });
      }
      navigate('/products');
    } catch (error) {
      handleFirestoreError(error, isEdit ? ('update' as any) : ('create' as any), 'products');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full font-sans">
      <div className="mb-8">
        <Link to="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Basic Information</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. iPhone 13 Pro Max OLED Replacement Screen"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select 
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU / ID *</label>
                <input 
                  type="text" 
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. LCD-IP13PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Product description and details..."
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input 
                type="number" 
                name="price"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
              <input 
                type="number" 
                name="discount"
                min="0"
                step="0.01"
                value={formData.discount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
              <input 
                type="number" 
                name="stock"
                min="0"
                required
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Product Images <span className="text-sm font-normal text-gray-500 ml-2">Up to 10 images</span></h2>
          
          <div className="flex gap-3 mb-6">
            <input 
              type="url" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImage();
                }
              }}
            />
            <button 
              type="button" 
              onClick={handleAddImage}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Add URL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            <AnimatePresence>
              {images.map((url, index) => (
                <motion.div 
                  key={url + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="aspect-square relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center"
                >
                  <img src={url} alt="Product" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50 pointer-events-auto cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {images.length === 0 && (
              <div className="col-span-full py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">No images added</p>
                <p className="text-xs mt-1">Paste a URL above to add an image</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link 
            to="/products"
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
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

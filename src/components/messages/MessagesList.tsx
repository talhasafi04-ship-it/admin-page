import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Mail, Search, Loader2, Filter, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: any;
  updatedAt: any;
  replies?: any[];
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'read': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'replied': return 'text-gray-700 bg-gray-50 border-gray-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'messages');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name?.toLowerCase().includes(search.toLowerCase()) ||
    msg.email?.toLowerCase().includes(search.toLowerCase()) ||
    msg.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer inquiries and support messages.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors w-full sm:w-auto">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900">No messages found</p>
                    <p className="text-sm mt-1">You are all caught up.</p>
                  </td>
                </tr>
              ) : (
                filteredMessages.map(msg => (
                  <tr 
                    key={msg.id} 
                    onClick={() => navigate(`/messages/${msg.id}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                           <span className="text-indigo-700 font-semibold text-sm">
                             {msg.name?.charAt(0).toUpperCase() || 'U'}
                           </span>
                        </div>
                        <div>
                           <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{msg.name}</div>
                           <div className="text-sm text-gray-500">{msg.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-[300px]">
                        {msg.subject || 'No Subject'}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px] lg:max-w-[300px]">
                        {msg.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {msg.createdAt ? format(new Date(msg.createdAt.seconds * 1000), 'MMM d, yyyy h:mm a') : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded-md border",
                          getStatusColor(msg.status)
                        )}>
                          {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                        </span>
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

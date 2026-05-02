import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { ArrowLeft, Send, Loader2, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Message, getStatusColor } from './MessagesList';
import { useAuth } from '../../contexts/AuthContext';

export function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const docRef = doc(db, 'messages', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const msgData = { id: docSnap.id, ...docSnap.data() } as Message;
        setMessage(msgData);
        
        if (msgData.status === 'new') {
           await updateDoc(docRef, { status: 'read', updatedAt: serverTimestamp() });
           setMessage({ ...msgData, status: 'read' });
        }
      } else {
        navigate('/messages');
      }
    } catch (err) {
      handleFirestoreError(err, 'get' as any, `messages/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !message || !id) return;
    setReplying(true);
    
    try {
      const newReply = {
        message: replyText.trim(),
        createdAt: new Date().getTime(), // Store as JS timestamp for simpler rules handling here, or serverTimestamp in a subcollection
        staffId: user?.uid || 'system',
        staffEmail: user?.email || 'System'
      };
      
      const docRef = doc(db, 'messages', id);
      const currentReplies = message.replies || [];
      
      await updateDoc(docRef, {
        status: 'replied',
        replies: [...currentReplies, newReply],
        updatedAt: serverTimestamp()
      });
      
      setMessage({
        ...message,
        status: 'replied',
        replies: [...currentReplies, newReply]
      });
      setReplyText('');
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `messages/${id}`);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
     return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
     );
  }

  if (!message) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/messages')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </button>
        <span className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-md border",
            getStatusColor(message.status)
        )}>
          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
               <span className="text-indigo-700 font-bold text-lg">
                 {message.name?.charAt(0).toUpperCase() || 'U'}
               </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{message.subject || 'No Subject'}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {message.name} ({message.email})</span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 
                  {message.createdAt ? format(new Date(message.createdAt.seconds * 1000), 'MMM d, yyyy h:mm a') : 'Unknown time'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {message.message}
          </div>
        </div>
      </div>

      {/* Replies Thread */}
      {message.replies && message.replies.length > 0 && (
         <div className="space-y-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Conversation History</h3>
            {message.replies.map((reply, idx) => (
              <div key={idx} className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 ml-8 relative">
                 <div className="absolute -left-3 top-6 w-3 h-px bg-indigo-200"></div>
                 <div className="absolute -left-8 top-0 bottom-0 w-px bg-indigo-100"></div>
                 
                 <div className="flex items-center justify-between mb-3">
                   <div className="font-medium text-indigo-900 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        {reply.staffEmail?.charAt(0).toUpperCase() || 'S'}
                     </div>
                     Store Support
                   </div>
                   <div className="text-xs text-indigo-400">
                     {reply.createdAt ? format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a') : ''}
                   </div>
                 </div>
                 <div className="text-sm text-indigo-800 whitespace-pre-wrap">
                   {reply.message}
                 </div>
              </div>
            ))}
         </div>
      )}

      {/* Reply Box */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6 ml-0 sm:ml-8 relative mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Reply to Customer</label>
        <textarea
           rows={4}
           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
           placeholder="Type your reply here... (This will simulate sending an email)"
           value={replyText}
           onChange={e => setReplyText(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
           <button
             onClick={handleReply}
             disabled={!replyText.trim() || replying}
             className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
           >
              {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Reply
           </button>
        </div>
      </div>
    </div>
  );
}

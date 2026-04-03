import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, setDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Chat, Message, UserProfile } from '../types';
import { Send, User, Search, MessageSquare, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function ChatPage() {
  const { sellerId } = useParams();
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const chatList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !sellerId) return;

    const startChat = async () => {
      const chatId = [user.uid, sellerId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const path = `chats/${chatId}`;
      
      try {
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            id: chatId,
            participants: [user.uid, sellerId],
            updatedAt: new Date().toISOString(),
            lastMessage: ''
          });
        }
        
        const otherUserSnap = await getDoc(doc(db, 'users', sellerId));
        if (otherUserSnap.exists()) {
          setOtherUser(otherUserSnap.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };

    startChat();
  }, [user, sellerId]);

  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const path = `chats/${activeChat.id}/messages`;

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChat || !newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');
    const path = `chats/${activeChat.id}/messages`;

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        chatId: activeChat.id,
        senderId: user.uid,
        text,
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (!user) return <div className="text-center py-20 font-bold text-gray-500">Veuillez vous connecter pour accéder aux messages.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 h-full overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-gray-50 flex flex-col">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-xl font-black text-gray-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <button 
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-all border-b border-gray-50 text-left ${activeChat?.id === chat.id ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-gray-900 truncate">Conversation</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {format(new Date(chat.updatedAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Nouvelle conversation'}</p>
                </div>
              </button>
            ))}
            
            {chats.length === 0 && !loading && (
              <div className="p-10 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium">Aucune conversation pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <button className="md:hidden p-2 text-gray-400 hover:text-indigo-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Vendeur</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                {messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${msg.senderId === user.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      <div className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${msg.senderId === user.uid ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-50 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..." 
                    className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  />
                  <button 
                    type="submit"
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Vos Conversations</h3>
              <p className="text-gray-500 max-w-xs font-medium">Sélectionnez une discussion pour commencer à échanger avec un vendeur ou un acheteur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

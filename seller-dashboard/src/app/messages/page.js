'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import api from '../../lib/api';

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
    }, [user, authLoading]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('sellerAccessToken');
        const ws = new WebSocket(`ws://localhost:3009?token=${token}`);
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.threadId === activeThread?._id) {
                    setMessages(prev => [...prev, data]);
                }
                loadThreads();
            } catch {}
        };
        return () => ws.close();
    }, [user, activeThread]);

    const loadThreads = async () => {
        try {
            const res = await api.get('/api/messages/threads');
            setThreads(res.data || []);
        } catch {
            setThreads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadThreads();
    }, [user]);

    const selectThread = async (thread) => {
        setActiveThread(thread);
        try {
            const res = await api.get(`/api/messages/thread/${thread._id}`);
            setMessages(res.data || []);
            await api.put(`/api/messages/thread/${thread._id}/read`);
            loadThreads();
        } catch {
            setMessages([]);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeThread) return;
        const lastMsg = activeThread.lastMessage;
        const recipientId = String(lastMsg.senderId) === String(user?.sub || user?._id)
            ? lastMsg.recipientId
            : lastMsg.senderId;
        try {
            const res = await api.post('/api/messages', {
                threadId: activeThread._id,
                recipientId,
                productId: lastMsg.productId,
                body: input,
            });
            setMessages(prev => [...prev, res.data]);
            setInput('');
            loadThreads();
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    const getUserId = () => user?.sub || user?._id || '';

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Messages</h1>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: connected ? '#16a34a' : '#64748b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#16a34a' : '#94a3b8' }} />
                    {connected ? 'Live' : 'Offline'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: '600px' }}>
                {/* Thread List */}
                <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Conversations
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {threads.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                No messages yet.<br />Buyers will message you here.
                            </div>
                        ) : (
                            threads.map(thread => (
                                <div
                                    key={thread._id}
                                    onClick={() => selectThread(thread)}
                                    style={{
                                        padding: '16px', cursor: 'pointer',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: activeThread?._id === thread._id ? '#eff6ff' : 'white',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Buyer Message</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {formatDate(thread.lastMessage?.createdAt)}
                                            </span>
                                            {thread.unreadCount > 0 && (
                                                <span style={{
                                                    background: '#2563eb', color: 'white',
                                                    borderRadius: '9999px', fontSize: '0.6875rem',
                                                    fontWeight: 700, width: '18px', height: '18px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.lastMessage?.body || 'No messages'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                                        📦 {String(thread.lastMessage?.productId).slice(-8)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {activeThread ? (
                        <>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                <p style={{ fontWeight: 600 }}>Buyer Conversation</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Product: {String(activeThread.lastMessage?.productId).slice(-8)}
                                </p>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messages.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '0.875rem' }}>
                                        No messages yet.
                                    </p>
                                )}
                                {messages.map((msg, i) => {
                                    const isMe = String(msg.senderId) === getUserId();
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                maxWidth: '65%',
                                                background: isMe ? '#2563eb' : 'white',
                                                color: isMe ? 'white' : '#0f172a',
                                                padding: '10px 14px',
                                                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                                border: isMe ? 'none' : '1px solid #e2e8f0',
                                            }}>
                                                <p style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.7 }}>
                                                    {isMe ? 'You' : 'Buyer'}
                                                </p>
                                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{msg.body}</p>
                                                <p style={{ fontSize: '0.6875rem', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Reply to buyer..."
                                        style={{
                                            flex: 1, padding: '10px 16px',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: '9999px',
                                            fontSize: '0.9375rem', outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn--primary"
                                        disabled={!input.trim()}
                                        style={{ borderRadius: '9999px', padding: '10px 24px' }}
                                    >
                                        Reply
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: '#94a3b8' }}>
                            <span style={{ fontSize: '3rem' }}>💬</span>
                            <p style={{ fontWeight: 500 }}>Select a conversation</p>
                            <p style={{ fontSize: '0.875rem' }}>Buyer messages will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
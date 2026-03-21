'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
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
    const [showNewThread, setShowNewThread] = useState(false);
    const [newMsg, setNewMsg] = useState({ recipientId: '', productId: '', body: '' });
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
    }, [user, authLoading]);

    // Connect WebSocket
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('accessToken');
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
                // Refresh threads to update last message
                loadThreads();
            } catch {}
        };

        return () => ws.close();
    }, [user, activeThread]);

    // Load threads
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

    // Load messages when thread selected
    const selectThread = async (thread) => {
        setActiveThread(thread);
        try {
            const res = await api.get(`/api/messages/thread/${thread._id}`);
            setMessages(res.data || []);
            // Mark as read
            await api.put(`/api/messages/thread/${thread._id}/read`);
            loadThreads();
        } catch {
            setMessages([]);
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message in existing thread
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeThread) return;

        const lastMsg = activeThread.lastMessage;
        const recipientId = lastMsg.senderId === user?._id || lastMsg.senderId === user?.sub
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

    // Start new thread
    const startNewThread = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/messages', {
                recipientId: newMsg.recipientId,
                productId: newMsg.productId,
                body: newMsg.body,
            });
            setNewMsg({ recipientId: '', productId: '', body: '' });
            setShowNewThread(false);
            await loadThreads();
            // Select the new thread
            const threadId = res.data.threadId;
            const newThread = { _id: threadId, lastMessage: res.data, unreadCount: 0 };
            selectThread(newThread);
        } catch (err) {
            console.error('Failed to start thread:', err);
        }
    };

    const getUserId = () => user?.sub || user?._id || '';

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Messages</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: connected ? '#16a34a' : '#64748b' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#16a34a' : '#94a3b8' }} />
                            {connected ? 'Live' : 'Offline'}
                        </span>
                        <button className="btn btn--primary btn--sm" onClick={() => setShowNewThread(true)}>
                            + New Message
                        </button>
                    </div>
                </div>

                {/* New Thread Modal */}
                {showNewThread && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
                            <h2 style={{ fontWeight: 700, marginBottom: '24px' }}>New Message</h2>
                            <form onSubmit={startNewThread}>
                                <div className="form-group">
                                    <label>Recipient ID</label>
                                    <input
                                        placeholder="Paste seller's user ID"
                                        value={newMsg.recipientId}
                                        onChange={e => setNewMsg({ ...newMsg, recipientId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Product ID</label>
                                    <input
                                        placeholder="Paste product ID"
                                        value={newMsg.productId}
                                        onChange={e => setNewMsg({ ...newMsg, productId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        placeholder="Type your message..."
                                        value={newMsg.body}
                                        onChange={e => setNewMsg({ ...newMsg, body: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="submit" className="btn btn--primary btn--full">Send</button>
                                    <button type="button" className="btn btn--ghost btn--full" onClick={() => setShowNewThread(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: '600px' }}>
                    {/* Thread List */}
                    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Conversations
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {threads.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                    No conversations yet.
                                    <br />
                                    Click "+ New Message" to start one.
                                </div>
                            ) : (
                                threads.map(thread => (
                                    <div
                                        key={thread._id}
                                        onClick={() => selectThread(thread)}
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: activeThread?._id === thread._id ? '#eff6ff' : 'white',
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                                                Thread
                                            </p>
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
                                        <p style={{
                                            fontSize: '0.8125rem', color: '#64748b',
                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
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
                                {/* Thread Header */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>Conversation</p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            Product: {String(activeThread.lastMessage?.productId).slice(-8)}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {messages.length === 0 && (
                                        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '0.875rem' }}>
                                            No messages in this thread yet.
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
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{msg.body}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                                                            {formatTime(msg.createdAt)}
                                                        </span>
                                                        {isMe && (
                                                            <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>
                                                                {msg.readAt ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input */}
                                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                                    <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Type a message..."
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
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: '#94a3b8' }}>
                                <span style={{ fontSize: '3rem' }}>💬</span>
                                <p style={{ fontSize: '1rem', fontWeight: 500 }}>Select a conversation</p>
                                <p style={{ fontSize: '0.875rem' }}>or start a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
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
    const retryTimeoutRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
    }, [user, authLoading]);

    // WebSocket connection with auto-retry logic
    useEffect(() => {
        if (!user) return;

        let isMounted = true;
        const token = localStorage.getItem('accessToken');

        const connectWebSocket = () => {
            if (!isMounted) return;

            try {
                console.log('[WebSocket] Attempting to connect...');
                const ws = new WebSocket(`ws://localhost:3009?token=${token}`);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (!isMounted) return;
                    console.log('[WebSocket] Connected successfully');
                    setConnected(true);
                    // Clear any pending retry timeout on successful connection
                    if (retryTimeoutRef.current) {
                        clearTimeout(retryTimeoutRef.current);
                        retryTimeoutRef.current = null;
                    }
                };

                ws.onclose = (event) => {
                    if (!isMounted) return;
                    console.log('[WebSocket] Connection closed', { code: event.code, reason: event.reason });
                    setConnected(false);
                    scheduleReconnect();
                };

                ws.onerror = (error) => {
                    if (!isMounted) return;
                    console.error('[WebSocket] Connection error', error);
                    setConnected(false);
                    scheduleReconnect();
                };

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        console.log('[WebSocket] Message received', { threadId: data.threadId });
                        if (data.threadId === activeThread?._id) {
                            setMessages(prev => [...prev, data]);
                        }
                        // Refresh threads to update last message
                        loadThreads();
                    } catch (err) {
                        console.error('[WebSocket] Failed to parse message', err);
                    }
                };
            } catch (err) {
                console.error('[WebSocket] Failed to create WebSocket', err);
                setConnected(false);
                scheduleReconnect();
            }
        };

        const scheduleReconnect = () => {
            if (!isMounted) return;
            // Clear any existing timeout
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            console.log('[WebSocket] Scheduling reconnection in 3 seconds...');
            retryTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                    connectWebSocket();
                }
            }, 3000);
        };

        // Initial connection
        connectWebSocket();

        // Cleanup
        return () => {
            isMounted = false;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            console.log('[WebSocket] Component unmounted, cleaned up connections');
        };
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

    // Safe WebSocket send with connection check
    const wsSendMessage = (message) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('[WebSocket] Socket not connected, cannot send message', {
                socketExists: !!wsRef.current,
                readyState: wsRef.current?.readyState,
                readyStateNames: {
                    0: 'CONNECTING',
                    1: 'OPEN',
                    2: 'CLOSING',
                    3: 'CLOSED',
                },
            });
            return false;
        }
        try {
            wsRef.current.send(JSON.stringify(message));
            console.log('[WebSocket] Message sent via WebSocket', message);
            return true;
        } catch (err) {
            console.error('[WebSocket] Failed to send message', err);
            return false;
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
        const currentUserId = user?.sub || user?._id || '';

        // For buyer-seller conversations, determine the other participant
        // The recipient should be the seller (the one who isn't the current buyer)
        let recipientId;
        if (lastMsg.senderId.toString() === currentUserId) {
            // Current user sent the last message, so recipient is the other person
            recipientId = lastMsg.recipientId.toString();
        } else {
            // Current user received the last message, so recipient is the sender
            recipientId = lastMsg.senderId.toString();
        }

        // Validate that recipientId is not a product ID (product IDs are longer and different format)
        // If it looks like a product ID, we need to find the correct seller ID
        if (recipientId.length > 24 || !recipientId.match(/^[0-9a-f]{24}$/)) {
            console.warn('Invalid recipientId detected, attempting to find correct seller ID');
            // This shouldn't happen with properly synced data, but as a fallback
            // we can try to get the seller ID from the product
            try {
                const productRes = await api.get(`/api/catalog/products/${lastMsg.productId}`);
                const product = productRes.data;
                recipientId = product.userId || product.sellerId;
                console.log('Using seller ID from product:', recipientId);
            } catch (err) {
                console.error('Failed to get product data for recipient validation');
                alert('Unable to determine message recipient. Please try again.');
                return;
            }
        }

        const messagePayload = {
            threadId: activeThread._id,
            recipientId,
            productId: lastMsg.productId,
            body: input,
        };

        console.log('Sending reply message:', messagePayload);

        try {
            // Try to send via WebSocket first if connected
            if (connected && wsRef.current) {
                const wsSent = wsSendMessage(messagePayload);
                if (wsSent) {
                    setInput('');
                    loadThreads();
                    return;
                }
            }

            // Fallback to HTTP API if WebSocket unavailable
            console.log('[API Fallback] Using HTTP API to send message');
            const res = await api.post('/api/messages', messagePayload);
            setMessages(prev => [...prev, res.data]);
            setInput('');
            loadThreads();
        } catch (err) {
            console.error('[SendMessage Error]', err);
            alert('Failed to send message. Please try again.');
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
'use client';

export default function Button({
    children,
    variant = 'primary',
    size = '',
    full = false,
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
}) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${full ? 'btn--full' : ''}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        width: '14px', height: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block'
                    }} />
                    Loading...
                </span>
            ) : children}
        </button>
    );
}
export default function Button({ children, variant = 'primary', size = '', full = false, loading = false, disabled = false, onClick, type = 'button' }) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${full ? 'btn--full' : ''}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
}
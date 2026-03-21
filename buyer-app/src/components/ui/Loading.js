export default function Loading({ text = 'Loading...' }) {
    return (
        <div className="loading">
            <div style={{ textAlign: 'center' }}>
                <div className="loading__spinner" />
                {text && (
                    <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.875rem' }}>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}
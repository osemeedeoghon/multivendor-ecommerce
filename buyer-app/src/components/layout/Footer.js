export default function Footer() {
    return (
        <footer style={{
            background: '#1e293b',
            color: '#94a3b8',
            padding: '40px 0',
            marginTop: '80px'
        }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ color: 'white', marginBottom: '8px' }}>🛍️ ShopHub</h3>
                        <p style={{ fontSize: '0.875rem' }}>Multi-vendor e-commerce platform</p>
                    </div>
                    <p style={{ fontSize: '0.875rem' }}>
                        © 2026 ShopHub. Built with Next.js + Node.js microservices.
                    </p>
                </div>
            </div>
        </footer>
    );
}
export default function StatCard({ label, value, sub, icon, color = '#7c3aed' }) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p className="stat-card__label">{label}</p>
                    <p className="stat-card__value">{value}</p>
                    {sub && <p className="stat-card__sub">{sub}</p>}
                </div>
                {icon && (
                    <div style={{ width: '48px', height: '48px', background: color + '20', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
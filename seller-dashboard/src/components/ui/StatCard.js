export default function StatCard({ label, value, sub, icon }) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p className="stat-card__label">{label}</p>
                    <p className="stat-card__value">{value}</p>
                    {sub && <p className="stat-card__sub">{sub}</p>}
                </div>
                {icon && <span style={{ fontSize: '2rem' }}>{icon}</span>}
            </div>
        </div>
    );
}
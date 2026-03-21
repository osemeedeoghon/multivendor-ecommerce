import '../styles/globals.scss';
import '../styles/components.scss';
import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export const metadata = {
    title: 'SellerHub — Seller Dashboard',
    description: 'Manage your store, products, and orders',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <LayoutContent>{children}</LayoutContent>
                </AuthProvider>
            </body>
        </html>
    );
}

function LayoutContent({ children }) {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <Header />
                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
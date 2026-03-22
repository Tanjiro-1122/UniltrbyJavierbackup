import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#06020f' }}>
            <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '72px', fontWeight: '300', color: 'rgba(168,85,247,0.4)', margin: 0 }}>404</h1>
                <h2 style={{ fontSize: '22px', color: '#e2d4f0', marginTop: '16px' }}>Page Not Found</h2>
                <p style={{ color: 'rgba(226,212,240,0.6)', marginTop: '8px' }}>
                    "{pageName}" could not be found.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: '32px',
                        padding: '12px 28px',
                        background: 'rgba(168,85,247,0.2)',
                        border: '1px solid rgba(168,85,247,0.4)',
                        borderRadius: '12px',
                        color: '#e2d4f0',
                        fontSize: '15px',
                        cursor: 'pointer',
                    }}
                >
                    Go Home
                </button>
            </div>
        </div>
    );
}

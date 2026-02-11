import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Project Info' },
        { path: '/csv-analysis', label: 'CSV Analysis' },
        { path: '/csv-cleaning', label: 'CSV Cleaning' },
        { path: '/get-started', label: 'Get Started' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 left-0 w-full z-50 bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="text-xl font-bold text-blue-600">
                        AI Workflow Automator
                    </Link>

                    {/* Links */}
                    <div className="flex items-center gap-4">
                        {navItems.map(({ path, label }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`px-3 py-2 rounded font-medium transition ${isActive(path)
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:text-blue-600'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}

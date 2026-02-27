import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
    {
        to: '/',
        label: 'Dashboard',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        children: [
            {
                to: '/train',
                label: 'Train Model',
                icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                ),
            },
            {
                to: '/generate',
                label: 'Generate',
                icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                ),
            },
            {
                to: '/results',
                label: 'Results',
                icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
            },
            {
                to: '/visualize',
                label: 'Visualize',
                icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                ),
            },
        ]
    },
];

export default function Sidebar({ isOpen, toggle }) {
    const [isDashboardOpen, setDashboardOpen] = useState(true);

    return (
        <aside
            className={`sticky top-0 h-screen bg-bg-secondary border-r border-border-glass flex flex-col z-50 transition-all duration-300 overflow-hidden ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'
                }`}
        >
            <div className="w-80 flex flex-col h-full">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-border-glass flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold gradient-text">CDVAE</h1>
                            <p className="text-sm text-text-muted">Crystal Diffusion</p>
                        </div>
                    </div>
                    <button onClick={toggle} className="text-text-muted hover:text-accent-blue transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <div key={item.label}>
                            <div className="flex items-center gap-2">
                                <NavLink
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        `flex-1 flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-accent-blue/15 to-accent-violet/10 text-accent-blue border border-accent-blue/20'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    {item.label}
                                </NavLink>
                                {item.children && (
                                    <button
                                        onClick={() => setDashboardOpen(!isDashboardOpen)}
                                        className="p-2 text-text-secondary hover:text-accent-blue transition-colors"
                                    >
                                        <svg className={`w-5 h-5 transition-transform duration-200 ${isDashboardOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Submenu */}
                            {item.children && isDashboardOpen && (
                                <div className="mt-2 ml-4 space-y-2 border-l-2 border-border-glass pl-4 animate-fade-in-up">
                                    {item.children.map((child) => (
                                        <NavLink
                                            key={child.to}
                                            to={child.to}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                    ? 'text-accent-blue bg-accent-blue/10'
                                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                                                }`
                                            }
                                        >
                                            {child.icon}
                                            {child.label}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-glass">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                        System Online
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 opacity-60">v1.0.0 · CDVAE Platform</p>
                </div>
            </div>
        </aside>
    );
}

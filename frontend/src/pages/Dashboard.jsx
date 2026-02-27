import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';

const cards = [
    {
        to: '/train',
        title: 'Train Model',
        description: 'Configure and launch CDVAE training on crystal datasets',
        gradient: 'from-accent-blue to-accent-cyan',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        to: '/generate',
        title: 'Generate Crystals',
        description: 'Sample new crystal structures from trained models',
        gradient: 'from-accent-violet to-accent-rose',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        to: '/results',
        title: 'View Results',
        description: 'Explore training metrics and generated crystal files',
        gradient: 'from-accent-emerald to-accent-cyan',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        to: '/visualize',
        title: '3D Visualization',
        description: 'Interactive 3D rendering of crystal lattice structures',
        gradient: 'from-accent-amber to-accent-rose',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
    },
];

export default function Dashboard() {
    const [stats, setStats] = useState({ trainJobs: 0, genJobs: 0, cifFiles: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const [results, files] = await Promise.all([api.getResults(), api.getFiles()]);
                setStats({
                    trainJobs: results.train_jobs?.length || 0,
                    genJobs: results.generate_jobs?.length || 0,
                    cifFiles: files.files?.length || 0,
                });
            } catch {
                /* API not running — leave defaults */
            }
        };
        load();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="animate-fade-in-up">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted mb-3">
                    Overview
                </p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-3">
                            CDVAE Control Center
                        </h1>
                        <p className="text-text-secondary text-base md:text-lg max-w-2xl">
                            Monitor training, launch new crystal generations, and inspect results from a single, streamlined interface.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-running">
                            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                            Backend status
                        </span>
                        <span className="text-xs text-text-muted">
                            Uses `/api` proxy to talk to the server.
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
                {/* Stat Cards */}
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                        Live metrics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
                        <StatCard label="Training runs" value={stats.trainJobs} color="accent-blue" />
                        <StatCard label="Generation jobs" value={stats.genJobs} color="accent-violet" />
                        <StatCard label="CIF files" value={stats.cifFiles} color="accent-emerald" />
                    </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                        Quick actions
                    </h2>
                    <div className="glass-card p-5 space-y-4">
                        <p className="text-sm text-text-secondary">
                            Start with a training run, then generate crystals or jump straight into 3D visualization once you have CIF files.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/train">
                                <button className="btn-glow btn-success text-sm">
                                    Start new training
                                </button>
                            </Link>
                            <Link to="/generate">
                                <button className="btn-glow text-sm">
                                    Generate crystals
                                </button>
                            </Link>
                            <Link to="/results">
                                <button className="btn-glow btn-danger text-sm">
                                    View latest results
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Cards */}
            <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Workspaces
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
                    {cards.map((card) => (
                        <Link key={card.to} to={card.to} className="group block h-full">
                            <div className="glass-card p-8 flex h-full items-center gap-6 cursor-pointer hover:bg-bg-card-hover transition-colors">
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    {card.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-accent-blue transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {card.description}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-bg-primary/40 flex items-center justify-center group-hover:bg-accent-blue/10 transition-colors">
                                    <svg className="w-5 h-5 text-text-muted group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colorMap = {
        'accent-blue': 'bg-accent-blue/15 text-accent-blue',
        'accent-violet': 'bg-accent-violet/15 text-accent-violet',
        'accent-emerald': 'bg-accent-emerald/15 text-accent-emerald',
    };

    const colorClasses = colorMap[color] || colorMap['accent-blue'];

    return (
        <div className="glass-card p-6 sm:p-7 flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorClasses}`}>
                <span className="text-2xl sm:text-3xl font-bold">{value}</span>
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted mb-1">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{value}</p>
            </div>
        </div>
    );
}

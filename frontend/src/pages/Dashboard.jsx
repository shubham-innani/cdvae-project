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
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold gradient-text mb-2">
                    CDVAE Dashboard
                </h1>
                <p className="text-text-secondary text-lg">
                    Crystal Diffusion Variational Autoencoder — Research Platform
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10 stagger">
                <StatCard label="Training Runs" value={stats.trainJobs} color="accent-blue" />
                <StatCard label="Generation Jobs" value={stats.genJobs} color="accent-violet" />
                <StatCard label="CIF Files" value={stats.cifFiles} color="accent-emerald" />
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                {cards.map((card) => (
                    <Link key={card.to} to={card.to} className="group">
                        <div className="glass-card p-6 flex items-start gap-5 cursor-pointer">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                {card.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-accent-blue transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-text-muted ml-auto mt-1 group-hover:text-accent-blue group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-${color}/15 flex items-center justify-center text-${color}`}>
                <span className="text-2xl font-bold">{value}</span>
            </div>
            <div>
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="text-xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    );
}

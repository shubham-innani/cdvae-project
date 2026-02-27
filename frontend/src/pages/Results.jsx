import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function Results() {
    const [results, setResults] = useState({ train_jobs: [], generate_jobs: [] });
    const [selectedJob, setSelectedJob] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [res, fileRes] = await Promise.all([api.getResults(), api.getFiles()]);
            setResults(res);
            setFiles(fileRes.files || []);
            if (res.train_jobs?.length) setSelectedJob(res.train_jobs[res.train_jobs.length - 1]);
        } catch {
            /* API not running */
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl font-extrabold gradient-text mb-2">Results</h1>
                <p className="text-text-secondary">Explore training metrics and generated crystal files</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Job List */}
                <div className="glass-card p-6 animate-fade-in-up">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Training Runs</h2>
                    {loading ? (
                        <p className="text-text-muted text-sm">Loading...</p>
                    ) : results.train_jobs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-text-muted text-sm mb-3">No training runs yet</p>
                            <Link to="/train" className="btn-glow text-sm">Start Training</Link>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {results.train_jobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedJob?.id === job.id
                                            ? 'bg-accent-blue/10 border border-accent-blue/30'
                                            : 'bg-bg-secondary hover:bg-bg-card border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-text-primary">Job {job.id}</span>
                                        <span className={`badge badge-${job.state}`}>{job.state}</span>
                                    </div>
                                    <p className="text-xs text-text-muted">
                                        {job.dataset} · {job.epochs} epochs · loss {job.loss?.toFixed(4) || '—'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    <h2 className="text-lg font-semibold text-text-primary mt-8 mb-4">Generation Runs</h2>
                    {results.generate_jobs.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-text-muted text-sm mb-3">No generations yet</p>
                            <Link to="/generate" className="btn-glow text-sm">Generate</Link>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {results.generate_jobs.map((job) => (
                                <div key={job.id} className="bg-bg-secondary rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-text-primary">Gen {job.id}</span>
                                        <span className={`badge badge-${job.state}`}>{job.state}</span>
                                    </div>
                                    <p className="text-xs text-text-muted">
                                        {job.num_samples} samples · temp {job.temperature}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Charts & Files */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Loss Chart */}
                    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-lg font-semibold text-text-primary mb-4">
                            Training Loss {selectedJob ? `— Job ${selectedJob.id}` : ''}
                        </h2>
                        {selectedJob?.loss_history?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={selectedJob.loss_history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,120,200,0.1)" />
                                    <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1f35',
                                            border: '1px solid rgba(100,120,200,0.2)',
                                            borderRadius: '10px',
                                            color: '#f1f5f9',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="loss"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 3 }}
                                        activeDot={{ r: 5, fill: '#06b6d4' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-60 text-text-muted text-sm">
                                {selectedJob ? 'No loss data available' : 'Select a training run to view loss chart'}
                            </div>
                        )}
                    </div>

                    {/* CIF Files */}
                    <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-text-primary">CIF Files</h2>
                            <span className="text-sm text-text-muted">{files.length} files</span>
                        </div>
                        {files.length === 0 ? (
                            <p className="text-text-muted text-sm text-center py-6">No CIF files generated yet</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                                {files.map((file) => (
                                    <div
                                        key={file}
                                        className="flex items-center justify-between bg-bg-secondary rounded-lg px-4 py-3 hover:bg-bg-card transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-text-secondary truncate">
                                            <svg className="w-4 h-4 text-accent-emerald shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="truncate">{file}</span>
                                        </div>
                                        <div className="flex gap-2 shrink-0 ml-2">
                                            <Link
                                                to={`/visualize?file=${encodeURIComponent(file)}`}
                                                className="text-xs text-accent-violet hover:text-accent-rose transition-colors"
                                            >
                                                View 3D
                                            </Link>
                                            <button
                                                className="text-xs text-accent-blue hover:text-accent-cyan transition-colors"
                                                onClick={() => api.downloadFile(file)}
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

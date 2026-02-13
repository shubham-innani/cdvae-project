import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function Generate() {
    const [form, setForm] = useState({ num_samples: 10, temperature: 1.0 });
    const [jobId, setJobId] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pollRef = useRef(null);
    const logEndRef = useRef(null);

    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [job?.logs]);

    useEffect(() => {
        if (!jobId) return;
        const poll = async () => {
            try {
                const data = await api.getJobStatus(jobId);
                setJob(data);
                if (data.state === 'completed' || data.state === 'failed') {
                    clearInterval(pollRef.current);
                }
            } catch { /* ignore */ }
        };
        poll();
        pollRef.current = setInterval(poll, 1000);
        return () => clearInterval(pollRef.current);
    }, [jobId]);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.startGeneration(form);
            setJobId(res.job_id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const progress = job ? Math.round((job.generated_files.length / job.num_samples) * 100) : 0;
    const isRunning = job?.state === 'running';
    const isCompleted = job?.state === 'completed';

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl font-extrabold gradient-text mb-2">Generate Crystals</h1>
                <p className="text-text-secondary">Sample new crystal structures from trained CDVAE models</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Config Panel */}
                <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up">
                    <h2 className="text-lg font-semibold text-text-primary mb-5">Generation Settings</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Number of Samples</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.num_samples}
                                min={1} max={500}
                                onChange={(e) => setForm((p) => ({ ...p, num_samples: parseInt(e.target.value) || 1 }))}
                                disabled={isRunning}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Sampling Temperature</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.temperature}
                                step={0.1} min={0.1} max={5}
                                onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) || 1 }))}
                                disabled={isRunning}
                            />
                            <p className="text-xs text-text-muted mt-2">Higher = more diverse, Lower = more conservative</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        className="btn-glow w-full mt-6"
                        onClick={handleGenerate}
                        disabled={loading || isRunning}
                    >
                        {loading ? 'Starting...' : isRunning ? 'Generating...' : isCompleted ? 'Generate Again' : 'Generate Crystals'}
                    </button>
                </div>

                {/* Progress & Results Panel */}
                <div className="lg:col-span-3 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                    {/* Progress */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-text-primary">Progress</h2>
                            {job && <span className={`badge badge-${job.state}`}>{job.state}</span>}
                        </div>

                        <div className="progress-bar mb-3">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-sm text-text-secondary">
                            <span>{job?.generated_files?.length || 0} / {job?.num_samples || form.num_samples} samples</span>
                            <span>{progress}%</span>
                        </div>
                    </div>

                    {/* Generated Files */}
                    {job?.generated_files?.length > 0 && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Generated Files</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                {job.generated_files.map((file) => (
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
                                        <button
                                            className="text-xs text-accent-blue hover:text-accent-cyan transition-colors shrink-0 ml-2"
                                            onClick={() => api.downloadFile(file)}
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Logs */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Generation Logs</h2>
                        <div className="log-viewer">
                            {job?.logs?.length ? (
                                job.logs.map((line, i) => <div key={i}>{line}</div>)
                            ) : (
                                <div className="text-text-muted">No logs yet. Start generation to see output.</div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

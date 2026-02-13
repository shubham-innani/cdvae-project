import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

const DATASETS = [
    { value: 'mp_20', label: 'MP-20 (Materials Project)' },
    { value: 'perov_5', label: 'Perovskite-5' },
    { value: 'carbon_24', label: 'Carbon-24' },
];

export default function Train() {
    const [form, setForm] = useState({
        dataset: 'mp_20',
        epochs: 10,
        batch_size: 32,
        learning_rate: 0.001,
    });
    const [jobId, setJobId] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pollRef = useRef(null);
    const logEndRef = useRef(null);

    // Scroll log viewer to bottom
    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [job?.logs]);

    // Poll job status
    useEffect(() => {
        if (!jobId) return;
        const poll = async () => {
            try {
                const data = await api.getJobStatus(jobId);
                setJob(data);
                if (data.state === 'completed' || data.state === 'failed' || data.state === 'stopped') {
                    clearInterval(pollRef.current);
                }
            } catch {
                /* ignore */
            }
        };
        poll();
        pollRef.current = setInterval(poll, 1500);
        return () => clearInterval(pollRef.current);
    }, [jobId]);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const startTraining = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.startTraining(form);
            setJobId(res.job_id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stopTraining = async () => {
        if (!jobId) return;
        try {
            await api.stopTraining(jobId);
        } catch (err) {
            setError(err.message);
        }
    };

    const progress = job ? Math.round((job.current_epoch / job.epochs) * 100) : 0;
    const isRunning = job?.state === 'running';
    const isFinished = job?.state === 'completed' || job?.state === 'failed' || job?.state === 'stopped';

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl font-extrabold gradient-text mb-2">Train Model</h1>
                <p className="text-text-secondary">Configure and launch CDVAE training on crystal datasets</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Config Panel */}
                <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up">
                    <h2 className="text-lg font-semibold text-text-primary mb-5">Training Configuration</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Dataset</label>
                            <select
                                className="input-field"
                                value={form.dataset}
                                onChange={(e) => handleChange('dataset', e.target.value)}
                                disabled={isRunning}
                            >
                                {DATASETS.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Epochs</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.epochs}
                                min={1} max={500}
                                onChange={(e) => handleChange('epochs', parseInt(e.target.value) || 1)}
                                disabled={isRunning}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Batch Size</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.batch_size}
                                min={1} max={256}
                                onChange={(e) => handleChange('batch_size', parseInt(e.target.value) || 1)}
                                disabled={isRunning}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Learning Rate</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.learning_rate}
                                step={0.0001} min={0.0001} max={1}
                                onChange={(e) => handleChange('learning_rate', parseFloat(e.target.value) || 0.001)}
                                disabled={isRunning}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        {!isRunning ? (
                            <button className="btn-glow w-full" onClick={startTraining} disabled={loading}>
                                {loading ? 'Starting...' : isFinished ? 'Train Again' : 'Start Training'}
                            </button>
                        ) : (
                            <button className="btn-glow btn-danger w-full" onClick={stopTraining}>
                                Stop Training
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress & Logs Panel */}
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
                            <span>Epoch {job?.current_epoch || 0} / {job?.epochs || form.epochs}</span>
                            <span>{progress}%</span>
                        </div>

                        {job && (
                            <div className="grid grid-cols-2 gap-4 mt-5">
                                <div className="bg-bg-secondary rounded-xl p-4 text-center">
                                    <p className="text-xs text-text-muted mb-1">Current Loss</p>
                                    <p className="text-2xl font-bold text-accent-cyan">{job.loss?.toFixed(4) || '—'}</p>
                                </div>
                                <div className="bg-bg-secondary rounded-xl p-4 text-center">
                                    <p className="text-xs text-text-muted mb-1">Dataset</p>
                                    <p className="text-2xl font-bold text-accent-violet">{job.dataset}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logs */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Training Logs</h2>
                        <div className="log-viewer">
                            {job?.logs?.length ? (
                                job.logs.map((line, i) => <div key={i}>{line}</div>)
                            ) : (
                                <div className="text-text-muted">No logs yet. Start training to see output.</div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

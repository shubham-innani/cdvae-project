/**
 * API helper — all backend calls go through /api proxy (see vite.config.js).
 */

const BASE = '/api';

async function request(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Request failed');
    }
    return res.json();
}

export const api = {
    // Datasets
    listDatasets: () => request('GET', '/datasets'),
    uploadDataset: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${BASE}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Upload failed');
        }
        return res.json();
    },

    // Training
    startTraining: (data) => request('POST', '/train', data),
    stopTraining: (jobId) => request('POST', '/train/stop', { job_id: jobId }),

    // Generation
    startGeneration: (data) => request('POST', '/generate', data),
    /** Single crystal by composition (sync, no job). */
    generateCrystal: (composition) => request('POST', '/generate/single', { composition }),

    // Status
    getStatus: () => request('GET', '/status'),
    getJobStatus: (jobId) => request('GET', `/status/${jobId}`),

    // Results
    getResults: () => request('GET', '/results'),
    getFiles: () => request('GET', '/files'),

    getCifText: async (filename) => {
        const safe = encodeURIComponent(filename);
        const res = await fetch(`${BASE}/download/${safe}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Failed to load CIF');
        }
        return res.text();
    },

    // Download — returns blob URL
    downloadFile: async (filename) => {
        const safe = encodeURIComponent(filename);
        const res = await fetch(`${BASE}/download/${safe}`);
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },
};

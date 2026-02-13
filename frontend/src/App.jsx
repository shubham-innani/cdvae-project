import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Train from './pages/Train';
import Generate from './pages/Generate';
import Results from './pages/Results';
import './index.css';

// Lazy load the heavy 3D visualization page
const Visualize = lazy(() => import('./pages/Visualize'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
        <p className="text-text-secondary">Loading 3D Viewer...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <main className="flex-1 overflow-y-auto ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/train" element={<Train />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/results" element={<Results />} />
            <Route path="/visualize" element={
              <Suspense fallback={<LoadingFallback />}>
                <Visualize />
              </Suspense>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

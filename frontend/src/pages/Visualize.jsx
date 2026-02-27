import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Html } from '@react-three/drei';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import * as THREE from 'three';

// ─── Atom colors by element ──────────────────────────────────────────
const ELEMENT_COLORS = {
    Si: '#f0ab3d', Ge: '#668f8f', C: '#909090', Na: '#ab5cf2',
    Cl: '#1ff01f', Ti: '#bfc2c7', O: '#ff0d0d', Fe: '#e06633',
    Al: '#bfa6a6', Mg: '#8aff00', H: '#ffffff', N: '#3050f8',
    S: '#ffff30', P: '#ff8000', Ca: '#3dff00', K: '#8f40d4',
};
const DEFAULT_COLOR = '#6699cc';

// ─── Parse CIF content into atoms & lattice ──────────────────────────
function parseCIF(content) {
    const lines = content.split('\n');
    const atoms = [];
    let a = 5, b = 5, c = 5;
    let inLoop = false;
    let headers = [];

    for (const raw of lines) {
        const line = raw.trim();
        if (line.startsWith('_cell_length_a')) a = parseFloat(line.split(/\s+/)[1]) || 5;
        if (line.startsWith('_cell_length_b')) b = parseFloat(line.split(/\s+/)[1]) || 5;
        if (line.startsWith('_cell_length_c')) c = parseFloat(line.split(/\s+/)[1]) || 5;

        if (line === 'loop_') { inLoop = true; headers = []; continue; }
        if (inLoop && line.startsWith('_')) { headers.push(line); continue; }
        if (inLoop && headers.length > 0 && !line.startsWith('_') && line.length > 0) {
            const parts = line.split(/\s+/);
            if (parts.length >= headers.length) {
                const labelIdx = headers.indexOf('_atom_site_label');
                const symbolIdx = headers.indexOf('_atom_site_type_symbol');
                const xIdx = headers.indexOf('_atom_site_fract_x');
                const yIdx = headers.indexOf('_atom_site_fract_y');
                const zIdx = headers.indexOf('_atom_site_fract_z');

                if (xIdx >= 0 && yIdx >= 0 && zIdx >= 0) {
                    const element = symbolIdx >= 0 ? parts[symbolIdx] : (labelIdx >= 0 ? parts[labelIdx].replace(/\d/g, '') : 'X');
                    atoms.push({
                        element,
                        x: parseFloat(parts[xIdx]) * a,
                        y: parseFloat(parts[yIdx]) * b,
                        z: parseFloat(parts[zIdx]) * c,
                    });
                }
            }
        }
    }

    return { atoms, lattice: { a, b, c } };
}

// ─── 3D Atom Component ───────────────────────────────────────────────
function Atom({ position, element, scale = 1 }) {
    const color = ELEMENT_COLORS[element] || DEFAULT_COLOR;
    const ref = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame(() => {
        if (ref.current) {
            ref.current.scale.setScalar(hovered ? scale * 1.3 : scale);
        }
    });

    return (
        <group position={position}>
            <Sphere
                ref={ref}
                args={[0.3, 32, 32]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
            </Sphere>
            {hovered && (
                <Html distanceFactor={10}>
                    <div className="bg-bg-card text-text-primary text-xs px-2 py-1 rounded-lg border border-border-glass whitespace-nowrap">
                        {element} ({position.map(p => p.toFixed(2)).join(', ')})
                    </div>
                </Html>
            )}
        </group>
    );
}

// ─── Bond (cylinder between two points) ──────────────────────────────
function Bond({ start, end }) {
    const direction = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
    const length = direction.length();
    const midpoint = new THREE.Vector3(...start).add(direction.multiplyScalar(0.5));

    const orientation = new THREE.Matrix4();
    orientation.lookAt(new THREE.Vector3(...start), new THREE.Vector3(...end), new THREE.Vector3(0, 1, 0));
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(orientation);

    return (
        <Cylinder
            args={[0.05, 0.05, length, 8]}
            position={midpoint.toArray()}
            quaternion={quaternion}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.3} transparent opacity={0.6} />
        </Cylinder>
    );
}

// ─── Unit Cell Wireframe ─────────────────────────────────────────────
function UnitCell({ a, b, c }) {
    const points = useMemo(() => {
        const p = [
            [0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0],
            [0, 0, c], [a, 0, c], [a, b, c], [0, b, c],
        ];
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
        ];
        return edges.map(([i, j]) => ({
            start: p[i], end: p[j],
            geometry: new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...p[i]), new THREE.Vector3(...p[j])
            ]),
        }));
    }, [a, b, c]);

    return (
        <group>
            {points.map((edge, i) => (
                <line key={i} geometry={edge.geometry}>
                    <lineBasicMaterial color="#4a90d9" transparent opacity={0.4} />
                </line>
            ))}
        </group>
    );
}

// ─── Rotating Group ──────────────────────────────────────────────────
function RotatingGroup({ children, autoRotate }) {
    const ref = useRef();
    useFrame((_, delta) => {
        if (ref.current && autoRotate) {
            ref.current.rotation.y += delta * 0.3;
        }
    });
    return <group ref={ref}>{children}</group>;
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function Visualize() {
    const [searchParams] = useSearchParams();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [parsed, setParsed] = useState(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showBonds, setShowBonds] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingCif, setLoadingCif] = useState(false);
    const [error, setError] = useState('');
    const BOND_THRESHOLD = 3.5;

    useEffect(() => {
        let mounted = true;
        api.getFiles()
            .then((res) => {
                if (!mounted) return;
                const list = res.files || [];
                setFiles(list);
                const fileParam = searchParams.get('file');
                if (fileParam && list.includes(fileParam)) {
                    setSelectedFile(fileParam);
                }
            })
            .catch((e) => {
                if (!mounted) return;
                setError(e?.message || 'Failed to load files');
            })
            .finally(() => {
                if (!mounted) return;
                setLoadingFiles(false);
            });
        return () => { mounted = false; };
    }, [searchParams]);

    useEffect(() => {
        if (!selectedFile) return;
        let mounted = true;
        queueMicrotask(() => {
            if (!mounted) return;
            setLoadingCif(true);
            setError('');
            setParsed(null);
        });
        api.getCifText(selectedFile)
            .then((text) => {
                if (!mounted) return;
                setParsed(parseCIF(text));
            })
            .catch((e) => {
                if (!mounted) return;
                setError(e?.message || 'Failed to load CIF');
            })
            .finally(() => {
                if (!mounted) return;
                setLoadingCif(false);
            });
        return () => { mounted = false; };
    }, [selectedFile]);

    // compute bonds
    const bonds = useMemo(() => {
        if (!parsed || !showBonds) return [];
        const result = [];
        for (let i = 0; i < parsed.atoms.length; i++) {
            for (let j = i + 1; j < parsed.atoms.length; j++) {
                const a = parsed.atoms[i], b = parsed.atoms[j];
                const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
                if (dist < BOND_THRESHOLD && dist > 0.1) {
                    result.push({ start: [a.x, a.y, a.z], end: [b.x, b.y, b.z] });
                }
            }
        }
        return result;
    }, [parsed, showBonds]);

    // center offset
    const center = useMemo(() => {
        if (!parsed) return [0, 0, 0];
        return [-parsed.lattice.a / 2, -parsed.lattice.b / 2, -parsed.lattice.c / 2];
    }, [parsed]);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl font-extrabold gradient-text mb-2">3D Crystal Viewer</h1>
                <p className="text-text-secondary">Interactive visualization of crystal lattice structures</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Controls */}
                <div className="glass-card p-6 animate-fade-in-up space-y-5">
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Select CIF File</label>
                        <select
                            className="input-field"
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                            disabled={loadingFiles}
                        >
                            <option value="">{loadingFiles ? 'Loading files…' : '— Select a file —'}</option>
                            {files.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
                            {error}
                        </div>
                    )}

                    {parsed && (
                        <>
                            <div className="bg-bg-secondary rounded-xl p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-text-primary">Lattice Parameters</h3>
                                <p className="text-xs text-text-muted">a = {parsed.lattice.a.toFixed(3)} Å</p>
                                <p className="text-xs text-text-muted">b = {parsed.lattice.b.toFixed(3)} Å</p>
                                <p className="text-xs text-text-muted">c = {parsed.lattice.c.toFixed(3)} Å</p>
                            </div>

                            <div className="bg-bg-secondary rounded-xl p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-text-primary">Atoms ({parsed.atoms.length})</h3>
                                {parsed.atoms.map((atom, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: ELEMENT_COLORS[atom.element] || DEFAULT_COLOR }}
                                        />
                                        {atom.element} ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoRotate}
                                        onChange={(e) => setAutoRotate(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-text-secondary">Auto-rotate</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBonds}
                                        onChange={(e) => setShowBonds(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-text-secondary">Show Bonds</span>
                                </label>
                            </div>

                            <button
                                className="btn-glow btn-success w-full text-sm"
                                onClick={() => api.downloadFile(selectedFile)}
                                disabled={!selectedFile || loadingCif}
                            >
                                {loadingCif ? 'Loading…' : 'Export CIF'}
                            </button>
                        </>
                    )}

                    {!parsed && !loadingCif && !error && selectedFile && (
                        <div className="text-xs text-text-muted">
                            CIF loaded, parsing… (if this persists, the file may not be valid CIF)
                        </div>
                    )}
                </div>

                {/* 3D Viewer */}
                <div className="lg:col-span-3 glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', height: '600px' }}>
                    {parsed ? (
                        <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1} />
                            <pointLight position={[-10, -10, -10]} intensity={0.3} />

                            <RotatingGroup autoRotate={autoRotate}>
                                <group position={center}>
                                    <UnitCell a={parsed.lattice.a} b={parsed.lattice.b} c={parsed.lattice.c} />
                                    {parsed.atoms.map((atom, i) => (
                                        <Atom
                                            key={i}
                                            position={[atom.x, atom.y, atom.z]}
                                            element={atom.element}
                                        />
                                    ))}
                                    {bonds.map((bond, i) => (
                                        <Bond key={i} start={bond.start} end={bond.end} />
                                    ))}
                                </group>
                            </RotatingGroup>

                            <OrbitControls enableDamping dampingFactor={0.05} />
                        </Canvas>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-muted">
                            <div className="text-center">
                                {loadingCif ? (
                                    <>
                                        <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
                                        <p className="text-lg font-medium mb-1">Loading CIF…</p>
                                        <p className="text-sm">Fetching and parsing the crystal file</p>
                                    </>
                                ) : (
                                    <>
                                <svg className="w-16 h-16 mx-auto mb-4 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <p className="text-lg font-medium mb-1">No Crystal Selected</p>
                                <p className="text-sm">Select a CIF file to render its 3D structure</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

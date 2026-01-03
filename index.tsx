
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppState } from './types';
import { INITIAL_STATE, VEHICLE_ZONES, LOGO_BASE64, STORAGE_KEY } from './constants';

const App = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch { return INITIAL_STATE; }
  });
  
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Obsługa rysowania podpisu
  useEffect(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { 
        x: (clientX - rect.left) * (canvas.width / rect.width), 
        y: (clientY - rect.top) * (canvas.height / rect.height) 
      };
    };

    const start = (e: any) => {
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const move = (e: any) => {
      if (!isDrawing.current) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if (e.touches) e.preventDefault();
    };

    const stop = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      handleInputChange('sig_image_data', canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
    };
  }, []);

  const handleInputChange = (field: keyof AppState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const exportToPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Protokol_${state.nr_szkody || 'PZU'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      {/* Header Mobilny */}
      <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={LOGO_BASE64} alt="PZU" className="h-8" />
          <h1 className="font-bold text-blue-900 text-sm md:text-lg">Protokół Oględzin</h1>
        </div>
        <button onClick={exportToPDF} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
      </header>

      {/* Formularz */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Nr Szkody</label>
          <input className="w-full text-lg font-bold border-b-2 border-gray-100 focus:border-blue-500 outline-none pb-1" value={state.nr_szkody} onChange={e => handleInputChange('nr_szkody', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Nr Rejestracyjny</label>
          <input className="w-full text-lg font-bold border-b-2 border-gray-100 focus:border-blue-500 outline-none pb-1 uppercase" value={state.nr_rej} onChange={e => handleInputChange('nr_rej', e.target.value)} />
        </div>
      </section>

      {/* Mapa Lakieru */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          Mapa Pomiarów
        </h2>
        <div className="relative aspect-[1/1] bg-gray-50 rounded-xl overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            <rect x="25" y="5" width="50" height="90" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="0.5" />
            {VEHICLE_ZONES.map(z => (
              <g key={z.id} onClick={() => setActiveZone(z.id)} className="cursor-pointer">
                <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={activeZone === z.id ? '#dbeafe' : 'transparent'} stroke="#94a3b8" strokeWidth="0.3" />
                <text x={z.x + z.w/2} y={z.y + z.h/2} textAnchor="middle" fontSize="1.8" fill="#64748b">{z.name}</text>
              </g>
            ))}
          </svg>
          {activeZone && (
            <div className="absolute inset-x-4 bottom-4 bg-white shadow-2xl rounded-2xl p-4 border border-blue-100 animate-bounce-in">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-blue-900">{VEHICLE_ZONES.find(z => z.id === activeZone)?.name}</span>
                <button onClick={() => setActiveZone(null)} className="text-gray-400">✕</button>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map(idx => (
                  <input key={idx} type="number" className="w-full bg-gray-50 border rounded-lg p-2 text-center text-sm font-bold" placeholder="µm" 
                    value={state.map_state[activeZone]?.values[idx] || ''}
                    onChange={e => {
                      const newState = {...state};
                      if (!newState.map_state[activeZone]) newState.map_state[activeZone] = { id: activeZone, values: ['', '', ''], type: 'control', special: null };
                      newState.map_state[activeZone].values[idx] = e.target.value;
                      setState(newState);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Aparat - Dokumentacja */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Zdjęcia Uszkodzeń
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => <img key={i} src={p} className="aspect-square object-cover rounded-lg border" />)}
          <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            <span className="text-blue-500 text-2xl">+</span>
          </label>
        </div>
      </section>

      {/* Podpis */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-blue-900 mb-2">Podpis</h2>
        <canvas ref={sigCanvasRef} width={800} height={300} className="w-full h-40 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 touch-none" />
        <button onClick={() => {
          const ctx = sigCanvasRef.current?.getContext('2d');
          ctx?.clearRect(0,0,800,300);
          handleInputChange('sig_image_data', null);
        }} className="mt-2 text-xs text-red-500 font-bold">Wyczyść podpis</button>
      </section>

      {/* PDF Generator (Hidden) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="pdf-content" className="pdf-container">
          <div className="flex justify-between border-b-2 border-blue-900 pb-4 mb-4">
            <img src={LOGO_BASE64} className="h-10" />
            <h1 className="text-xl font-bold">PROTOKÓŁ OGLĘDZIN POJAZDU</h1>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <p>Nr szkody: <b>{state.nr_szkody}</b></p>
            <p>Nr rej: <b>{state.nr_rej}</b></p>
            <p>VIN: <b>{state.nr_vin}</b></p>
            <p>Data: <b>{state.data_kontroli}</b></p>
          </div>
          <div className="border p-4 rounded-lg italic text-sm mb-8">
            {state.uwagi_str1 || "Brak uwag."}
          </div>
          <div className="flex justify-end mt-20">
            <div className="text-center">
              {state.sig_image_data && <img src={state.sig_image_data} className="h-20 mx-auto" />}
              <div className="border-t w-48 mt-2 text-[10px]">Podpis rzeczoznawcy / Klienta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);

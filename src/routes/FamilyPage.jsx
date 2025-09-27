// ===============================
// src/routes/FamilyPage.jsx — Página separada de Familia (sin react-router)
// Ajustes pedidos:
// - Header: solo código HC y botón "i" para info filiatoria
// - Tab "resumen": textarea de Resumen con Motivo de consulta, Estudios genéticos, Última evolución
// - Panel derecho: título "Miembros" y listado A1/B1/etc. con nombre, edad y OS
// ===============================
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import GeneticsPage from './GeneticsPage.jsx';
import FamilyStudiesPage from './FamilyStudiesPage.jsx';
import PhotosPage from './PhotosPage.jsx';
import MembersPage from './MembersPage.jsx';
import FamilyTreePage from './FamilyTreePage.jsx';

// ---- Store simulado compatible con AppRoutes ----
const STORAGE_KEY = 'cenagem-demo-v1';
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  const f1 = { id: uid(), code: 'FAM-000X', provincia: 'CABA', createdAt: seedNow(), updatedAt: seedNow(), tags: ['demo'] };
  const members = [ { id: uid(), familyId: f1.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Demo', sexo: 'F', nacimiento: '2000-01-01', notas: [], nombre: 'Paciente A1', os: '—' } ];
  const evol = [ { id: uid(), memberId: members[0].id, author: 'demo@cenagem', texto: 'Nota de demostración', at: seedNow() } ];
  const seed = { families: [f1], members, evolutions: evol };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch {}
  return seed;
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_MEMBER': {
      const { familyId, data } = action.payload; const m = { id: uid(), familyId, notas: [], ...data };
      return { ...state, members: [m, ...state.members] };
    }
    case 'ADD_EVOLUTION': {
      const { memberId, texto, author } = action.payload; const e = { id: uid(), memberId, texto, author, at: seedNow() };
      return { ...state, evolutions: [e, ...state.evolutions] };
    }
    default: return state;
  }
}

function useFamiliesSimulated() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);
  const listMembers = (familyId) => state.members.filter(m => m.familyId === familyId);
  const createMember = (familyId, data) => dispatch({ type: 'CREATE_MEMBER', payload: { familyId, data } });
  const addEvolution = (memberId, texto, author) => dispatch({ type: 'ADD_EVOLUTION', payload: { memberId, texto, author } });
  return { state, listMembers, createMember, addEvolution };
}

// ---- Utils ----
const toDate = (s) => { try { return new Date(s); } catch { return null; } };
const fmtDateTime = (d) => d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '—';
const yearsSince = (isoDate) => {
  const d = toDate(isoDate); if (!d) return '—';
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

function pickA1(members) { return members.find(m => m.rol === 'Proband'); }
function latestEvolutionForFamily(evolutions, members) {
  const famMemberIds = new Set(members.map(m=>m.id));
  const evs = evolutions.filter(e => famMemberIds.has(e.memberId));
  evs.sort((a,b)=> new Date(b.at).getTime() - new Date(a.at).getTime());
  return evs[0];
}
function inferGeneticStudiesText(evolutions) {
  const txt = evolutions.map(e=>e.texto || '').join(' \n ');
  const keys = ['array-CGH','NGS','panel','BRCA','HRR','exoma','genoma'];
  const found = keys.filter(k => new RegExp(k,'i').test(txt));
  return found.length ? found.join(', ') : '—';
}

// ---- UI locales ----
function InfoIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function AppToolbar({ code, onBack, infoContent }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">← Volver</button>
          <h2 className="text-lg font-semibold">HC {code}</h2>
        </div>
        <button
          aria-label="Información filiatoria"
          onClick={()=>setShowInfo(v=>!v)}
          className="px-2 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-700"
          title="Información"
        >
          <InfoIcon className="w-5 h-5" />
        </button>
      </div>
      {showInfo && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-700">
          {infoContent}
        </div>
      )}
    </div>
  );
}

function MemberCardLine({ m, onOpen }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200">
      <div className="text-sm">
        <b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || '—'} · {yearsSince(m.nacimiento)} · OS: {m.os || '—'}
      </div>
      {onOpen && (<button onClick={()=>onOpen(m)} className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50">Abrir</button>)}
    </div>
  );
}

// ---- Mapeo de tabs (clave interna -> label visible)
const TAB_LABEL = {
  resumen: 'Resumen',
  arbol: 'Arbol familiar',
  complementarios: 'Estudios complementarios',
  geneticos: 'Estudios genéticos',
  fotos: 'Fotos',
  miembros: 'Miembros', 
  
};
const TABS_ORDER = ['resumen', 'arbol', 'complementarios', 'geneticos', 'fotos', 'miembros']; // ← agregado

function FamilyDetail({ family, members, evolutions, onBack, onNewMember, onOpenMember, initialTab='resumen' }) {
  const [tab, setTab] = useState(initialTab);
// dentro de FamilyPage (afuera de FamilyDetail) o directamente dentro de FamilyDetail si preferís,
// agregá este estado en FamilyDetail (porque ahí están las pestañas):
const [membersInitialId, setMembersInitialId] = useState('');

  // Datos para Resumen
  const a1 = useMemo(()=>pickA1(members), [members]);
  const lastEv = useMemo(()=>latestEvolutionForFamily(evolutions, members), [evolutions, members]);
  const studies = useMemo(()=>inferGeneticStudiesText(evolutions.filter(e => members.some(m=>m.id===e.memberId))), [evolutions, members]);
  
  
  
  const resumenText = useMemo(() => {
    const motivo = a1?.diagnostico || '—';
    const est = studies || '—';
    const u = lastEv ? `${fmtDateTime(new Date(lastEv.at))}: ${lastEv.texto}` : '—';
    return `Motivo de consulta: ${motivo}\nEstudios genéticos: ${est}\nÚltima evolución: ${u}`;
  }, [a1, studies, lastEv]);

  const infoBox = (
    <div className="grid md:grid-cols-3 gap-2">
      <div><span className="text-slate-500">Dirección:</span> {family.direccion || '—'}</div>
      <div><span className="text-slate-500">Ciudad / Provincia:</span> {(family.ciudad ? `${family.ciudad} / ` : '') + (family.provincia || '—')}</div>
      <div><span className="text-slate-500">Actualización:</span> {fmtDateTime(new Date(family.updatedAt))}</div>
      <div><span className="text-slate-500">Teléfono B1:</span> { (members.find(m => m.filiatorios?.iniciales === 'B1')?.telefono) || '—' }</div>
      <div><span className="text-slate-500">Teléfono C1:</span> { (members.find(m => m.filiatorios?.iniciales === 'C1')?.telefono) || '—' }</div>
      <div><span className="text-slate-500">Provincia:</span> {family.provincia || '—'}</div>
      <div className="md:col-span-3 grid md:grid-cols-2 gap-2 mt-1">
        <div>
          <div className="text-slate-500">Médico derivante</div>
          <div>
            {family.medicoDerivante?.nombre ? (
              <>
                <b>{family.medicoDerivante.nombre}</b>
                {family.medicoDerivante.especialidad ? ` · ${family.medicoDerivante.especialidad}` : ''}
                {family.medicoDerivante.hospital ? ` · ${family.medicoDerivante.hospital}` : ''}
              </>
            ) : '—'}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Médico a cargo (CENAGEM)</div>
          <div>
            {family.medicoACargo?.nombre ? (
              <>
                <b>{family.medicoACargo.nombre}</b>
                {family.medicoACargo.especialidad ? ` · ${family.medicoACargo.especialidad}` : ''}
                {family.medicoACargo.hospital ? ` · ${family.medicoACargo.hospital}` : ''}
              </>
            ) : '—'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <AppToolbar code={family.code} onBack={onBack} infoContent={infoBox} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mt-0 flex items-center gap-2 text-sm">
          {TABS_ORDER.map(key => {
            const label = TAB_LABEL[key];
            const isActive = tab === key;
            const common = `px-3 py-1.5 rounded-xl border ${isActive? 'bg-slate-900 text-white border-slate-900':'border-slate-300 hover:bg-slate-50'}`;

            if (key === 'fotos') {
              return (
                <button
                  key={key}
                  onClick={()=> setTab('fotos')}
                  className={common}
                  title="Fotos"
                >
                  {label}
                </button>
              );
            }
            

           // dentro del map de TABS_ORDER
if (key === 'arbol') {
  return (
    <button
      key={key}
      onClick={()=> setTab('arbol')}
      className={common}
      title="Árbol familiar"
    >
      {label}
    </button>
  );
}

            

            return (
              <button key={key} onClick={()=>setTab(key)} className={common}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'fotos' && (
  <PhotosPage familyId={family.id} inline />
)}
{tab === 'miembros' && (
    <MembersPage familyId={family.id} />
  )}
  {tab === 'arbol' && (
    <FamilyTreePage familyId={family.id} inline />
  )}
      {tab === 'resumen' && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">Resumen</div>
            <textarea value={resumenText} readOnly className="min-h-[140px] px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700"/>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">Miembros</div>
            <div className="grid gap-2">
              {members.map(m => (
                <MemberCardLine
                key={m.id}
                m={m}
                onOpen={(mm) => {
                  setMembersInitialId(mm.id);
                  setTab('miembros');         // cambiar a la pestaña Miembros
                }}
              />
              ))}
            </div>
          </div>
        </div>
      )}
{tab === 'miembros' && (
  <MembersPage
    familyId={family.id}
    inline
    initialMemberId={membersInitialId}
  />
)}

      {tab === 'complementarios' && (
        <FamilyStudiesPage familyId={family.id} inline />
      )}

      {tab === 'geneticos' && (
        <GeneticsPage familyId={family.id} inline />
      )}
    </div>
  );
}

// ---- Página ----
export default function FamilyPage({ user = { email: 'genetista@cenagem.gob.ar' }, familyId }) {
  const { state, listMembers, createMember, addEvolution } = useFamiliesSimulated();
  const fam = state.families.find(f => f.id === familyId);
  const famMembers = useMemo(() => fam ? listMembers(fam.id) : [], [fam, state.members]);

  useEffect(() => {
    if (!familyId) {
      const h = (window.location.hash || '').replace(/^#\/?/, '');
      const [, id] = h.split('/');
      if (id && !fam) {
        window.location.hash = `#/family/${id}`;
      }
    }
  }, [familyId, fam]);

  if (!fam) {
    return (
      <div className="p-6">
        <AppToolbar code={'—'} onBack={() => { window.location.hash = ''; }} infoContent={null} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia solicitada.</div>
      </div>
    );
  }

  return (
    <div className="p-6 grid gap-4">
      <FamilyDetail
        family={fam}
        members={famMembers}
        evolutions={state.evolutions}
        onBack={() => { window.location.hash = ''; }}
        onNewMember={(m) => createMember(fam.id, m)}
        onOpenMember={(m) => alert(`Abrir miembro ${m.filiatorios?.iniciales || m.rol}`)}
        initialTab={'resumen'}
      />
    </div>
  );
}

// ===============================
// src/store/cenagemStore.js — Store simulado con persistencia localStorage
// ===============================
import { useEffect, useReducer } from 'react';

export const STORAGE_KEY = 'cenagem-demo-v1';
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const initialSeed = () => {
  const f1 = { id: uid(), code: 'FAM-0001', provincia: 'Buenos Aires', createdAt: seedNow(), updatedAt: seedNow(), tags: ['prenatal','NGS'] };
  const f2 = { id: uid(), code: 'FAM-0002', provincia: 'CABA', createdAt: seedNow(), updatedAt: seedNow(), tags: ['oncogenética'] };
  const f3 = { id: uid(), code: 'FAM-0003', provincia: 'Mendoza', createdAt: seedNow(), updatedAt: seedNow(), tags: ['infertilidad','asesoría'] };
  const f4 = { id: uid(), code: 'FAM-0004', provincia: 'Córdoba', createdAt: seedNow(), updatedAt: seedNow(), tags: ['pediatría'] };
  const f5 = { id: uid(), code: 'FAM-0005', provincia: 'Santa Fe', createdAt: seedNow(), updatedAt: seedNow(), tags: ['adultos','array-CGH'] };

  const members = [
    { id: uid(), familyId: f1.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Talla baja proporcional', sexo: 'F', nacimiento: '2020-07-02', notas: [{ id: uid(), texto: 'Se solicita array-CGH' }] },
    { id: uid(), familyId: f1.id, rol: 'Madre', filiatorios: { iniciales: 'M1' }, sexo: 'F', nacimiento: '1992-05-11', notas: [] },
    { id: uid(), familyId: f1.id, rol: 'Padre', filiatorios: { iniciales: 'P1' }, sexo: 'M', nacimiento: '1990-01-09', notas: [] },

    { id: uid(), familyId: f2.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Historia oncológica familiar', sexo: 'M', nacimiento: '2015-12-19', notas: [] },
    { id: uid(), familyId: f2.id, rol: 'Hermana', filiatorios: { iniciales: 'H1' }, sexo: 'F', nacimiento: '2018-03-04', notas: [] },

    { id: uid(), familyId: f3.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Infertilidad: estudio básico', sexo: 'F', nacimiento: '1993-08-21', notas: [] },

    { id: uid(), familyId: f4.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Pubertad precoz', sexo: 'M', nacimiento: '2019-10-10', notas: [] },
    { id: uid(), familyId: f4.id, rol: 'Madre', filiatorios: { iniciales: 'M1' }, sexo: 'F', nacimiento: '1996-06-06', notas: [] },

    { id: uid(), familyId: f5.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, diagnostico: 'Chequeo adulto · array-CGH', sexo: 'F', nacimiento: '1987-02-14', notas: [] },
  ];

  const evolutions = [
    { id: uid(), memberId: members[0].id, author: 'genetista@cenagem.gob.ar', texto: 'Motivo: talla baja proporcional. Se solicita array-CGH.', at: seedNow() },
    { id: uid(), memberId: members[3].id, author: 'genetista@cenagem.gob.ar', texto: 'Historia oncológica familiar positiva. Panel genes BRCA/HRR.', at: seedNow() },
    { id: uid(), memberId: members[6].id, author: 'consultorio@cenagem.gob.ar', texto: 'Derivado a endocrino por pubertad precoz. Pendiente NGS.', at: seedNow() },
  ];

  const studies = [];
  const genetics = [];
  const photos = []; // <<— nuevo slice

  return { families: [f1,f2,f3,f4,f5], members, evolutions, studies, genetics, photos };
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = initialSeed();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch {}
  return seed;
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return initialSeed();

    // Base
    case 'CREATE_FAMILY': {
      const fam = action.payload;
      return { ...state, families: [fam, ...state.families] };
    }
    case 'UPDATE_FAMILY': {
      const { familyId, patch } = action.payload;
      return { ...state, families: state.families.map(f => f.id === familyId ? { ...f, ...patch, updatedAt: seedNow() } : f) };
    }
    case 'CREATE_MEMBER': {
      const member = action.payload;
      return { ...state, members: [member, ...state.members] };
    }
    case 'UPDATE_MEMBER': {
      const { memberId, patch } = action.payload;
      return { ...state, members: state.members.map(m => m.id === memberId ? { ...m, ...patch } : m) };
    }
    case 'ADD_EVOLUTION': {
      const { memberId, texto, author } = action.payload;
      const e = { id: uid(), memberId, texto, author, at: seedNow() };
      return { ...state, evolutions: [e, ...state.evolutions] };
    }

    // Complementarios
    case 'CREATE_STUDY': {
      const s = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, studies: [s, ...(state.studies || [])] };
    }
    case 'DELETE_STUDY': {
      const { id } = action.payload;
      return { ...state, studies: (state.studies || []).filter(s => s.id !== id) };
    }

    // Genéticos
    case 'CREATE_GENETIC': {
      const g = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, genetics: [g, ...(state.genetics || [])] };
    }
    case 'UPDATE_GENETIC': {
      const { id, patch } = action.payload;
      return { ...state, genetics: (state.genetics || []).map(g => g.id === id ? { ...g, ...patch } : g) };
    }
    case 'DELETE_GENETIC': {
      const { id } = action.payload;
      return { ...state, genetics: (state.genetics || []).filter(g => g.id !== id) };
    }

    // Fotos
    case 'CREATE_PHOTO': {
      const p = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, photos: [p, ...(state.photos || [])] };
    }
    case 'DELETE_PHOTO': {
      const { id } = action.payload;
      return { ...state, photos: (state.photos || []).filter(p => p.id !== id) };
    }

    default:
      return state;
  }
}

export function useCenagemStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);

  // Base
  const listFamilies = () => state.families;
  const listMembers = (familyId) => state.members.filter(m => m.familyId === familyId);
  const createFamily = (data) => {
    const fam = { id: uid(), createdAt: seedNow(), updatedAt: seedNow(), ...data };
    dispatch({ type: 'CREATE_FAMILY', payload: fam });
    return fam;
  };
  const updateFamily = (familyId, patch) => dispatch({ type: 'UPDATE_FAMILY', payload: { familyId, patch } });
  const createMember = (familyId, data) => {
    const member = { id: uid(), familyId, notas: [], ...data };
    dispatch({ type: 'CREATE_MEMBER', payload: member });
    return member;
  };
  const updateMember = (memberId, patch) => dispatch({ type: 'UPDATE_MEMBER', payload: { memberId, patch } });
  const addEvolution = (memberId, texto, author) => dispatch({ type: 'ADD_EVOLUTION', payload: { memberId, texto, author } });

  // Complementarios
  const listStudiesByFamily = (familyId) => (state.studies || []).filter(s => s.familyId === familyId);
  const createStudy = (payload) => dispatch({ type: 'CREATE_STUDY', payload });
  const deleteStudy = (id) => dispatch({ type: 'DELETE_STUDY', payload: { id } });

  // Genéticos
  const listGeneticsByFamily = (familyId) => (state.genetics || []).filter(g => g.familyId === familyId);
  const createGenetic = (payload) => dispatch({ type: 'CREATE_GENETIC', payload });
  const updateGenetic = (id, patch) => dispatch({ type: 'UPDATE_GENETIC', payload: { id, patch } });
  const deleteGenetic = (id) => dispatch({ type: 'DELETE_GENETIC', payload: { id } });

  // Fotos
  const listPhotosByFamily = (familyId) => (state.photos || []).filter(p => p.familyId === familyId);
  const createPhoto = (payload) => dispatch({ type: 'CREATE_PHOTO', payload });
  const deletePhoto = (id) => dispatch({ type: 'DELETE_PHOTO', payload: { id } });

  const resetDemo = () => dispatch({ type: 'RESET' });

  return {
    state,
    families: state.families,
    members: state.members,
    evolutions: state.evolutions,
    studies: state.studies || [],
    genetics: state.genetics || [],
    photos: state.photos || [],
    // base
    listFamilies, listMembers,
    createFamily, updateFamily,
    createMember, updateMember,
    addEvolution,
    // slices
    listStudiesByFamily, createStudy, deleteStudy,
    listGeneticsByFamily, createGenetic, updateGenetic, deleteGenetic,
    listPhotosByFamily, createPhoto, deletePhoto,
    // misc
    resetDemo,
    STORAGE_KEY
  };
}

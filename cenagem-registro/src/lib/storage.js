// STORAGE + REDUCER + STORE HOOK
export const STORAGE_KEY = 'cenagem-demo-v1';
export const seedNow = () => new Date().toISOString();
export const uid = () => Math.random().toString(36).slice(2, 10);


export function loadState() {
try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
const f1 = { id: uid(), code: 'FAM-000X', provincia: 'CABA', createdAt: seedNow(), updatedAt: seedNow(), tags: ['demo'] };
const m1 = { id: uid(), familyId: f1.id, rol: 'Proband', filiatorios: { iniciales: 'A1' }, nombre: 'Paciente A1', sexo: 'F', nacimiento: '2000-01-01', os: '—', notas: [] };
const seed = { families: [f1], members: [m1], evolutions: [], studies: [], pedigree: {} };
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch {}
return seed;
}


export function reducer(state, action) {
switch (action.type) {
case 'SET_PARENT': {
const { memberId, parentType, parentId } = action.payload; // 'padreId' | 'madreId'
const prev = state.pedigree || {}; const node = { ...(prev[memberId]||{}), [parentType]: parentId||'' };
return { ...state, pedigree: { ...prev, [memberId]: node } };
}
case 'ADD_MEMBER': {
const m = action.payload; return { ...state, members: [...(state.members||[]), m] };
}
case 'REWRITE_STATE': return action.payload;
default: return state;
}
}


export function useDebouncedSave(value, delay=200){
React.useEffect(()=>{ const t = setTimeout(()=>{ try{localStorage.setItem(STORAGE_KEY, JSON.stringify(value));}catch{} }, delay); return ()=>clearTimeout(t); },[value,delay]);
}


export function useCenagemStore(){
const [state, dispatch] = React.useReducer(reducer, null, loadState);
useDebouncedSave(state);
const listMembers = React.useCallback(fid => (state.members||[]).filter(m=>m.familyId===fid), [state.members]);
const setParent = React.useCallback((id,t,p)=>dispatch({type:'SET_PARENT',payload:{memberId:id,parentType:t,parentId:p}}),[]);
const addMember = React.useCallback((m)=> dispatch({ type:'ADD_MEMBER', payload: m }), []);
const reloadFromStorage = React.useCallback(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) dispatch({type:'REWRITE_STATE',payload:JSON.parse(raw)});}catch{} },[]);
return { state, listMembers, setParent, addMember, reloadFromStorage };
}
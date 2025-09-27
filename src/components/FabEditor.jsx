export default function FabEditor({ visible, onAddParent, onAddSibling, onAddPartner, onAddChild }){
    if(!visible) return null;
    return (
    <div className="fixed right-4 bottom-20 z-30">
    <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-3 grid gap-2 text-sm">
    <div className="text-xs text-slate-600">Acciones sobre el miembro seleccionado</div>
    <div className="grid grid-cols-2 gap-2">
    <button className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50" onClick={()=> onAddParent('padre')}>+ Padre</button>
    <button className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50" onClick={()=> onAddParent('madre')}>+ Madre</button>
    <button className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50" onClick={onAddSibling}>+ Hermano/a</button>
    <button className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50" onClick={onAddPartner}>+ Pareja</button>
    <button className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 col-span-2" onClick={onAddChild}>+ Hijo/a</button>
    </div>
    </div>
    </div>
    );
    }
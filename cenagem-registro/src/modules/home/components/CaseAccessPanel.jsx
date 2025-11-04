// ===============================
// src/modules/home/components/CaseAccessPanel.jsx — Acciones rápidas de HC
// ===============================
import React from 'react';

export default function CaseAccessPanel({
  onCreateCase,
  onOpenAnalytics,
  familyCodeValue,
  onFamilyCodeChange,
  onSubmitFamilyCode,
  feedbackMessage,
  searchResults = [],
  searchLoading = false,
  onSelectSearchResult,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmitFamilyCode?.();
  };

  const query = (familyCodeValue || '').trim();
  const normalizedResults = Array.isArray(searchResults) ? searchResults : [];
  const hasSearchResults = normalizedResults.length > 0;
  const shouldShowResults = Boolean(query.length >= 2 || hasSearchResults || searchLoading);

  return (
    <div className="flex flex-col gap-2 text-white">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onCreateCase}
          className="px-4 py-2 rounded-xl border border-white/40 !text-white hover:bg-white/10 transition text-sm font-medium"
        >
          + Nueva HC familiar
        </button>

      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          value={familyCodeValue}
          onChange={(event) => onFamilyCodeChange?.(event.target.value)}
          placeholder="Buscar HC por número, apellido o DNI"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-white/40 bg-white/10 text-sm text-white placeholder-white/60 transition focus:bg-white/15"
          autoComplete="off"
          aria-label="Buscar historia clínica"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl border border-white/40 !text-white hover:bg-white/10 transition text-sm font-medium"
        >
          Ingresar
        </button>
      </form>
      {shouldShowResults && (
        <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {searchLoading && (
            <div className="px-4 py-3 text-sm text-slate-500">Buscando coincidencias…</div>
          )}
          {!searchLoading && hasSearchResults && (
            <ul className="max-h-60 overflow-y-auto">
              {normalizedResults.map((family) => {
                const members = Array.isArray(family.members) ? family.members : [];
                return (
                  <li key={family.id} className="border-t border-slate-100 first:border-t-0">
                    <button
                      type="button"
                      onClick={() => onSelectSearchResult?.(family.id)}
                      className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {family.code || 'HC sin código'}
                        </span>
                        {family.displayName ? (
                          <span className="text-xs font-medium text-slate-500">
                            {family.displayName}
                          </span>
                        ) : null}
                      </div>
                      {members.length > 0 ? (
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          {members.map((member) => {
                            const memberLabel = member.name || member.nombreCompleto || member.initials || 'Miembro sin nombre';
                            const documentLabel = member.dni || member.documento || member.documentNumber || '';
                            const roleLabel = member.role || member.rol || '';
                            return (
                              <div key={member.id} className="flex flex-wrap items-center gap-1">
                                <span className="font-medium text-slate-700">{memberLabel}</span>
                                {documentLabel && (
                                  <>
                                    <span className="text-slate-300">—</span>
                                    <span className="text-slate-500">DNI {documentLabel}</span>
                                  </>
                                )}
                                {roleLabel && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-slate-500">{roleLabel}</span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Sin miembros registrados</div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!searchLoading && !hasSearchResults && query.length >= 2 && (
            <div className="px-4 py-3 text-xs text-slate-500">
              No encontramos historias clínicas con ese criterio.
            </div>
          )}
        </div>
      )}
      {feedbackMessage && (
        <p className="text-xs text-rose-600" role="alert">
          {feedbackMessage}
        </p>
      )}
    </div>
  );
}

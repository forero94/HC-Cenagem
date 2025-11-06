// ===============================
// src/routes/AppRoutes.jsx — Router por hash (home / analytics / family / studies / genetics / photos)
// ===============================
import React, { useEffect, useState, Suspense } from 'react';

const HomePage = React.lazy(() => import('@/routes/HomePage.jsx'));
const AnalyticsPage = React.lazy(() => import('@/routes/AnalyticsPage.jsx'));
const FamilyPage = React.lazy(() => import('@/routes/FamilyPage.jsx'));
const FamilyStudiesPage = React.lazy(() => import('@/routes/FamilyStudiesPage.jsx'));
const GeneticsPage = React.lazy(() => import('@/routes/GeneticsPage.jsx'));
const PhotosPage = React.lazy(() => import('@/routes/PhotosPage.jsx'));
const FamilyTreePage = React.lazy(() => import('@/routes/FamilyTreePage.jsx'));
const UsersPage = React.lazy(() => import('@/routes/UsersPage.jsx'));

function parseLocationSegments(source) {
  if (!source) return { segments: [], params: {} };
  let value = source.trim();
  if (!value) return { segments: [], params: {} };
  value = value.replace(/^#/, '');
  value = value.replace(/^\/+/, '');
  if (value.startsWith('#')) {
    value = value.replace(/^#\/?/, '');
  }
  if (!value) return { segments: [], params: {} };
  const [pathPart, queryPart] = value.split('?');
  const segments = pathPart ? pathPart.split('/').filter(Boolean) : [];
  const params = {};
  if (queryPart) {
    const search = new URLSearchParams(queryPart);
    for (const [key, val] of search.entries()) {
      params[key] = val;
    }
  }
  return { segments, params };
}

function parseHash() {
  let { segments, params } = parseLocationSegments(window.location.hash || '');

  if (!segments.length) {
    ({ segments, params } = parseLocationSegments(window.location.pathname || ''));
  }

  const [seg0, seg1, seg2] = segments;
  if (seg0 === 'family' && seg1 && seg2 === 'studies') return { name: 'family-studies', familyId: seg1, params };
  if (seg0 === 'family' && seg1 && seg2 === 'genetics') return { name: 'family-genetics', familyId: seg1, params };
  if (seg0 === 'family' && seg1 && seg2 === 'photos') return { name: 'family-photos', familyId: seg1, params };
  if (seg0 === 'family' && seg1 && seg2 === 'tree') return { name: 'family-tree', familyId: seg1, params };
  if (seg0 === 'family' && seg1) return { name: 'family', familyId: seg1, params };
  if (seg0 === 'analytics') return { name: 'analytics', params };
  if (seg0 === 'users') return { name: 'users', params };
  return { name: 'home', params };
}

export default function AppRoutes({ user = { email: 'genetista@cenagem.gob.ar' }, onLogout = ()=>{} }) {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.name === 'analytics') {
    return (
      <Suspense fallback={<div className="p-6">Cargando analytics…</div>}>
        <AnalyticsPage onBack={() => { window.location.hash = ''; }} />
      </Suspense>
    );
  }

  if (route.name === 'family-studies') {
    return (
      <Suspense fallback={<div className="p-6">Cargando estudios…</div>}>
        <FamilyStudiesPage familyId={route.familyId} />
      </Suspense>
    );
  }

  if (route.name === 'family-genetics') {
    return (
      <Suspense fallback={<div className="p-6">Cargando genética…</div>}>
        <GeneticsPage familyId={route.familyId} />
      </Suspense>
    );
  }

  if (route.name === 'family-photos') {
    return (
      <Suspense fallback={<div className="p-6">Cargando fotos…</div>}>
        <PhotosPage familyId={route.familyId} initialMemberId={route.params?.member || ''} />
      </Suspense>
    );
  }

  if (route.name === 'family-tree') {
    return (
      <Suspense fallback={<div className="p-6">Cargando árbol…</div>}>
        <FamilyTreePage familyId={route.familyId} />
      </Suspense>
    );
  }

  if (route.name === 'family') {
    return (
      <Suspense fallback={<div className="p-6">Cargando familia…</div>}>
        <FamilyPage user={user} familyId={route.familyId} />
      </Suspense>
    );
  }

  if (route.name === 'users') {
    return (
      <Suspense fallback={<div className="p-6">Cargando usuarios…</div>}>
        <UsersPage
          user={user}
          onLogout={onLogout}
          onBack={() => {
            window.location.hash = '';
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="p-6">Cargando inicio…</div>}>
      <HomePage user={user} onLogout={onLogout} />
    </Suspense>
  );
}

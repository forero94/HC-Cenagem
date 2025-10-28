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

function parseHash() {
  const hash = (window.location.hash || '').replace(/^#\/?/, '');
  let segs = hash ? hash.split('/') : [];

  if (!segs.length) {
    const path = (window.location.pathname || '').replace(/^\/+/, '');
    if (path) segs = path.split('/');
  }

  const [seg0, seg1, seg2] = segs;
  if (seg0 === 'family' && seg1 && seg2 === 'studies') return { name: 'family-studies', familyId: seg1 };
  if (seg0 === 'family' && seg1 && seg2 === 'genetics') return { name: 'family-genetics', familyId: seg1 };
  if (seg0 === 'family' && seg1 && seg2 === 'photos') return { name: 'family-photos', familyId: seg1 };
  if (seg0 === 'family' && seg1) return { name: 'family', familyId: seg1 };
  if (seg0 === 'analytics') return { name: 'analytics' };
  return { name: 'home' };
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
        <PhotosPage familyId={route.familyId} />
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

  return (
    <Suspense fallback={<div className="p-6">Cargando inicio…</div>}>
      <HomePage user={user} onLogout={onLogout} />
    </Suspense>
  );
}

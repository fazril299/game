import React, { useState, useEffect, lazy, Suspense } from 'react';
import SkyWorld from './components/SkyWorld';
import Header from './components/Header';
import FlightHUD from './components/FlightHUD';
import MiniMap from './components/MiniMap';
import { soundEngine } from './audio/soundEngine';

// Lazy-loaded secondary drawers and modals for optimal bundle splitting
const StudioDrawer = lazy(() => import('./components/StudioDrawer'));
const GalleryDrawer = lazy(() => import('./components/GalleryDrawer'));
const LibraryDrawer = lazy(() => import('./components/LibraryDrawer'));
const SignalDrawer = lazy(() => import('./components/SignalDrawer'));
const HeritageArticleDrawer = lazy(() => import('./components/HeritageArticleDrawer'));
const ControlsModal = lazy(() => import('./components/ControlsModal'));

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [dockedIsland, setDockedIsland] = useState(null);
  const [targetIsland, setTargetIsland] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [flightStats, setFlightStats] = useState({
    speed: 0,
    heading: 0,
    altitude: 210,
    nearIsland: null,
    isDocked: false
  });

  // URL Hash Deep Linking (e.g. #about, #work, #ratuboko, #journal, #breksi, #parangtritis, #contact)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['about', 'work', 'ratuboko', 'journal', 'breksi', 'parangtritis', 'contact'].includes(hash)) {
        setTargetIsland(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update hash when docked
  const handleDock = (islandId) => {
    setDockedIsland(islandId);
    window.history.replaceState(null, '', `#${islandId}`);
  };

  const handleUndock = () => {
    setDockedIsland(null);
    window.history.replaceState(null, '', ' ');
  };

  const handleToggleSound = () => {
    const newState = soundEngine.toggle();
    setIsSoundOn(newState);
  };

  const handleToggleNight = () => {
    setIsNight((prev) => !prev);
  };

  const handleSelectIsland = (islandId) => {
    setTargetIsland(islandId);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* 3D WebGL Flight Canvas */}
      <SkyWorld
        isNight={isNight}
        onDock={handleDock}
        onUndock={handleUndock}
        dockedIsland={dockedIsland}
        targetIsland={targetIsland}
        setTargetIsland={setTargetIsland}
        onFlightStats={setFlightStats}
      />

      {/* Header Navigation & Global Actions */}
      <Header
        isNight={isNight}
        onToggleNight={handleToggleNight}
        isSoundOn={isSoundOn}
        onToggleSound={handleToggleSound}
        isControlsOpen={showControls}
        onOpenControls={() => setShowControls((prev) => !prev)}
        dockedIsland={dockedIsland}
        onSelectIsland={handleSelectIsland}
        onOpenSignal={() => handleSelectIsland('contact')}
      />

      {/* Interactive Javanese Astrolabe Radar / Mini-Map */}
      <MiniMap
        stats={flightStats}
        onSelectIsland={handleSelectIsland}
      />

      {/* Flight HUD & Telemetry */}
      <FlightHUD
        stats={flightStats}
        dockedIsland={dockedIsland}
        onMoor={() => {
          if (flightStats.nearIslandId) {
            setTargetIsland(flightStats.nearIslandId);
          } else if (flightStats.nearIsland) {
            const idMap = {
              'Sumbu Filosofi': 'about',
              'About': 'about',
              'Keraton': 'about',
              'Candi Prambanan': 'work',
              'Work': 'work',
              'Prambanan': 'work',
              'Candi Ratu Boko': 'ratuboko',
              'Ratu Boko': 'ratuboko',
              'Istana Air': 'journal',
              'Journal': 'journal',
              'Tamansari': 'journal',
              'Tebing Breksi': 'breksi',
              'Breksi & Mangunan': 'breksi',
              'Gumuk Pasir': 'parangtritis',
              'Parangtritis': 'parangtritis',
              'Tugu & Titik Nol': 'contact',
              'Contact': 'contact',
              'Titik Nol': 'contact'
            };
            const id = idMap[flightStats.nearIsland] || 'about';
            setTargetIsland(id);
          }
        }}
        onCastOff={handleUndock}
      />

      {/* Secondary Island Drawers and Overlays with Suspense */}
      <Suspense fallback={null}>
        <StudioDrawer
          isOpen={dockedIsland === 'about'}
          onClose={handleUndock}
          onExploreWork={() => handleSelectIsland('work')}
          onNextChapter={() => handleSelectIsland('work')}
        />

        <GalleryDrawer
          isOpen={dockedIsland === 'work'}
          onClose={handleUndock}
          onNextChapter={() => handleSelectIsland('ratuboko')}
        />

        <HeritageArticleDrawer
          isOpen={['ratuboko', 'breksi', 'parangtritis'].includes(dockedIsland)}
          islandId={dockedIsland}
          onClose={handleUndock}
          onNextChapter={(nextId) => {
            if (nextId) handleSelectIsland(nextId);
            else handleUndock();
          }}
        />

        <LibraryDrawer
          isOpen={dockedIsland === 'journal'}
          onClose={handleUndock}
          onNextChapter={() => handleSelectIsland('breksi')}
        />

        <SignalDrawer
          isOpen={dockedIsland === 'contact'}
          onClose={handleUndock}
          onNextChapter={() => handleSelectIsland('about')}
        />

        <ControlsModal
          isOpen={showControls}
          onClose={() => setShowControls(false)}
        />
      </Suspense>
    </div>
  );
}

import { Route, Routes, useLocation } from 'react-router-dom';
import { AppFooter } from './components/AppFooter/AppFooter';
import { CredentialBar } from './components/CredentialBar/CredentialBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastViewport } from './components/Toast/ToastViewport';
import { ChainExplorerPage } from './pages/ChainExplorer';
import { ElectionDetailPage } from './pages/ElectionDetail';
import { HomePage } from './pages/Home';
import { ProposeElectionPage } from './pages/ProposeElection';

function RoutedContent() {
  const location = useLocation();
  // Re-mount the ErrorBoundary on navigation so a crash on one page doesn't
  // stick around when the user navigates elsewhere.
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/elections/new" element={<ProposeElectionPage />} />
        <Route path="/elections/:id" element={<ElectionDetailPage />} />
        <Route path="/chain" element={<ChainExplorerPage />} />
        <Route
          path="*"
          element={
            <div className="empty-state">
              <h3>Page not found</h3>
              <p className="muted">
                The URL you requested does not exist in the dashboard.
              </p>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <div className="app">
      <CredentialBar />
      <main className="app__content">
        <RoutedContent />
      </main>
      <AppFooter />
      <ToastViewport />
    </div>
  );
}

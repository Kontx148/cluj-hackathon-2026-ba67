import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { toast } from './components/Toast/toastStore';
import './styles.css';

// Surface query errors as toasts globally. Individual queries can still opt
// into their own onError handlers; both run.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Polling queries fire on a timer — only toast on the *first* error so we
      // don't spam the operator. The validators panel already shows its own
      // inline banner for the recurring case.
      if (query.state.fetchFailureCount <= 1) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error('Request failed', msg);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

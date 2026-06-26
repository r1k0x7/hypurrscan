import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/queryClient';
import { realtimeEmitter } from '@/lib/websocket';
import { routes } from './routes';

const App: React.FC = () => {
  useEffect(() => {
    realtimeEmitter.start();
    return () => realtimeEmitter.stop();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Router>
          <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
              </Routes>
            </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
    

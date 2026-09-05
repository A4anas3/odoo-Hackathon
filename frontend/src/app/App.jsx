import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './providers/ToastProvider';

export function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;

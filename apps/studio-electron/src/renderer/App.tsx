import React from 'react';
import { ProjectProvider } from './state/ProjectContext';
import { Layout } from './ui/Layout';
import { ToastProvider } from './state/ToastContext';

export default function App() {
  return (
    <React.StrictMode>
      <ToastProvider>
        <ProjectProvider>
          <Layout />
        </ProjectProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}

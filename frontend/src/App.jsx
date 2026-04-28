// Purpose: Contains module logic for this part of the application.
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import AppRoutes from './AppRoutes';

// Main app component - sets up routing and global providers
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Auth Context - manages user login state */}
      <AuthProvider>
        {/* Project Context - manages selected project and project list */}
        <ProjectProvider>
          {/* Routes - main application routing */}
          <AppRoutes />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}



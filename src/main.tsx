import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);

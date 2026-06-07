import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { DarkModeProvider } from "./context/DarkModeContext";
import { HistoryProvider } from "./context/HistoryContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import FeedbackPage from "./pages/FeedbackPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <DarkModeProvider>
      <HistoryProvider>
        <BrowserRouter>
          <div className="min-h-screen font-sans">
            <Navbar />
            <Routes>
              <Route path="/"         element={<HomePage />} />
              <Route path="/result"   element={<ResultPage />} />
              <Route path="/history"  element={<HistoryPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/admin"    element={<AdminPage />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                },
                duration: 3000,
              }}
            />
          </div>
        </BrowserRouter>
      </HistoryProvider>
    </DarkModeProvider>
  );
}

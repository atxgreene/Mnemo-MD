import { useEffect } from "react";
import { useStore } from "./store";
import { completeGeminiOAuthIfPresent } from "./lib/ai/oauth";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import Profile from "./pages/Profile";
import Sources from "./pages/Sources";
import PromptLab from "./pages/PromptLab";
import AnkiFactory from "./pages/AnkiFactory";
import PracticeBuilder from "./pages/PracticeBuilder";
import ImageMode from "./pages/ImageMode";
import VerifiedAnswers from "./pages/VerifiedAnswers";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import WeaknessTracker from "./pages/WeaknessTracker";
import CramPlanner from "./pages/CramPlanner";
import OutputVault from "./pages/OutputVault";
import Settings from "./pages/Settings";

export default function App() {
  const { page, setAI, setPage } = useStore();

  // Complete a Gemini OAuth redirect, if the app was loaded with an auth code.
  useEffect(() => {
    completeGeminiOAuthIfPresent()
      .then((res) => {
        if (res) {
          setAI({
            enabled: true,
            provider: "gemini",
            geminiAuthMode: "oauth",
            geminiAccessToken: res.accessToken,
            geminiTokenExpiry: res.expiresAt,
          });
          setPage("settings");
        }
      })
      .catch(() => {
        /* surfaced in the Connections panel on next attempt */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
          {page === "dashboard" && <Dashboard />}
          {page === "guide" && <Guide />}
          {page === "profile" && <Profile />}
          {page === "sources" && <Sources />}
          {page === "prompt-lab" && <PromptLab />}
          {page === "anki" && <AnkiFactory />}
          {page === "practice" && <PracticeBuilder />}
          {page === "image" && <ImageMode />}
          {page === "verified" && <VerifiedAnswers />}
          {page === "flashcards" && <Flashcards />}
          {page === "quiz" && <Quiz />}
          {page === "weakness" && <WeaknessTracker />}
          {page === "cram" && <CramPlanner />}
          {page === "vault" && <OutputVault />}
          {page === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}

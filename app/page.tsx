"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, Sparkles } from "lucide-react";
import { Questionnaire } from "@/components/Questionnaire";
import { RoadmapTimeline } from "@/components/RoadmapTimeline";
import { createPreviewRoadmap } from "@/lib/preview-roadmap";
import type { RoadmapResponse, StudentProfile } from "@/types/roadmap";

const sessionStorageKey = "opportunity-navigator:session";
const generationStages = [
  "Analyzing your background...",
  "Matching skills to opportunities...",
  "Curating practical next steps...",
  "Generating your personalized roadmap...",
];

type SavedSession = {
  profile: StudentProfile;
  roadmap: RoadmapResponse;
  isPreview: boolean;
};

function readSavedSession(): SavedSession | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(sessionStorageKey) ?? "null");
    if (!value || typeof value !== "object") return null;
    const saved = value as Record<string, unknown>;
    const profile = saved.profile as Record<string, unknown> | null;
    const roadmap = saved.roadmap as Record<string, unknown> | null;
    const profileIsValid = profile
      && ["name", "educationLevel", "location", "goal", "timeline"].every((key) => typeof profile[key] === "string")
      && Array.isArray(profile.domain)
      && profile.domain.length > 0
      && profile.domain.every((domain) => typeof domain === "string");
    const roadmapIsValid = roadmap
      && typeof roadmap.studentSummary === "string"
      && typeof roadmap.targetGoal === "string"
      && typeof roadmap.estimatedCompletionTime === "string"
      && Array.isArray(roadmap.weeklySteps);
    return profileIsValid && roadmapIsValid
      ? { profile: profile as unknown as StudentProfile, roadmap: roadmap as unknown as RoadmapResponse, isPreview: saved.isPreview === true }
      : null;
  } catch {
    return null;
  }
}

function clearSavedSession() {
  try {
    localStorage.removeItem(sessionStorageKey);
  } catch {
    return;
  }
}

function GeneratingRoadmap() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, generationStages.length - 1));
    }, 1500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="generation-state page-enter" aria-labelledby="generation-title" aria-live="polite">
      <div className="generation-heading">
        <span className="generation-icon"><Sparkles size={20} /></span>
        <div><span className="eyebrow">A LITTLE MOMENT, A LOT OF POSSIBILITY</span><h1 id="generation-title">Putting your next steps together.</h1></div>
      </div>
      <p className="generation-stage"><span className="generation-pulse" />{generationStages[stage]}</p>
      <div className="generation-skeleton" aria-hidden="true">
        <div className="skeleton-overview"><span /><span /><span /></div>
        <div className="skeleton-title" />
        {[0, 1, 2, 3].map((item) => <div className="skeleton-step" key={item}><span className="skeleton-number" /><div><span className="skeleton-line long" /><span className="skeleton-line" /></div><span className="skeleton-time" /></div>)}
      </div>
      <p className="generation-footnote">Connecting your interests, experience, and timeline into one practical plan.</p>
    </section>
  );
}

export default function Home() {
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    setSavedSession(readSavedSession());
    setIsSessionReady(true);
  }, []);

  useEffect(() => {
    if (!isSessionReady || !profile || !roadmap) return;
    try {
      localStorage.setItem(sessionStorageKey, JSON.stringify({ profile, roadmap, isPreview }));
    } catch {
      return;
    }
  }, [isPreview, isSessionReady, profile, roadmap]);

  async function generateRoadmap(student: StudentProfile) {
    setSavedSession(null);
    setProfile(student);
    setIsGenerating(true);
    setIsPreview(false);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });

      if (!response.ok) throw new Error("Roadmap generation is unavailable.");
      setRoadmap((await response.json()) as RoadmapResponse);
      setIsPreview(response.headers.get("x-roadmap-preview") === "true");
    } catch {
      setRoadmap(createPreviewRoadmap(student));
      setIsPreview(true);
    } finally {
      setIsGenerating(false);
    }
  }

  function startOver() {
    clearSavedSession();
    setSavedSession(null);
    setProfile(null);
    setRoadmap(null);
    setIsPreview(false);
  }

  function resumeSavedRoadmap() {
    if (!savedSession) return;
    setProfile(savedSession.profile);
    setRoadmap(savedSession.roadmap);
    setIsPreview(savedSession.isPreview);
    setSavedSession(null);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Opportunity Navigator home">
          <span className="brand-mark"><Compass size={19} strokeWidth={2.2} /></span>
          <span>opportunity<span className="brand-light">navigator</span></span>
        </Link>
        <div className="topbar-right">
          <span className="topbar-note"><span className="status-dot" /> Your next move, mapped</span>
          {savedSession && <button className="resume-roadmap-link" type="button" onClick={resumeSavedRoadmap}>Resume saved roadmap <ArrowUpRight size={14} /></button>}
          <a className="topbar-link" href="https://github.com" target="_blank" rel="noreferrer">
            About <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main className="main-content">
        {!isSessionReady ? (
          <div className="session-restoring" role="status"><span className="button-spinner" /> Restoring your roadmap...</div>
        ) : roadmap && profile ? (
          <RoadmapTimeline
            roadmap={roadmap}
            profile={profile}
            isPreview={isPreview}
            onStartOver={startOver}
          />
        ) : isGenerating ? (
          <GeneratingRoadmap />
        ) : (
          <div className="welcome-layout">
            <section className="intro-panel" aria-labelledby="welcome-title">
              <div className="eyebrow"><Sparkles size={14} /> FOR STUDENTS READY TO MAKE A MOVE</div>
              <h1 id="welcome-title">Your next move<br /><span>starts here.</span></h1>
              <p className="intro-copy">Build skills, find real opportunities, and keep your momentum, one week at a time.</p>
              <div className="intro-proof">
                <div className="proof-icon"><span>01</span><span>02</span><span>03</span></div>
                <span>Made for where you are, and where you want to go.</span>
              </div>
              <div className="student-showcase">
                <div className="showcase-photo" role="img" aria-label="Students collaborating on a project around a shared table">
                  <div className="showcase-photo-top"><span><Compass size={14} /> YOUR NEXT CHAPTER</span><span className="showcase-photo-index">01 / 03</span></div>
                  <div className="showcase-caption"><span>LEARN BY DOING</span><strong>Ideas get you started.<br />Action takes you further.</strong></div>
                  <span className="showcase-flag">OPPORTUNITY, IN MOTION <ArrowUpRight size={13} /></span>
                </div>
                <div className="opportunity-strip" aria-label="Your path from skills to opportunities">
                  <span><small>01</small>Build skills</span>
                  <span><small>02</small>Find opportunity</span>
                  <span><small>03</small>Show your work</span>
                </div>
              </div>
            </section>
            <section className="form-panel" aria-label="Personalize your opportunity roadmap">
              <Questionnaire onSubmit={generateRoadmap} isSubmitting={isGenerating} />
            </section>
          </div>
        )}
      </main>

      <footer className="page-footer">
        <span>OPPORTUNITY NAVIGATOR <span className="footer-separator">/</span> BUILT AROUND YOU</span>
        <span>Small steps make a path.</span>
      </footer>
    </div>
  );
}
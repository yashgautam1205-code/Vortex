"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Circle, Clock3, Copy, Download, LayoutList, ListChecks, MapPin, RotateCcw, Sparkles, Trophy } from "lucide-react";
import type { ActionableStep, RoadmapResponse, StudentProfile } from "@/types/roadmap";

type RoadmapTimelineProps = {
  roadmap: RoadmapResponse;
  profile: StudentProfile;
  isPreview: boolean;
  onStartOver: () => void;
};

const categoryClass: Record<ActionableStep["category"], string> = {
  Preparation: "category-preparation",
  "Skill Building": "category-skill",
  Application: "category-application",
  Submission: "category-submission",
};

type ChecklistTask = { id: string; label: string };
type ProgressStep = ActionableStep & { id: string; checkedTaskIds: string[]; progress: number };

function checklistTasks(step: ActionableStep): ChecklistTask[] {
  return [
    { id: "main-action", label: "Complete the main action" },
    ...(step.requiredDocuments ?? []).map((document, index) => ({ id: `document-${index}`, label: `Prepare ${document}` })),
  ];
}

function withCheckedTasks(step: ActionableStep & { id: string }, checkedTaskIds: string[]): ProgressStep {
  const tasks = checklistTasks(step);
  const validTaskIds = new Set(tasks.map((task) => task.id));
  const checked = [...new Set(checkedTaskIds.filter((taskId) => validTaskIds.has(taskId)))];
  const progress = Math.round((checked.length / tasks.length) * 100);

  return {
    ...step,
    checkedTaskIds: checked,
    progress,
    status: progress === 100 ? "completed" : progress > 0 ? "in_progress" : "pending",
  };
}

function StepChecklist({ step, onToggle }: { step: ProgressStep; onToggle: (taskId: string) => void }) {
  const tasks = checklistTasks(step);
  const stepId = step.id.replace(/[^a-zA-Z0-9_-]/g, "-");

  return (
    <div className="step-progress-control">
      <div className="step-progress-heading"><span>STEP PROGRESS</span><output>{step.progress}%</output></div>
      <div className="step-progress-track" role="progressbar" aria-label={`${step.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={step.progress}>
        <span style={{ width: `${step.progress}%` }} />
      </div>
      <div className="step-task-list" role="group" aria-label={`Tasks for ${step.title}`}>
        {tasks.map((task) => {
          const inputId = `task-${stepId}-${task.id}`;
          return (
            <label className="step-task" htmlFor={inputId} key={task.id}>
              <input id={inputId} type="checkbox" checked={step.checkedTaskIds.includes(task.id)} onChange={() => onToggle(task.id)} />
              <span>{task.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function RoadmapTimeline({ roadmap, profile, isPreview, onStartOver }: RoadmapTimelineProps) {
  const [view, setView] = useState<"timeline" | "weekly">("timeline");
  const [steps, setSteps] = useState<ProgressStep[]>(() =>
    roadmap.weeklySteps.map((step, index) => withCheckedTasks({ ...step, id: step.id ?? `step-${index + 1}` }, [])),
  );
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [certificateDate, setCertificateDate] = useState("");
  const roadmapIdentity = [profile.name, profile.location, profile.educationLevel, ...profile.domain, roadmap.targetGoal, ...roadmap.weeklySteps.map((step) => step.title)]
    .map((part) => part.trim().toLowerCase())
    .join("|");
  const storageKey = `opportunity-navigator:step-checklist-v2:${encodeURIComponent(roadmapIdentity)}`;
  const completed = steps.filter((step) => step.status === "completed").length;
  const progress = steps.length ? Math.round(steps.reduce((total, step) => total + step.progress, 0) / steps.length) : 0;
  const roadmapComplete = steps.length > 0 && completed === steps.length;

  useEffect(() => {
    if (!roadmapComplete) {
      setCertificateDate("");
      return;
    }
    setCertificateDate((current) => current || new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date()));
  }, [roadmapComplete]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedSteps: unknown = JSON.parse(saved);
        if (savedSteps && typeof savedSteps === "object") {
          setSteps((current) => current.map((step) => {
            const savedTasks = (savedSteps as Record<string, unknown>)[step.id];
            const checkedTaskIds = Array.isArray(savedTasks)
              ? savedTasks.filter((taskId): taskId is string => typeof taskId === "string")
              : savedTasks && typeof savedTasks === "object" && Array.isArray((savedTasks as Record<string, unknown>).checkedTaskIds)
                ? ((savedTasks as Record<string, unknown>).checkedTaskIds as unknown[]).filter((taskId): taskId is string => typeof taskId === "string")
                : [];
            return withCheckedTasks(step, checkedTaskIds);
          }));
        }
      }
    } catch {
      return;
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    try {
      const checklistByStep = Object.fromEntries(steps.map((step) => [step.id, step.checkedTaskIds]));
      localStorage.setItem(storageKey, JSON.stringify(checklistByStep));
    } catch {
      return;
    }
  }, [loadedStorageKey, steps, storageKey]);

  function toggleTask(stepId: string, taskId: string) {
    setSteps((current) => current.map((step) => {
      if (step.id !== stepId) return step;
      const checkedTaskIds = step.checkedTaskIds.includes(taskId)
        ? step.checkedTaskIds.filter((checkedTaskId) => checkedTaskId !== taskId)
        : [...step.checkedTaskIds, taskId];
      return withCheckedTasks(step, checkedTaskIds);
    }));
  }

  function startOver() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      onStartOver();
      return;
    }
    onStartOver();
  }

  function exportRoadmap() {
    const markdown = [
      `# ${roadmap.targetGoal}`,
      "",
      `**For:** ${profile.name} | ${profile.educationLevel} | ${profile.location}`,
      `**Focus:** ${profile.domain.join(", ")} | **Timeline:** ${roadmap.estimatedCompletionTime}`,
      "",
      "## Overview",
      roadmap.studentSummary,
      "",
      "## Action plan",
      ...steps.flatMap((step) => [
        `### ${step.timeframe}: ${step.title}`,
        `**Category:** ${step.category} | **Status:** ${step.status.replace("_", " ")} | **Progress:** ${step.progress}%`,
        "",
        step.description,
        "",
        "**Step checklist**",
        ...checklistTasks(step).map((task) => `- [${step.checkedTaskIds.includes(task.id) ? "x" : " "}] ${task.label}`),
        ...(step.recommendedResources?.length ? ["", "**Resources**", ...step.recommendedResources.map((resource) => `- [${resource.name}](${resource.url}) (${resource.type})`)] : []),
        "",
      ]),
    ].join("\n");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = roadmap.targetGoal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "opportunity-roadmap";
    link.href = url;
    link.download = `${filename}-roadmap.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(`${roadmap.targetGoal}\n\n${roadmap.studentSummary}`);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2200);
  }

  return (
    <div className="dashboard page-enter">
      <button className="back-to-form" type="button" onClick={startOver}><ArrowLeft size={15} /> Edit your answers</button>
      <section className="roadmap-hero">
        <div className="roadmap-hero-content">
          <div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL ROADMAP</div>
          <h1>{roadmap.targetGoal}<span className="hero-period">.</span></h1>
          <p className="roadmap-summary">{roadmap.studentSummary}</p>
          <div className="profile-chips">
            <span><span className="chip-avatar">{profile.name.slice(0, 1).toUpperCase()}</span>{profile.name}</span>
            <span><MapPin size={14} />{profile.location}</span>
            <span><span className="chip-domain">{profile.domain.join(" · ")}</span></span>
          </div>
        </div>
        <div className="hero-progress" aria-label={`${progress}% complete`}>
          <div className="progress-ring" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
            <div className="progress-ring-inner"><strong>{progress}%</strong><span>DONE</span></div>
          </div>
          <span className="progress-caption">{completed} of {steps.length} done · partial progress counts</span>
        </div>
        <div className="hero-footer">
          <span><Clock3 size={15} /> EST. TIMELINE <strong>{roadmap.estimatedCompletionTime}</strong></span>
          <span className="hero-index">PLAN 01 <span>—</span> {String(steps.length).padStart(2, "0")} ACTIONS</span>
        </div>
      </section>

      {isPreview && <div className="preview-notice"><Sparkles size={15} /><span><strong>Preview roadmap</strong> — add a Gemini API key to generate a plan tailored by AI.</span></div>}
      {roadmapComplete && <section className="completion-reward" aria-live="polite"><span className="reward-icon"><Trophy size={23} /></span><div><span className="reward-kicker">MILESTONE UNLOCKED</span><h2>Roadmap complete</h2><p>You brought every step to 100%. Keep that momentum going.</p></div><span className="reward-seal">100%<small>COMPLETE</small></span></section>}
      {roadmapComplete && (
        <>
          <section className="completion-certificate" aria-label="Roadmap completion certificate">
            <div className="certificate-brand"><span className="certificate-brand-mark"><Trophy size={18} /></span><span>OPPORTUNITY NAVIGATOR</span></div>
            <p className="certificate-eyebrow">CERTIFICATE OF ACHIEVEMENT</p>
            <h2>Roadmap completed</h2>
            <p className="certificate-presented">This is to recognize</p>
            <p className="certificate-name">{profile.name}</p>
            <p className="certificate-description">for completing the personalized roadmap<br />for <strong>{roadmap.targetGoal}</strong>.</p>
            <div className="certificate-details">
              <div><span>AREAS OF FOCUS</span><strong>{profile.domain.join(" · ")}</strong></div>
              <div><span>COMPLETED</span><strong>{certificateDate || "Achievement unlocked"}</strong></div>
            </div>
            <div className="certificate-footer"><span>100% ROADMAP COMPLETE</span><span>{steps.length} STEPS FINISHED</span></div>
          </section>
          <div className="certificate-actions"><button className="export-button" type="button" onClick={() => window.print()}><Download size={15} /> Save certificate as PDF</button><span>Choose “Save as PDF” in the print dialog.</span></div>
        </>
      )}

      <div className="roadmap-toolbar">
        <div className="section-heading"><span className="section-index">01</span><div><h2>Your action plan</h2><p>One focused step at a time.</p></div></div>
        <div className="toolbar-controls">
          <button className="export-button" type="button" onClick={exportRoadmap}><Download size={15} /><span>Export roadmap</span></button>
          <button className="copy-button" type="button" onClick={copySummary} aria-label={copyState === "copied" ? "Summary copied" : "Copy roadmap summary"} title={copyState === "copied" ? "Copied" : "Copy summary"}>
            {copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <div className="view-switch" role="group" aria-label="Roadmap display mode">
            <button type="button" className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")} aria-pressed={view === "timeline"}><LayoutList size={15} /><span>Timeline</span></button>
            <button type="button" className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")} aria-pressed={view === "weekly"}><ListChecks size={15} /><span>Weekly list</span></button>
          </div>
          <button className="reset-button" type="button" onClick={startOver} aria-label="Start a new roadmap" title="Start a new roadmap"><RotateCcw size={16} /></button>
        </div>
      </div>
      {copyState === "failed" && <p className="copy-feedback" role="status">Clipboard access is unavailable in this browser.</p>}
      {copyState === "copied" && <p className="copy-feedback" role="status">Roadmap summary copied.</p>}

      <div className={`steps-list ${view === "weekly" ? "weekly-view" : "timeline-view"}`}>
        {view === "timeline" ? steps.map((step, index) => (
          <article className={`step-card ${step.status === "completed" ? "is-completed" : ""} ${step.status === "in_progress" ? "is-current" : ""}`} style={{ "--step-index": index } as React.CSSProperties} key={step.id}>
            <div className="step-rail">
              <span className={`step-status ${step.status}`} aria-label={`${step.title}: ${step.status.replace("_", " ")}`}>
                {step.status === "completed" ? <Check size={16} /> : step.status === "in_progress" ? <span className="status-current-dot" /> : <Circle size={17} />}
              </span>
              {index < steps.length - 1 && <span className="rail-line" />}
            </div>
            <div className="step-main">
              <div className="step-meta"><span className="time-badge">{step.timeframe}</span><span className={`category-tag ${categoryClass[step.category]}`}>{step.category}</span>{step.status === "in_progress" && <span className="working-label">IN PROGRESS</span>}</div>
              <div className="step-card-body">
                <div className="step-copy"><h3>{step.title}</h3><p>{step.description}</p></div>
                <div className="step-actions">
                  <StepChecklist step={step} onToggle={(taskId) => toggleTask(step.id, taskId)} />
                  {step.recommendedResources && step.recommendedResources.length > 0 && <div className="detail-block resource-block"><h4><ArrowUpRight size={14} /> USEFUL RESOURCES</h4><div className="resource-list">{step.recommendedResources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer"><span>{resource.name}<ArrowUpRight size={12} /></span><small>{resource.type}</small></a>)}</div></div>}
                </div>
              </div>
            </div>
          </article>
        )) : (
          <div className="weekly-action-list">
            {steps.map((step, index) => (
              <article className={`weekly-task ${step.status === "completed" ? "is-completed" : ""}`} style={{ "--step-index": index } as React.CSSProperties} key={step.id}>
                <span className={`weekly-check ${step.status === "completed" ? "done" : ""}`} aria-label={`${step.title}: ${step.status.replace("_", " ")}`}>
                  {step.status === "completed" ? <Check size={15} /> : <Circle size={17} />}
                </span>
                <div className="weekly-task-copy">
                  <div className="step-meta"><span className="time-badge">{step.timeframe}</span><span className={`category-tag ${categoryClass[step.category]}`}>{step.category}</span>{step.status === "in_progress" && <span className="working-label">IN PROGRESS</span>}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <div className="weekly-task-details">
                    <StepChecklist step={step} onToggle={(taskId) => toggleTask(step.id, taskId)} />
                    {step.recommendedResources && step.recommendedResources.length > 0 && <div className="weekly-resources"><strong><ArrowUpRight size={13} /> RESOURCES</strong>{step.recommendedResources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.name}<ArrowUpRight size={11} /></a>)}</div>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-endnote"><span className="endnote-star">✳</span><p>You don&apos;t have to do it all today.<br /><strong>Just take the next step.</strong></p><button type="button" onClick={onStartOver}>Build another roadmap <ArrowUpRight size={14} /></button></div>
    </div>
  );
}
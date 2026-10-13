"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, Sparkles } from "lucide-react";
import type { EducationLevel, OpportunityDomain, StudentProfile } from "@/types/roadmap";

const educationLevels: EducationLevel[] = [
  "High School",
  "Undergrad 1st year",
  "Undergrad 2nd year",
  "Undergrad 3rd year",
  "Undergrad 4th year",
  "Graduate student",
];

const domains: { name: OpportunityDomain; mark: string }[] = [
  { name: "AI / Machine Learning", mark: "✦" },
  { name: "Web Development", mark: "</>" },
  { name: "Data Science", mark: "∑" },
  { name: "Design", mark: "✳" },
  { name: "Business", mark: "↗" },
  { name: "Cybersecurity", mark: "⌘" },
  { name: "Product Management", mark: "◈" },
];

const goals = [
  "Find an internship",
  "Win a hackathon",
  "Build portfolio projects",
  "Apply for a scholarship",
  "Explore career options",
  "Other goal",
];

const timelines = ["1 month", "3 months", "6 months", "This academic year"];

type QuestionnaireProps = {
  onSubmit: (profile: StudentProfile) => void;
  isSubmitting: boolean;
};

export function Questionnaire({ onSubmit, isSubmitting }: QuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">("");
  const [location, setLocation] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<OpportunityDomain[]>([]);
  const [goal, setGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [timeline, setTimeline] = useState("");

  const canContinue = step === 1
    ? Boolean(name.trim() && educationLevel && location.trim())
    : step === 2
      ? selectedDomains.length > 0
      : Boolean((goal && (goal !== "Other goal" || customGoal.trim())) && timeline);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue || isSubmitting) return;
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    onSubmit({
      name: name.trim(),
      educationLevel: educationLevel as EducationLevel,
      location: location.trim(),
      domain: selectedDomains,
      goal: goal === "Other goal" ? customGoal.trim() : goal,
      timeline,
    });
  }

  return (
    <div className="questionnaire">
      <div className="form-topline">
        <span>YOUR ROADMAP STARTS HERE</span>
        <span>0{step} <span className="muted">/ 03</span></span>
      </div>
      <div className="progress-track" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((item) => <span key={item} className={item <= step ? "progress-segment active" : "progress-segment"} />)}
      </div>

      <form onSubmit={submit}>
        <div className="step-content" key={step}>
          {step === 1 && (
            <>
              <span className="step-kicker">FIRST, THE BASICS</span>
              <h2>Let&apos;s start with you.</h2>
              <p className="step-description">A little context helps us make this plan feel like yours.</p>
              <label className="field-label" htmlFor="student-name">What should we call you?</label>
              <input id="student-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your first name" autoComplete="given-name" required />
              <label className="field-label" htmlFor="education">Where are you in your studies?</label>
              <select id="education" className="select-input" value={educationLevel} onChange={(event) => setEducationLevel(event.target.value as EducationLevel)} required>
                <option value="" disabled>Select your education level</option>
                {educationLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <label className="field-label" htmlFor="location">Where are you based?</label>
              <div className="input-with-icon"><MapPin size={16} /><input id="location" className="text-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country" autoComplete="address-level2" required /></div>
            </>
          )}

          {step === 2 && (
            <>
              <span className="step-kicker">FOLLOW YOUR CURIOSITY</span>
              <h2>What are you into?</h2>
              <p className="step-description">Pick one or more areas you want your next opportunity to grow from.</p>
              <div className="choice-grid" role="group" aria-label="Choose one or more areas of interest">
                {domains.map((item) => (
                  <button key={item.name} className={`domain-choice ${selectedDomains.includes(item.name) ? "selected" : ""}`} type="button" aria-pressed={selectedDomains.includes(item.name)} onClick={() => setSelectedDomains((current) => current.includes(item.name) ? current.filter((domain) => domain !== item.name) : [...current, item.name])}>
                    <span className="domain-mark">{item.mark}</span><span>{item.name}</span>{selectedDomains.includes(item.name) && <Check size={15} className="choice-check" />}
                  </button>
                ))}
              </div>
              <div className={`selection-note ${selectedDomains.length ? "has-selection" : ""}`}><Sparkles size={15} /><span>{selectedDomains.length ? `${selectedDomains.length} area${selectedDomains.length === 1 ? "" : "s"} selected. We’ll connect them to skills and real opportunities.` : "Choose at least one area. You can select several."}</span></div>
            </>
          )}

          {step === 3 && (
            <>
              <span className="step-kicker">MAKE IT ACTIONABLE</span>
              <h2>What&apos;s your next move?</h2>
              <p className="step-description">Choose a goal and a timeframe. You can adjust your plan later.</p>
              <span className="field-label">I want to...</span>
              <div className="goal-grid">
                {goals.map((item) => <button key={item} type="button" className={`goal-choice ${goal === item ? "selected" : ""}`} onClick={() => setGoal(item)}>{item}{goal === item && <Check size={14} />}</button>)}
              </div>
              {goal === "Other goal" && <input className="text-input custom-goal" value={customGoal} onChange={(event) => setCustomGoal(event.target.value)} placeholder="Describe your goal" aria-label="Describe your goal" required />}
              <span className="field-label timeline-label">In what timeframe?</span>
              <div className="timeline-options" role="radiogroup" aria-label="Choose a timeframe">
                {timelines.map((item) => <button key={item} type="button" role="radio" aria-checked={timeline === item} className={timeline === item ? "selected" : ""} onClick={() => setTimeline(item)}>{item}</button>)}
              </div>
            </>
          )}
        </div>

        {!canContinue && !isSubmitting && (
          <p className="validation-hint" id="questionnaire-validation" role="status">
            {step === 1
              ? "Add your name, education level, and location to continue."
              : step === 2
                ? "Choose an area of interest to continue."
                : goal === "Other goal" && !customGoal.trim()
                    ? "Describe your goal to build your roadmap."
                    : !goal
                      ? "Choose a goal to build your roadmap."
                      : !timeline
                        ? "Choose a timeframe to build your roadmap."
                        : "Complete the required fields to build your roadmap."}
          </p>
        )}
        <div className="form-actions">
          {step > 1 ? <button className="back-button" type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button> : <span />}
          <button className="primary-button" type="submit" disabled={isSubmitting} aria-describedby={!canContinue ? "questionnaire-validation" : undefined}>
            {isSubmitting ? <><span className="button-spinner" /> Building your plan</> : step === 3 ? <>Build my roadmap <Sparkles size={16} /></> : <>Continue <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
      <p className="privacy-note"><span className="privacy-dot" /> Your answers are only used to build your roadmap.</p>
    </div>
  );
}
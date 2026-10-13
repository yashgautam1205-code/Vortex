import type { ActionableStep, RoadmapResponse, StudentProfile } from "@/types/roadmap";

export function createPreviewRoadmap(profile: StudentProfile): RoadmapResponse {
  const domainList = profile.domain.join(", ");
  const domain = domainList.toLowerCase();
  const resources = [
    {
      name: `Explore ${domainList} projects`,
      url: "https://github.com/topics/good-first-issue",
      type: "Tool" as const,
    },
    {
      name: "Build your learning plan",
      url: "https://roadmap.sh/",
      type: "Guide" as const,
    },
  ];

  const weeklySteps: ActionableStep[] = [
    {
      id: "starting-point",
      title: "Get clear on your starting point",
      timeframe: "Week 1",
      category: "Preparation",
      description: `Set aside 30 minutes to list your strongest skills, recent projects, and what you want from a ${domain} opportunity. Use that inventory to choose one role or event to work toward.`,
      requiredDocuments: ["Skills inventory", "A specific target opportunity"],
      recommendedResources: [resources[1]],
      status: "in_progress",
    },
    {
      id: "skill-project",
      title: "Make one focused skill-building project",
      timeframe: "Week 2–3",
      category: "Skill Building",
      description: `Choose a small project that demonstrates one ${domainList} skill relevant to your goal: ${profile.goal}. Keep the scope narrow enough to finish and document your decisions as you go.`,
      requiredDocuments: ["Project brief", "GitHub or portfolio link"],
      recommendedResources: resources,
      status: "pending",
    },
    {
      id: "application-materials",
      title: "Prepare your opportunity materials",
      timeframe: "Week 4",
      category: "Preparation",
      description: `Turn your project and experience into a concise application package. Tailor your resume and short introduction to opportunities available to ${profile.educationLevel.toLowerCase()} students in ${profile.location}.`,
      requiredDocuments: ["One-page resume", "Short personal introduction", "Project link"],
      recommendedResources: [
        {
          name: "Resume and interview practice",
          url: "https://www.careercup.com/resume",
          type: "Guide",
        },
      ],
      status: "pending",
    },
    {
      id: "apply-and-follow-up",
      title: "Apply, submit, and follow up",
      timeframe: profile.timeline,
      category: "Application",
      description: "Find two relevant openings or events, check each eligibility and deadline, then send a tailored application. Track the submission date and follow up after one week where appropriate.",
      requiredDocuments: ["Tailored resume", "Portfolio or project link", "Application tracker"],
      recommendedResources: [
        {
          name: "Find student opportunities",
          url: "https://www.linkedin.com/jobs/",
          type: "Tool",
        },
      ],
      status: "pending",
    },
  ];

  return {
    studentSummary: `${profile.name}, your ${profile.educationLevel.toLowerCase()} background and interests in ${domainList} give you a solid starting point. This plan turns “${profile.goal}” into manageable weekly actions based around ${profile.location}.`,
    targetGoal: profile.goal,
    estimatedCompletionTime: profile.timeline,
    weeklySteps,
  };
}
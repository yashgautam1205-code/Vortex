export type EducationLevel =
  | "High School"
  | "Undergrad 1st year"
  | "Undergrad 2nd year"
  | "Undergrad 3rd year"
  | "Undergrad 4th year"
  | "Graduate student";

export type OpportunityDomain =
  | "AI / Machine Learning"
  | "Web Development"
  | "Data Science"
  | "Design"
  | "Business"
  | "Cybersecurity"
  | "Product Management";

export interface ActionableStep {
  id?: string;
  title: string;
  timeframe: string;
  category: "Preparation" | "Skill Building" | "Application" | "Submission";
  description: string;
  requiredDocuments?: string[];
  recommendedResources?: {
    name: string;
    url: string;
    type: "Free Course" | "Tool" | "Guide";
  }[];
  status: "pending" | "in_progress" | "completed";
}

export interface RoadmapResponse {
  studentSummary: string;
  targetGoal: string;
  estimatedCompletionTime: string;
  weeklySteps: ActionableStep[];
}

export type StudentProfile = {
  name: string;
  educationLevel: EducationLevel;
  location: string;
  domain: OpportunityDomain[];
  goal: string;
  timeline: string;
};
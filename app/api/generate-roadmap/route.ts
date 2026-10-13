import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { createPreviewRoadmap } from "@/lib/preview-roadmap";
import type { OpportunityDomain, RoadmapResponse, StudentProfile } from "@/types/roadmap";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    studentSummary: { type: Type.STRING },
    targetGoal: { type: Type.STRING },
    estimatedCompletionTime: { type: Type.STRING },
    weeklySteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Preparation", "Skill Building", "Application", "Submission"] },
          description: { type: Type.STRING },
          requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedResources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["Free Course", "Tool", "Guide"] },
              },
              required: ["name", "url", "type"],
            },
          },
          status: { type: Type.STRING, enum: ["pending", "in_progress", "completed"] },
        },
        required: ["title", "timeframe", "category", "description", "status"],
      },
    },
  },
  required: ["studentSummary", "targetGoal", "estimatedCompletionTime", "weeklySteps"],
};

const opportunityDomains: OpportunityDomain[] = [
  "AI / Machine Learning",
  "Web Development",
  "Data Science",
  "Design",
  "Business",
  "Cybersecurity",
  "Product Management",
];

function isStudentProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  const hasRequiredText = ["name", "educationLevel", "location", "goal", "timeline"]
    .every((key) => typeof profile[key] === "string" && profile[key].trim().length > 0);
  const hasValidDomains = Array.isArray(profile.domain)
    && profile.domain.length > 0
    && profile.domain.every((domain) => typeof domain === "string" && opportunityDomains.includes(domain as OpportunityDomain));
  return hasRequiredText && hasValidDomains;
}

export async function POST(request: Request) {
  let profile: unknown;
  try {
    profile = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isStudentProfile(profile)) {
    return NextResponse.json({ error: "Please provide all required student details." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) return previewResponse(profile);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a practical opportunity roadmap for this student. Connect skill-building to real, attainable actions such as finding hackathons, internships, scholarships, or courses where relevant. Respect their location and education level; do not invent exact deadlines or eligibility. Make 5-7 sequenced steps with actionable weekly timeframes, document checklists, and reputable free resources with valid URLs. Set the first step to in_progress and the rest to pending.\n\nStudent profile:\n${JSON.stringify(profile)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: "You are an empathetic student opportunity advisor. Return only data matching the provided schema. Keep tasks specific and achievable. Prefer trustworthy, publicly accessible resources. Include concise, personalized descriptions.",
        temperature: 0.4,
      },
    });

    if (!result.text) throw new Error("Gemini returned an empty response.");
    const roadmap = JSON.parse(result.text) as RoadmapResponse;
    if (!roadmap.weeklySteps?.length) throw new Error("Gemini returned no roadmap steps.");
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Roadmap generation failed:", error);
    return previewResponse(profile);
  }
}

function previewResponse(profile: StudentProfile) {
  return NextResponse.json(createPreviewRoadmap(profile), {
    status: 200,
    headers: { "x-roadmap-preview": "true" },
  });
}
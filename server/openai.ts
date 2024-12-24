import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI;

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set");
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error("Failed to initialize OpenAI:", error);
}

export interface HealthProfileWithBMI {
  birthdate: string;
  sex: "male" | "female";
  heightFeet: number;
  heightInches: number;
  weightPounds: number;
  medicalConditions?: string[];
  medications?: string[];
  bmi: number;
  bmiCategory: string;
}

export interface LabAnalysis {
  date: string;
  bmi: {
    score: number;
    category: string;
    trend?: {
      change: number;
      interpretation: string;
    };
  };
  analysis: Array<{
    testName: string;
    purpose: string;
    result: string;
    interpretation: string;
    normalRange?: string;
    unit?: string;
    severity?: "normal" | "moderate" | "severe";
    trend?: {
      change: number;
      interpretation: string;
      recommendation?: string;
    };
    historicalData?: Array<{
      date: string;
      value: number;
    }>;
  }>;
  questions: string[];
  recommendations: string[];
  summary: {
    overview: string;
    significantChanges: string[];
    actionItems: string[];
  };
}

export async function analyzePDFText(text: string, healthProfile: HealthProfileWithBMI, previousResults?: LabAnalysis[]): Promise<LabAnalysis> {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. Please check your API key.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert medical data analyst specializing in laboratory result interpretation.
          Your task is to:
          1. Analyze lab results comprehensively
          2. Compare with historical data to identify trends
          3. Provide detailed interpretations and actionable recommendations
          4. Highlight significant changes and areas of concern
          5. Categorize severity levels for each test result
          6. Generate specific questions for healthcare providers
          7. Consider the patient's medical conditions and medications when analyzing`
        },
        {
          role: "user",
          content: `Analyze these laboratory results with historical context:

Health Profile:
${JSON.stringify(healthProfile, null, 2)}

${previousResults ? `Previous Results:
${JSON.stringify(previousResults, null, 2)}` : ''}

Current Lab Results:
${text}

Return a JSON object with exactly this structure:
{
  "date": "YYYY-MM-DD",
  "bmi": {
    "score": number,
    "category": string,
    "trend": {
      "change": number,
      "interpretation": string
    }
  },
  "analysis": [
    {
      "testName": string,
      "purpose": string,
      "result": string,
      "interpretation": string,
      "normalRange": string,
      "unit": string,
      "severity": "normal" | "moderate" | "severe",
      "trend": {
        "change": number,
        "interpretation": string,
        "recommendation": string
      },
      "historicalData": [
        {
          "date": string,
          "value": number
        }
      ]
    }
  ],
  "questions": string[],
  "recommendations": string[],
  "summary": {
    "overview": string,
    "significantChanges": string[],
    "actionItems": string[]
  }
}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("No response content from OpenAI");
    }

    let analysis: LabAnalysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);

      // Validate the structure
      if (!analysis.date || !analysis.analysis || !Array.isArray(analysis.analysis) || !analysis.questions || !Array.isArray(analysis.questions)) {
        throw new Error("Invalid response structure from OpenAI");
      }

      // Ensure BMI data is present
      analysis.bmi = {
        score: healthProfile.bmi,
        category: healthProfile.bmiCategory,
        trend: analysis.bmi?.trend
      };

      return analysis;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", response.choices[0].message.content);
      throw new Error("Invalid JSON response from OpenAI");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze lab results: ${error.message}`);
    }
    throw new Error("Failed to analyze lab results: Unknown error");
  }
}

export function calculateBMI(weightPounds: number, heightFeet: number, heightInches: number): number {
  const heightInchesTotal = (heightFeet * 12) + heightInches;
  const bmi = (weightPounds / (heightInchesTotal * heightInchesTotal)) * 703;
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}
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
  };
  analysis: Array<{
    testName: string;
    purpose: string;
    result: string;
    interpretation: string;
  }>;
  questions: string[];
}

export async function analyzePDFText(text: string, healthProfile: HealthProfileWithBMI): Promise<LabAnalysis> {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. Please check your API key.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a medical data analyst specializing in laboratory result interpretation. Provide analysis in a clear, structured format."
        },
        {
          role: "user",
          content: `Analyze these laboratory results and health profile data:
          
Health Profile:
${JSON.stringify(healthProfile, null, 2)}

Lab Results:
${text}

Provide a detailed analysis in JSON format with:
1. Current date
2. BMI calculation and category (use the provided BMI)
3. Analysis of each test (name, purpose, result, interpretation)
4. Relevant questions for medical professionals based on results and health profile`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("No response content from OpenAI");
    }

    const analysis: LabAnalysis = JSON.parse(response.choices[0].message.content);
    return {
      ...analysis,
      bmi: {
        score: healthProfile.bmi,
        category: healthProfile.bmiCategory
      }
    };
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

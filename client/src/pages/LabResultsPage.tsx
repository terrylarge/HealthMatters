import { useHealthProfile } from "@/hooks/use-health-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export default function LabResultsPage() {
  const { profile, isLoading, uploadLabResults, isUploading, labResults } = useHealthProfile();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLabResults(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please complete your health profile first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Lab Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="pdf">PDF File</Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            {isUploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Uploading and analyzing...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {labResults.map((result) => (
        <Card key={result.id}>
          <CardHeader>
            <CardTitle>
              Analysis Results - {new Date(result.uploadedAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.analysis && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">BMI Analysis</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer>
                      <LineChart
                        data={[
                          { bmi: 16, label: "Underweight" },
                          { bmi: 18.5, label: "Normal" },
                          { bmi: 25, label: "Overweight" },
                          { bmi: 30, label: "Obese" },
                        ]}
                      >
                        <XAxis dataKey="label" />
                        <YAxis domain={[15, 35]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bmi" stroke="#8884d8" />
                        <ReferenceLine
                          y={result.analysis.bmi.score}
                          stroke="red"
                          label={`Your BMI: ${result.analysis.bmi.score.toFixed(
                            1
                          )}`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Test Analysis</h3>
                  <div className="space-y-4">
                    {result.analysis.analysis.map((test, index) => (
                      <div key={index} className="border p-4 rounded-lg">
                        <h4 className="font-semibold">{test.testName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {test.purpose}
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Result:</span>{" "}
                          {test.result}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">Interpretation:</span>{" "}
                          {test.interpretation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Questions for Your Medical Team
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {result.analysis.questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="font-medium mb-2">Medical Disclaimer</p>
                  <p>
                    This analysis is provided for informational purposes only and
                    should not be considered medical advice. Please consult with
                    your healthcare providers regarding your specific medical
                    condition and treatment options. Your healthcare providers
                    should be your primary source of medical information and
                    advice.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { useHealthProfile } from "@/hooks/use-health-profile";
import type { LabResult } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// Define styles for PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 20,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  testResult: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  disclaimer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f3f4f6',
  },
  bmiGraph: {
    marginVertical: 15,
    height: 100,
    position: 'relative',
  },
  bmiBar: {
    height: 20,
    marginVertical: 10,
    flexDirection: 'row',
  },
  bmiSegment: {
    height: '100%',
  },
  bmiMarker: {
    width: 2,
    height: 30,
    backgroundColor: '#ef4444',
    position: 'absolute',
  },
  bmiLabel: {
    fontSize: 10,
    color: '#6b7280',
    position: 'absolute',
    top: 35,
  },
  bmiRange: {
    fontSize: 8,
    color: '#9ca3af',
    position: 'absolute',
    top: -15,
  },
});

// PDF Document Component
const BMIVisualization = ({ bmi }: { bmi: { score: number; category: string } }) => {
  const totalWidth = 500;
  const minBMI = 10;
  const maxBMI = 45;
  const ranges = [
    { min: minBMI, max: 30, color: '#ffffff', label: 'Under 30' },
    { min: 30, max: maxBMI, color: '#ef4444', label: 'Obese (30+)' },
  ];

  // Calculate width for each range based on their BMI span
  ranges.forEach(range => {
    const span = range.max - range.min;
    const totalSpan = maxBMI - minBMI;
    range.width = `${(span / totalSpan) * 100}%`;
  });

  // Calculate marker position (as percentage of total width)
  const markerPosition = Math.min(Math.max((bmi.score - minBMI) / (maxBMI - minBMI), 0), 1) * totalWidth;

  return (
    <View style={styles.bmiGraph}>
      <View style={styles.bmiBar}>
        {ranges.map((range, index) => (
          <View
            key={index}
            style={[
              styles.bmiSegment,
              { backgroundColor: range.color, width: range.width }
            ]}
          />
        ))}
      </View>
      
      {/* BMI Scale Labels */}
      {[15, 18.5, 25, 30, 35].map((value, index) => {
        const position = ((value - 15) / (35 - 15)) * totalWidth;
        return (
          <Text
            key={index}
            style={[styles.bmiLabel, { left: position - 10 }]}
          >
            {value}
          </Text>
        );
      })}

      {/* Category Labels */}
      {ranges.map((range, index) => {
        const prevRangesWidth = ranges
          .slice(0, index)
          .reduce((acc, r) => acc + parseFloat(r.width), 0);
        return (
          <Text
            key={index}
            style={[
              styles.bmiRange,
              { left: (prevRangesWidth * totalWidth) / 100 + (parseFloat(range.width) * totalWidth) / 200 - 20 }
            ]}
          >
            {range.label}
          </Text>
        );
      })}

      {/* BMI Marker */}
      <View style={[styles.bmiMarker, { left: markerPosition - 1 }]} />
    </View>
  );
};

const AnalysisPDF = ({ result }: { result: LabResult }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>
          Analysis Results - {new Date(result.uploadedAt).toLocaleDateString()}
        </Text>

        {result.analysis && (
          <>
            <View style={styles.section}>
              <Text style={styles.heading}>BMI Analysis</Text>
              <Text style={styles.text}>
                Your BMI: {result.analysis.bmi.score.toFixed(1)} ({result.analysis.bmi.category})
              </Text>
              <BMIVisualization bmi={result.analysis.bmi} />
            </View>

            {result.analysis.analysis && (
              <View style={styles.section}>
                <Text style={styles.heading}>Test Analysis</Text>
                {result.analysis.analysis.map((test, index) => (
                  <View key={index} style={styles.testResult}>
                    <Text style={styles.text}>{test.testName}</Text>
                    <Text style={styles.text}>Purpose: {test.purpose}</Text>
                    <Text style={styles.text}>Result: {test.result}</Text>
                    <Text style={styles.text}>Interpretation: {test.interpretation}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.analysis.questions && (
              <View style={styles.section}>
                <Text style={styles.heading}>Questions for Your Medical Team</Text>
                {result.analysis.questions.map((question, index) => (
                  <Text key={index} style={styles.text}>
                    • {question}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.disclaimer}>
              <Text style={styles.heading}>Medical Disclaimer</Text>
              <Text style={styles.text}>
                This analysis is provided for informational purposes only and should not be considered medical advice. Please consult with your healthcare providers regarding your specific medical condition and treatment options. Your healthcare providers should be your primary source of medical information and advice.
              </Text>
            </View>
          </>
        )}
      </View>
    </Page>
  </Document>
);

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

      {labResults.map((result: LabResult) => (
        <Card key={result.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Analysis Results - {new Date(result.uploadedAt).toLocaleDateString()}
            </CardTitle>
            <PDFDownloadLink
              document={<AnalysisPDF result={result} />}
              fileName={`lab-analysis-${new Date(result.uploadedAt).toISOString().split('T')[0]}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Preparing..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </CardHeader>
          <CardContent>
            {result.analysis && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">BMI Analysis</h3>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer>
                      <LineChart
                        data={[
                          { bmi: 16, category: "Underweight", range: "<18.5" },
                          { bmi: 18.5, category: "Normal", range: "18.5-24.9" },
                          { bmi: 25, category: "Overweight", range: "25-29.9" },
                          { bmi: 30, category: "Obese", range: "≥30" },
                        ]}
                        margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                      >
                        <XAxis
                          type="number"
                          domain={[15, 35]}
                          ticks={[17, 21.7, 27.5, 32.5]}
                          tickFormatter={(value) => {
                            const categories = {
                              17: "Underweight",
                              21.7: "Normal",
                              27.5: "Overweight",
                              32.5: "Obese"
                            };
                            return categories[value] || value.toString();
                          }}
                          tick={{ 
                            dy: 10,
                            fontSize: 11,
                            fill: "rgb(100, 116, 139)"
                          }}
                          interval={0}
                          height={30}
                        />
                        <YAxis 
                          hide={true}
                          domain={[0, 1]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border p-2 rounded-lg shadow-lg">
                                  <p className="font-medium">{data.category}</p>
                                  <p className="text-sm text-muted-foreground">
                                    BMI Range: {data.range}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {result.analysis.bmi && (
                          <ReferenceLine
                            x={result.analysis.bmi.score}
                            stroke="red"
                            label={{
                              value: `Your BMI: ${result.analysis.bmi.score.toFixed(1)}`,
                              position: 'top',
                            }}
                          />
                        )}
                        <ReferenceLine x={18.5} stroke="#888" strokeDasharray="3 3" />
                        <ReferenceLine x={25} stroke="#888" strokeDasharray="3 3" />
                        <ReferenceLine x={30} stroke="#888" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {result.analysis.analysis && result.analysis.analysis.length > 0 && (
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
                )}

                {result.analysis.questions && result.analysis.questions.length > 0 && (
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
                )}

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

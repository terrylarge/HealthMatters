import { useEffect, useState } from "react";
import { useHealthProfile } from "@/hooks/use-health-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, AlertCircle } from "lucide-react";

export function HealthTipsSidebar() {
  const { profile, isLoading } = useHealthProfile();
  const [tips, setTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  useEffect(() => {
    const fetchHealthTips = async () => {
      if (!profile) return;
      
      setIsLoadingTips(true);
      try {
        const response = await fetch('/api/health-tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch health tips');
        }

        const data = await response.json();
        setTips(data.tips);
      } catch (error) {
        console.error('Error fetching health tips:', error);
        setTips([
          "Maintain a balanced diet rich in fruits and vegetables",
          "Stay hydrated by drinking plenty of water throughout the day",
          "Get regular exercise - aim for at least 30 minutes daily",
          "Ensure you get 7-9 hours of quality sleep each night",
        ]);
      } finally {
        setIsLoadingTips(false);
      }
    };

    fetchHealthTips();
  }, [profile]);

  if (isLoading) {
    return (
      <Card className="w-full lg:w-80">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full lg:w-80">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Complete your health profile to see personalized tips</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Health Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingTips ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="space-y-4">
            {tips.map((tip, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function calculateBMI(weightPounds: number, heightFeet: number, heightInches: number): number {
  // Convert height to total inches
  const totalHeightInches = (heightFeet * 12) + heightInches;
  
  // BMI formula: (weight in pounds * 703) / (height in inches)²
  const bmi = (weightPounds * 703) / (totalHeightInches * totalHeightInches);
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

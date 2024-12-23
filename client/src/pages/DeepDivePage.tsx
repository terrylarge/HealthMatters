import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, HeartPulse, User } from "lucide-react";

export default function DeepDivePage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Deep Dive Into</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Security and Privacy</h2>
                <p className="text-muted-foreground">
                  At Health Matters at Large, your privacy and data security are our top priorities. 
                  We implement industry-standard encryption and security measures to protect your sensitive 
                  health information. Your data is stored securely and is only accessible to you and the 
                  healthcare providers you authorize.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HeartPulse className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Your Healthcare Team</h2>
                <p className="text-muted-foreground">
                  While Health Matters at Large provides valuable insights and analysis of your health data, 
                  we emphasize the importance of working closely with your healthcare team. Our platform is 
                  designed to complement, not replace, professional medical advice. Always consult with your 
                  healthcare providers about your test results, medications, and health decisions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">About the Developer</h2>
                <p className="text-muted-foreground">
                  Hi, I'm Terry Large, the developer behind Health Matters at Large. With a background in 
                  healthcare technology and a passion for making health information more accessible, I created 
                  this platform to help people better understand and manage their health data. This project 
                  combines my technical expertise with a commitment to improving healthcare accessibility and 
                  understanding.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button asChild>
              <Link href="/">Return to Health Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

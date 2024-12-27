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
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-md">
            <Shield className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Security and Privacy</h2>
                <p className="text-muted-foreground">
                  At Health Matters at Large, your privacy and data security are our top priorities. 
                  We implement industry-standard encryption and security measures to protect your sensitive 
                  health information. Your data is stored securely and is only accessible to you and the 
                  healthcare providers you authorize. The only thing we know about you is your email address, 
                  which we will use to help you change your password and to send you important updates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-md">
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

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-md">
              <User className="h-6 w-6 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">About the Developer</h2>
                <p className="text-muted-foreground">
                  <img 
                    src="./images/terry.jpeg" 
                    alt="Developer" 
                    className="w-32 h-auto float-left mr-4 mb-2 rounded-md shadow"
                  />
                  Hi, I'm Terry Large, the developer behind Health Matters at Large.  I created 
                  this platform to help people like you gain insights in their health and offer questions to 
                  their medical team. Questions based on your health profile and lab results. I know from first hand experience the importance of early dectection. 
                  For me it was both early detection of my bladder cancer and getting quaility treatment which 
                  led to the my full remission.  
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

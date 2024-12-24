import { Switch, Route, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HealthProfilePage from "./pages/HealthProfilePage";
import LabResultsPage from "./pages/LabResultsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DeepDivePage from "./pages/DeepDivePage";
import { useUser } from "./hooks/use-user";
import { Button } from "./components/ui/button";

function App() {
  const { user, isLoading, logout } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Handle reset password page and Gmail redirects before authentication check
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Handle reset password URLs
  if (currentPath === '/reset-password') {
    console.log('Rendering reset password page with token:', searchParams.get('token'));
    return <ResetPasswordPage />;
  }

  // Protected routes require authentication
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen relative z-10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/deep-dive">Deep Dive</Link>
            </Button>
          </nav>
          <h1 className="text-2xl font-bold text-primary absolute left-1/2 transform -translate-x-1/2">
            Health Matters at Large
          </h1>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <Switch>
          <Route path="/" component={HealthProfilePage} />
          <Route path="/lab-results" component={LabResultsPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/deep-dive" component={DeepDivePage} />
          <Route>
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4 gap-2">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Return to your <Link href="/" className="text-primary hover:underline">health profile</Link>.
                </p>
              </CardContent>
            </Card>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;
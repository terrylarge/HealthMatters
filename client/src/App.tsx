import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HealthProfilePage from "./pages/HealthProfilePage";
import LabResultsPage from "./pages/LabResultsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Handle reset password page before any other routes
  const currentPath = window.location.pathname;
  if (currentPath === '/url') {
    // Handle Gmail redirect
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('q');
    if (redirectUrl && redirectUrl.includes('/reset-password')) {
      return <ResetPasswordPage />;
    }
  } else if (currentPath.startsWith('/reset-password')) {
    // Handle direct reset password URL
    return <ResetPasswordPage />;
  }

  // Protected routes require authentication
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Health Matters at Large</h1>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HealthProfilePage} />
          <Route path="/lab-results" component={LabResultsPage} />
          <Route>
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4 gap-2">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Return to your <a href="/" className="text-primary hover:underline">health profile</a>.
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
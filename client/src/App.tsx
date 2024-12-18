import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HealthProfilePage from "./pages/HealthProfilePage";
import LabResultsPage from "./pages/LabResultsPage";
import DeepDivePage from "./pages/DeepDivePage";
import { useUser } from "./hooks/use-user";
import { Button } from "./components/ui/button";
import { useLocation } from "wouter";

function App() {
  const { user, isLoading, logout } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Health Matters at Large</h1>
          <nav className="flex items-center gap-4">
            <Button
              variant={location === "/" ? "secondary" : "ghost"}
              onClick={() => location !== "/" && window.location.assign("/")}
            >
              Health Profile
            </Button>
            <Button
              variant={location === "/lab-results" ? "secondary" : "ghost"}
              onClick={() => location !== "/lab-results" && window.location.assign("/lab-results")}
            >
              Lab Results
            </Button>
            <Button
              variant={location === "/deep-dive" ? "secondary" : "ghost"}
              onClick={() => location !== "/deep-dive" && window.location.assign("/deep-dive")}
            >
              Deep Dive
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HealthProfilePage} />
          <Route path="/lab-results" component={LabResultsPage} />
          <Route path="/deep-dive" component={DeepDivePage} />
          <Route>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
              <Button onClick={() => window.location.assign("/")}>
                Go to Health Profile
              </Button>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;

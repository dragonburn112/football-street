import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, signInWithGoogle, signInAsAnonymous } from "@/lib/firebase";
import { handleAuthRedirect } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log("Auth state changed:", user?.displayName || user?.email || "No user");
      setUser(user);
      setLoading(false);
    });

    // Handle redirect result
    handleAuthRedirect().then((result) => {
      if (result?.user) {
        console.log("Redirect auth successful:", result.user.displayName);
        setUser(result.user);
        setLoading(false);
      } else if (result?.error) {
        console.error("Redirect auth error:", result.error);
        setAuthError(result.error.message);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-primary text-4xl mb-4"></i>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <i className="fas fa-futbol text-primary text-4xl"></i>
            </div>
            <CardTitle className="text-2xl">FootballStreet</CardTitle>
            <CardDescription>
              Create player cards and join groups to play with friends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">Authentication Error</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {authError}
                </p>
              </div>
            )}
            
            <Button 
              data-testid="button-sign-in-google"
              onClick={async () => {
                try {
                  setAuthError(null);
                  await signInWithGoogle();
                } catch (error: any) {
                  setAuthError(error.message);
                }
              }}
              className="w-full flex items-center gap-3 text-base py-6"
            >
              <i className="fab fa-google text-lg"></i>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              data-testid="button-sign-in-anonymous"
              onClick={async () => {
                try {
                  setAuthError(null);
                  await signInAsAnonymous();
                } catch (error: any) {
                  setAuthError(error.message);
                }
              }}
              variant="outline"
              className="w-full flex items-center gap-3 text-base py-6"
            >
              <i className="fas fa-user text-lg"></i>
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children(user)}</>;
}
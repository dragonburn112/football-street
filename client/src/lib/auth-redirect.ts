import { getAuth, getRedirectResult, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();

// Call this function on page load when the user is redirected back from Google auth
export async function handleAuthRedirect() {
  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    if (result) {
      // User successfully signed in via redirect
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      console.log("User signed in via redirect:", user.displayName, user.email);
      return { user, credential };
    } else {
      console.log("No redirect result found");
    }
    return null;
  } catch (error: any) {
    console.error("Auth redirect error:", error.code, error.message);
    // Handle specific Firebase auth errors
    if (error.code === 'auth/unauthorized-domain') {
      console.error("Domain not authorized. Add your domain to Firebase Console -> Authentication -> Settings -> Authorized domains");
    }
    return { error };
  }
}
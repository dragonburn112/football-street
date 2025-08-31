import { getAuth, getRedirectResult, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();

// Call this function on page load when the user is redirected back from Google auth
export async function handleAuthRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User successfully signed in via redirect
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      console.log("User signed in via redirect:", user.displayName);
      return { user, credential };
    }
    return null;
  } catch (error: any) {
    console.error("Auth redirect error:", error);
    return { error };
  }
}
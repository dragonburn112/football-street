import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";

let redirectHandled = false;

export async function handleAuthRedirect() {
  if (redirectHandled) return null;
  
  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    redirectHandled = true;
    
    if (result && result.user) {
      console.log("User signed in via redirect:", result.user.displayName || result.user.email);
      return { user: result.user };
    } else {
      console.log("No redirect result found");
      return null;
    }
  } catch (error: any) {
    redirectHandled = true;
    console.error("Auth redirect error:", error.code, error.message);
    return { error };
  }
}
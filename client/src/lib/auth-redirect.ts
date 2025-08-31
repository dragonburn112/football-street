import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";

export async function handleAuthRedirect() {
  try {
    console.log("🔍 handleAuthRedirect: Getting redirect result from Firebase...");
    const result = await getRedirectResult(auth);
    
    console.log("📥 getRedirectResult returned:", {
      hasResult: !!result,
      hasUser: !!result?.user,
      userEmail: result?.user?.email,
      userDisplayName: result?.user?.displayName,
      operationType: result?.operationType,
      providerId: result?.providerId
    });
    
    if (result && result.user) {
      console.log("✅ SUCCESS: User signed in via redirect:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        providerData: result.user.providerData
      });
      return { user: result.user };
    } else {
      console.log("ℹ️ No redirect result - user not signed in via redirect");
      return null;
    }
  } catch (error: any) {
    console.error("❌ REDIRECT ERROR:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { error };
  }
}
"use server";

import { consumeSubmissionLimit, SubmissionLimitError } from "@/lib/security/submissionLimit";
import { auth, ErrorCode } from "@/lib/auth/auth";
import { LoginValidatorSchema } from "@/lib/validators/loginValifdator";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth/service-availability";

export async function signInEmailAction(data: LoginValidatorSchema) {
  try {
    const requestHeaders = await headers();
    await consumeSubmissionLimit("login-ip", requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-real-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0] || "unknown", 30, 60);
    await consumeSubmissionLimit("login-email", String(data?.email || ""), 10, 60);
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: data.email,
        password: data.password,
      },
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof SubmissionLimitError) return { error: error.message };
    if (error instanceof APIError) {
      if (error.statusCode >= 500) {
        console.error("Email sign-in service unavailable", error);
        return { error: AUTH_UNAVAILABLE_MESSAGE };
      }
      const errCode = error.body ? (error.body.code as ErrorCode) : "UNKNOWN";


      switch (errCode) {
        default:
          return { error: error.message };
        case "EMAIL_NOT_VERIFIED": 
        redirect("/auth/verify?error=email_not_verified");
        case "USER_NOT_FOUND":
          return { error: "No user found with this email." };
        case "INVALID_PASSWORD":
          return { error: "The provided password is incorrect." };
        case "ACCOUNT_NOT_FOUND":
          return { error: "Account not found." };
        case "INVALID_EMAIL":
          return { error: "The provided email is invalid." };
        case "FAILED_TO_CREATE_SESSION":
          return { error: "Failed to create a session. Please try again." };
        case "INVALID_EMAIL_OR_PASSWORD":
          return { error: "The email or password provided is incorrect." };
      }
    } else {
      console.error("Email sign-in failed", error);
      return { error: AUTH_UNAVAILABLE_MESSAGE };
    }
  }
}

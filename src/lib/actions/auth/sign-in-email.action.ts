"use server";

import { auth, ErrorCode } from "@/lib/auth/auth";
import { LoginValidatorSchema } from "@/lib/validators/loginValifdator";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInEmailAction(data: LoginValidatorSchema) {
  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: data.email,
        password: data.password,
      },
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof APIError) {
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
      return { error: "An unknown error occurred." };
    }
  }
}

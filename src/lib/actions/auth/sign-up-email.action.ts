"use server";

import { auth, ErrorCode } from "@/lib/auth/auth";
import { RegisterValidatorSchema } from "@/lib/validators/registerValidator";
import { APIError } from "better-auth/api";

export async function signUpEmailAction(data: RegisterValidatorSchema) {
  try {
    await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof APIError) {
      const errCode = error.body ? (error.body.code as ErrorCode) : "UNKNOWN";

      switch (errCode) {
        default:
          return { error: error.message };

        case "USER_ALREADY_EXISTS":
          return { error: "A user with this email already exists." };

        case "INVALID_EMAIL":
          return { error: "The provided email is invalid." };

        case "PASSWORD_TOO_SHORT":
          return { error: "The provided password is too short." };
        case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
          return { error: "User already exists, please use another email." };
      }
    } else {
      return { error: "An unknown error occurred." };
    }
  }
}

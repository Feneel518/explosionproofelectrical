import { SignupForm } from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Operator Account",
  description: "Create and verify your ExEC operations portal account.",
};

export default function SignupPage() {
  return <SignupForm />;
}

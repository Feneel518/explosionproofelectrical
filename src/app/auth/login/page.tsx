import SigninForm from "@/components/auth/signin-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator Sign In",
  description: "Secure access to the ExEC operations portal.",
};

export default function LoginPage() {
  return <SigninForm />;
}

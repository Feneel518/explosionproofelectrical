import ForgotPassword from "@/components/auth/forgot-password-form";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<{ error: string }>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = await searchParams;
  return (
    <div className="flex items-center justify-center min-h-screen flex-col ">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Forgot Password of your account?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Fill in the form below to reset your account password.
        </p>
      </div>

      <ForgotPassword></ForgotPassword>
    </div>
  );
};

export default page;

import ResetPasswordForm from "@/components/auth/reset-password-form";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<{ token: string }>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = await searchParams;
  const token = sp.token;

  if (!token) redirect("/auth/login");
  return (
    <div className="flex items-center justify-center min-h-screen flex-col ">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Please enter your new password below to reset your account password.
          Make sure it is strong, secure and atleast 8 characters long.
        </p>
      </div>

      <ResetPasswordForm token={token}></ResetPasswordForm>
    </div>
  );
};

export default page;

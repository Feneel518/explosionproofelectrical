import SendVerificationMail from "@/components/auth/send-verificatopn-mail";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  searchParams: Promise<{ error: string }>;
}

const page: FC<pageProps> = async ({ searchParams }) => {
  const sp = await searchParams;

  const error = sp.error;

  if (!error) redirect("/");
  return (
    <div className="flex items-center justify-center min-h-screen flex-col ">
      <div className="bg-red-100 p-8 text-center rounded-2xl flex flex-col items-center justify-center gap-6 text-xl">
        <div className="text-4xl">⛔</div>
        {error === "invalid_token"
          ? "The verification link is invalid or has expired."
          : error === "email_not_verified"
          ? "Please verify your email address., or resend the verification email."
          : "Oops! Something went wrong."}
      </div>

      <SendVerificationMail></SendVerificationMail>
    </div>
  );
};

export default page;

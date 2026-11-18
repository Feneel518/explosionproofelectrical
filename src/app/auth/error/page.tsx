import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth/service-availability";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const invalidToken = error === "invalid_token" || error === "token_expired";
  const unavailable =
    error === "service_unavailable" || error === "internal_server_error";

  return (
    <div className="space-y-5 rounded-2xl border bg-background p-8" role="alert">
      <h1 className="text-2xl font-semibold">
        {invalidToken
          ? "Verification link expired"
          : unavailable
            ? "Sign-in temporarily unavailable"
            : "Unable to sign in"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {invalidToken
          ? "The verification link is invalid or has expired. Request a new link to continue."
          : unavailable
            ? AUTH_UNAVAILABLE_MESSAGE
            : "Sign-in could not be completed. Please try again later or contact your administrator if the problem continues."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return to website</Link>
        </Button>
      </div>
    </div>
  );
}

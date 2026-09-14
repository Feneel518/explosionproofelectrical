"use client";

import { signInEmailAction } from "@/lib/actions/auth/sign-in-email.action";
import { signIn } from "@/lib/auth/authClient";
import {
  loginValidator,
  type LoginValidatorSchema,
} from "@/lib/validators/loginValifdator";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { GoogleMark } from "./google-mark";
import styles from "./signin-form.module.css";

export default function SigninForm() {
  const [isPending, setIsPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();

  const form = useForm<LoginValidatorSchema>({
    resolver: zodResolver(loginValidator),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValidatorSchema) => {
    setIsPending(true);
    const response = await signInEmailAction(data);

    if (response?.error) {
      toast.error(response.error);
      setIsPending(false);
      return;
    }

    toast.success("Logged in successfully!");
    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/auth/error",
      fetchOptions: {
        onRequest: () => setIsPending(true),
        onResponse: () => setIsPending(false),
        onError: (context) => {
          setIsPending(false);
          toast.error(
            context.error.message || "Something went wrong with Google sign-in",
          );
        },
      },
    });
  };

  return (
    <form className={styles.form} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <header className={styles.formHeader}>
        <div className={styles.portalLabel}>
          <LockKeyhole size={13} />
          <span>Operator portal // secure access</span>
        </div>
        <h1>Welcome back.</h1>
        <p>Enter your credentials to continue to the ExEC operations centre.</p>
      </header>

      <div className={styles.fields}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className={styles.field} data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <div className={styles.inputWrap}>
                <Mail aria-hidden="true" size={17} />
                <Input
                  {...field}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? "email-error" : undefined}
                />
              </div>
              {fieldState.invalid && (
                <FieldError id="email-error" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className={styles.field} data-invalid={fieldState.invalid}>
              <div className={styles.labelRow}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link href="/auth/forgot-password">Forgot password?</Link>
              </div>
              <div className={styles.inputWrap}>
                <LockKeyhole aria-hidden="true" size={17} />
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "password-error" : undefined
                  }
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldState.invalid && (
                <FieldError id="password-error" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      <Button
        className={styles.submitButton}
        type="submit"
        disabled={isPending}
        aria-live="polite">
        {isPending ? (
          <span>
            <Spinner /> Verifying access…
          </span>
        ) : (
          <>
            <span>Sign in to portal</span>
            <ArrowRight size={18} />
          </>
        )}
      </Button>

      <div className={styles.divider} role="separator">
        <span>or use single sign-on</span>
      </div>

      <Button
        className={styles.googleButton}
        onClick={handleGoogleSignIn}
        variant="outline"
        type="button"
        disabled={isPending}>
        <GoogleMark />
        Continue with Google
      </Button>

      <p className={styles.registration}>
        Need portal access? <Link href="/auth/register">Create an account</Link>
      </p>
    </form>
  );
}

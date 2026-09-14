"use client";

import { signUpEmailAction } from "@/lib/actions/auth/sign-up-email.action";
import { signIn } from "@/lib/auth/authClient";
import {
  registerValidator,
  type RegisterValidatorSchema,
} from "@/lib/validators/registerValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
import styles from "./signup-form.module.css";

export function SignupForm() {
  const [isPending, setIsPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const router = useRouter();

  const form = useForm<RegisterValidatorSchema>({
    resolver: zodResolver(registerValidator),
    defaultValues: {
      name: "",
      email: "",
      confirmPassword: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterValidatorSchema) => {
    setIsPending(true);
    const response = await signUpEmailAction(data);

    if (response?.error) {
      toast.error(response.error);
      setIsPending(false);
      return;
    }

    toast.success("Account created. Check your inbox to verify your email.");
    router.push("/auth/register/success");
  };

  const handleGoogleSignUp = async () => {
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
            context.error.message || "Something went wrong with Google sign-up",
          );
        },
      },
    });
  };

  return (
    <form className={styles.form} onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <header className={styles.formHeader}>
        <div className={styles.portalLabel}>
          <ShieldCheck size={13} />
          <span>New operator // identity setup</span>
        </div>
        <h1>Create access.</h1>
        <p>
          Set up your operator profile. We&apos;ll verify your email before
          activating secure portal access.
        </p>
      </header>

      <div className={styles.fields}>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className={styles.field} data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <div className={styles.inputWrap}>
                <UserRound aria-hidden="true" size={17} />
                <Input
                  {...field}
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? "name-error" : undefined}
                />
              </div>
              {fieldState.invalid && (
                <FieldError id="name-error" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className={styles.field} data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Work email</FieldLabel>
              <div className={styles.inputWrap}>
                <Mail aria-hidden="true" size={17} />
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "register-email-error" : undefined
                  }
                />
              </div>
              {fieldState.invalid && (
                <FieldError
                  id="register-email-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />

        <div className={styles.passwordGrid}>
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className={styles.field} data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password">Password</FieldLabel>
                <div className={styles.inputWrap}>
                  <LockKeyhole aria-hidden="true" size={17} />
                  <Input
                    {...field}
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="8+ characters"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid ? "register-password-error" : undefined
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
                  <FieldError
                    id="register-password-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className={styles.field} data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                <div className={styles.inputWrap}>
                  <LockKeyhole aria-hidden="true" size={17} />
                  <Input
                    {...field}
                    id="confirm-password"
                    type={showConfirmation ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid ? "confirm-password-error" : undefined
                    }
                  />
                  <button
                    className={styles.passwordToggle}
                    type="button"
                    onClick={() => setShowConfirmation((visible) => !visible)}
                    aria-label={
                      showConfirmation
                        ? "Hide password confirmation"
                        : "Show password confirmation"
                    }
                    aria-pressed={showConfirmation}>
                    {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError
                    id="confirm-password-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </div>
      </div>

      <div className={styles.verificationNote}>
        <ShieldCheck aria-hidden="true" size={15} />
        <span>Email verification is required before first access.</span>
      </div>

      <Button
        className={styles.submitButton}
        type="submit"
        disabled={isPending}
        aria-live="polite">
        {isPending ? (
          <span>
            <Spinner /> Creating account…
          </span>
        ) : (
          <>
            <span>Create operator account</span>
            <ArrowRight size={18} />
          </>
        )}
      </Button>

      <div className={styles.divider} role="separator">
        <span>or use single sign-on</span>
      </div>

      <Button
        className={styles.googleButton}
        onClick={handleGoogleSignUp}
        variant="outline"
        type="button"
        disabled={isPending}>
        <GoogleMark />
        Continue with Google
      </Button>

      <p className={styles.registration}>
        Already registered? <Link href="/auth/login">Sign in to the portal</Link>
      </p>
    </form>
  );
}

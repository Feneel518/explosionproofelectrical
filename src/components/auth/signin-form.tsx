"use client";

import { cn } from "@/lib/utils";
import React, { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  loginValidator,
  LoginValidatorSchema,
} from "@/lib/validators/loginValifdator";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/authClient";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import { useRouter } from "next/navigation";
import { signInEmailAction } from "@/lib/actions/auth/sign-in-email.action";

interface SigninFormProps {}

const SigninForm: FC<SigninFormProps> = ({}) => {
  const [isPending, setIsPending] = React.useState(false);

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
    } else {
      setIsPending(false);
      toast.success("Logged in successfully!");
      router.push("/");
    }
  };

  const handleClick = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/auth/error",
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          toast.error(
            ctx.error.message || "Something went wrong with Google Sign-In",
          );
        },
      },
    });
  };
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6")}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to sign in to your account
          </p>
        </div>

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="password"
                className="flex items-center justify-between">
                <p>Password</p>
                <Link
                  href="/auth/forgot-password"
                  className="text-muted-foreground italic">
                  Forgot Password?
                </Link>
              </FieldLabel>
              <Input {...field} id="password" type="password" required />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" disabled={isPending}>
            {" "}
            {isPending ? (
              <div className="flex items-center justify-center gap-1">
                <Spinner></Spinner> Logging in to your Account...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button onClick={handleClick} variant="outline" type="button">
            <svg
              width="800px"
              height="800px"
              viewBox="-3 0 262 262"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid">
              <path
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                fill="#4285F4"
              />
              <path
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                fill="#34A853"
              />
              <path
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                fill="#FBBC05"
              />
              <path
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                fill="#EB4335"
              />
            </svg>
            Sign up with Google
          </Button>
          <FieldDescription className="px-6 text-center">
            Don't have an account? <Link href="/auth/register">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};

export default SigninForm;

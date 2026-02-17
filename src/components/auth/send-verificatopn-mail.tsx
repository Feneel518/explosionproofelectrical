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
} from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import Link from "next/link";
import { toast } from "sonner";
import { sendVerificationEmail } from "@/lib/auth/authClient";
import { useRouter } from "next/navigation";

interface SendVerificationMailProps {}

const SendVerificationMail: FC<SendVerificationMailProps> = ({}) => {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const onSubmit = async (data: any) => {
    console.log(data);

    if (!data.email) return toast.error("Please enter your email");

    await sendVerificationEmail({
      email: data.email,
      callbackURL: "/auth/verify",
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error?.message || "Something went wrong");
        },
        onSuccess: () => {
          toast.success("Verification email sent successfully");
          router.push("/auth/verify/success");
        },
      },
    });
  };
  const form = useForm();

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6 w-full mt-8")}>
      <FieldGroup>
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

        <Field>
          <Button type="submit" disabled={isPending}>
            {" "}
            {isPending ? (
              <div className="flex items-center justify-center gap-1">
                <Spinner></Spinner> Logging in to your Account...
              </div>
            ) : (
              "Resend Verification Mail"
            )}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="px-6 text-center">
            Don't have an account? <Link href="/auth/register">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};

export default SendVerificationMail;

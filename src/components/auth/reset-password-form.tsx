"use client";

import React, { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth/authClient";

interface ResetPasswordFormProps {
  token: string;
}

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ token }) => {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const form = useForm();

  const onSubmit = async (data: any) => {
    if (!data.password) return toast.error("Please enter your new password");

    await resetPassword({
      newPassword: data.password,
      token,
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
          toast.success("Password reset successfully");
          router.push("/auth/login");
        },
      },
    });
  };
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6 mt-8")}>
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input {...field} id="password" type="password" required />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <div className="flex items-center justify-center gap-1">
              <Spinner></Spinner> Reseting Account Password...
            </div>
          ) : (
            "Reset Password"
          )}
        </Button>
      </Field>
    </form>
  );
};

export default ResetPasswordForm;

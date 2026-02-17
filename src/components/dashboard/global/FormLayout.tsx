import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FC } from "react";

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  /** If you want a subtle helper text under footer */
  footerHint?: React.ReactNode;
}

const FormLayout: FC<FormLayoutProps> = ({
  children,
  title,
  description,
  footer,
  footerHint,
}) => {
  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-regular tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-5 md:p-6">{children}</CardContent>

      {footer ? (
        <>
          <Separator />
          <CardFooter className="flex flex-col items-end gap-2 p-5 md:p-6">
            <div className="flex  w-full justify-between gap-2">
              {footerHint ? (
                <div className="text-xs text-muted-foreground w-full ">
                  {footerHint}
                </div>
              ) : null}
              <div className="w-full">{footer}</div>
            </div>
          </CardFooter>
        </>
      ) : null}
    </Card>
  );
};

export default FormLayout;

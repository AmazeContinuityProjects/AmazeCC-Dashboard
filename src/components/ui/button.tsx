import { Button as AmazeUIButton, buttonVariants, cn } from "@amazecontinuityprojects/amazeui";
import type { ComponentPropsWithoutRef } from "react";
import * as React from "react";

type AmazeUIButtonProps = ComponentPropsWithoutRef<typeof AmazeUIButton>;

type ButtonProps = AmazeUIButtonProps & {
  className?: string;
  children?: React.ReactNode;
  variant?: "link" | "default" | "primary" | "destructive" | "danger" | "success" | "outline" | "secondary" | "ghost" | null;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | null;
  onClick?: (event: any) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  [key: string]: any;
};

const Button = React.forwardRef<any, ButtonProps>(({ className, children, ...props }, ref) => {
  const hasCol = className?.includes('flex-col');
  return (
    <AmazeUIButton
      ref={ref}
      className={cn(
        !hasCol && "!flex-row !items-center !justify-center gap-2",
        className
      )}
      {...(props as any)}
    >
      {children}
    </AmazeUIButton>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };

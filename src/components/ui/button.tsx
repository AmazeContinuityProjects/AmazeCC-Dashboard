import { Button as AmazeUIButton, buttonVariants } from "@amazecontinuityprojects/amazeui";
import type { ComponentPropsWithoutRef } from "react";
import * as React from "react";

type AmazeUIButtonProps = ComponentPropsWithoutRef<typeof AmazeUIButton>;

type ButtonProps = AmazeUIButtonProps & {
  [key: `on${string}`]: any;
};

const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
  return <AmazeUIButton ref={ref} {...(props as any)} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };

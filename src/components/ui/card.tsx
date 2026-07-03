import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@amazecontinuityprojects/amazeui";
import { cn } from "@/lib/utils";

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
};

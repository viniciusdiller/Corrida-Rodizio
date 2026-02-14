import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Home,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Share2,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-semibold transition-[background-color,color,box-shadow,transform,border-color] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 hover:shadow-md",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/50",
        outline:
          "border-border bg-background text-foreground shadow-xs hover:border-accent/70 hover:bg-accent/20 hover:text-foreground dark:bg-card/70 dark:hover:bg-accent/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/90 hover:shadow-sm",
        ghost:
          "border-border/70 bg-transparent text-foreground hover:border-accent/70 hover:bg-accent/25 hover:text-foreground dark:border-border",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const textIconMatchers: Array<{ regex: RegExp; icon: LucideIcon }> = [
  { regex: /(voltar|back|retornar)/i, icon: ArrowLeft },
  { regex: /(copiar|copy)/i, icon: Copy },
  { regex: /(compartilhar|share)/i, icon: Share2 },
  { regex: /(entrar|login|acessar)/i, icon: LogIn },
  { regex: /(sair|logout)/i, icon: LogOut },
  { regex: /(cancelar|fechar|close)/i, icon: X },
  { regex: /(salvar|save|confirmar|concluir|finalizar|ok)/i, icon: Check },
  { regex: /(excluir|deletar|apagar|remover|delete|remove)/i, icon: Trash2 },
  { regex: /(editar|edit)/i, icon: Pencil },
  { regex: /(criar|novo|nova|adicionar|add)/i, icon: Plus },
  { regex: /(início|inicio|home)/i, icon: Home },
  { regex: /(continuar|próximo|proximo|next|avançar|avancar|ir)/i, icon: ArrowRight },
];

function inferButtonIcon(buttonText: string): LucideIcon {
  const matched = textIconMatchers.find(({ regex }) => regex.test(buttonText));
  return matched?.icon ?? ArrowRight;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const childrenArray = React.Children.toArray(children);
  const textOnlyChildren =
    childrenArray.length > 0 &&
    childrenArray.every((child) => typeof child === "string" || typeof child === "number");
  const shouldRenderDefaultIcon =
    size !== "icon" && size !== "icon-sm" && size !== "icon-lg" && textOnlyChildren;
  const buttonText = textOnlyChildren ? childrenArray.join(" ") : "";
  const Icon = inferButtonIcon(buttonText);

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {shouldRenderDefaultIcon ? <Icon aria-hidden="true" /> : null}
    </Comp>
  );
}

export { Button, buttonVariants };

"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-context";
import { useToast } from "@/components/ui/toast";

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  disabled,
  className,
}: {
  product: { id: string; slug: string; name: string; category: string; price: number };
  quantity?: number;
  size?: ButtonProps["size"];
  disabled?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const toast = useToast();
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(t);
  }, [added]);

  return (
    <Button
      size={size}
      variant={added ? "secondary" : "primary"}
      disabled={disabled}
      className={className}
      onClick={() => {
        add({ productId: product.id, slug: product.slug, name: product.name, category: product.category, price: product.price }, quantity);
        setAdded(true);
        toast({ tone: "success", title: "Added to cart", description: `${quantity} × ${product.name}` });
      }}
      aria-label={disabled ? `${product.name} is sold out` : `Add ${product.name} to cart`}
    >
      {added ? <Check aria-hidden /> : <Plus aria-hidden />}
      {disabled ? "Sold out" : added ? "Added" : "Add"}
    </Button>
  );
}

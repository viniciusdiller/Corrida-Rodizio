"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface RoomHeaderProps {
  onExit: () => void;
}

export function RoomHeader({
  onExit,
}: RoomHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={onExit}
        className="text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Sair
      </Button>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}

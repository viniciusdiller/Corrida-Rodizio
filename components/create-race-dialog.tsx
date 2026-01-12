"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { FoodType } from "@/types/database"

interface CreateRaceDialogProps {
  onRaceCreated: () => void
}

export function CreateRaceDialog({ onRaceCreated }: CreateRaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [foodType, setFoodType] = useState<FoodType>("pizza")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("races").insert({
      name,
      food_type: foodType,
    })

    setIsLoading(false)

    if (!error) {
      setName("")
      setFoodType("pizza")
      setOpen(false)
      onRaceCreated()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Start New Race
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Race</DialogTitle>
          <DialogDescription>Create a competition to see who can eat the most!</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Race Name</Label>
              <Input
                id="name"
                placeholder="Friday Night Challenge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="food-type">Food Type</Label>
              <Select value={foodType} onValueChange={(value) => setFoodType(value as FoodType)}>
                <SelectTrigger id="food-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="sushi">Sushi</SelectItem>
                  <SelectItem value="burger">Burger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Race"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

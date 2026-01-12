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
import { UserPlus } from "lucide-react"

interface AddParticipantDialogProps {
  raceId: string
  onParticipantAdded: () => void
}

export function AddParticipantDialog({ raceId, onParticipantAdded }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("participants").insert({
      race_id: raceId,
      name,
      items_eaten: 0,
    })

    setIsLoading(false)

    if (!error) {
      setName("")
      setOpen(false)
      onParticipantAdded()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <UserPlus className="h-4 w-4" />
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>Add a new competitor to this race.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="participant-name">Name</Label>
              <Input
                id="participant-name"
                placeholder="Enter participant name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Participant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

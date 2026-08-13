import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface SliceUpdate {
  participant_id: string;
  slice_count: number;
  room_code: string;
  updated_at: string;
}

export function useRealtimeSlices(roomCode: string, currentParticipantId: string) {
  const [sliceUpdates, setSliceUpdates] = useState<Map<string, SliceUpdate>>(new Map());

  useEffect(() => {
    if (!roomCode) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to realtime changes in the slices table
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slices',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Realtime slice update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newUpdate = payload.new as SliceUpdate;
            setSliceUpdates(prev => {
              const next = new Map(prev);
              next.set(newUpdate.participant_id, newUpdate);
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldUpdate = payload.old as SliceUpdate;
            setSliceUpdates(prev => {
              const next = new Map(prev);
              next.delete(oldUpdate.participant_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  return sliceUpdates;
}

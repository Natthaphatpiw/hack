'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MachineStatusCard } from './MachineStatusCard';
import type { Machine } from '@/types';

export function FactoryOverview() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMachines();
    
    // Subscribe to machine status changes
    const subscription = supabase
      .channel('machines-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'machines' },
        () => fetchMachines()
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  async function fetchMachines() {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('criticality', { ascending: false });
    
    if (!error && data) {
      setMachines(data);
    }
    setLoading(false);
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse border border-slate-700/50" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {machines.map((machine) => (
        <MachineStatusCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
}


import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    
    const { data: machines, error } = await supabase
      .from('machines')
      .select('*')
      .order('criticality', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch machines' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ machines });
  } catch (error) {
    console.error('Machines fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch machines' }, 
      { status: 500 }
    );
  }
}

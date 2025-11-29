import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' }, 
      { status: 400 }
    );
  }
  
  try {
    const supabase = getSupabaseServer();
    
    // Get pipeline session
    const { data: session, error: sessionError } = await supabase
      .from('pipeline_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      );
    }
    
    // Get all agent logs for this session
    const { data: agentLogs } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    // Get anomaly if exists
    const { data: anomaly } = await supabase
      .from('anomalies')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    // Get diagnosis if exists
    const { data: diagnosis } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    // Get work order if exists
    const { data: workOrder } = await supabase
      .from('work_orders')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    // Get notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('session_id', sessionId);
    
    return NextResponse.json({
      session,
      agentLogs: agentLogs || [],
      anomaly,
      diagnosis,
      workOrder,
      notifications: notifications || []
    });
    
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' }, 
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline, createPipelineSession } from '@/lib/agents';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { readingId, machineId } = await request.json();
    
    if (!readingId || !machineId) {
      return NextResponse.json(
        { error: 'readingId and machineId are required' }, 
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseServer();
    
    // Get the reading
    const { data: reading, error: readingError } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('id', readingId)
      .single();
    
    if (readingError || !reading) {
      return NextResponse.json(
        { error: 'Reading not found' }, 
        { status: 404 }
      );
    }
    
    // Get the machine
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('*')
      .eq('machine_id', machineId)
      .single();
    
    if (machineError || !machine) {
      return NextResponse.json(
        { error: 'Machine not found' }, 
        { status: 404 }
      );
    }
    
    // Get thresholds for this machine type
    const { data: thresholds } = await supabase
      .from('thresholds')
      .select('*')
      .eq('machine_type', machine.type);
    
    // Create pipeline session
    const sessionId = await createPipelineSession(machineId, readingId);
    
    // Run the pipeline
    const result = await runAgentPipeline(
      reading, 
      machine, 
      thresholds || [],
      sessionId
    );
    
    // Update machine status if anomaly detected
    if (result.anomalyDetected && result.anomalyDetails) {
      await supabase
        .from('machines')
        .update({ 
          status: result.anomalyDetails.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          health_score: Math.max(0, machine.health_score - (result.anomalyDetails.severity === 'CRITICAL' ? 30 : 15)),
          updated_at: new Date().toISOString()
        })
        .eq('machine_id', machineId);
    }
    
    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      anomalyDetected: result.anomalyDetected,
      anomalyType: result.anomalyDetails?.type,
      severity: result.anomalyDetails?.severity,
      diagnosis: result.diagnosis?.rootCause,
      workOrder: result.workOrder?.woNumber,
      safetyDecision: result.safetyApproval?.decision,
      notificationCount: result.notifications?.length || 0,
      agentLogsCount: result.agentLogs.length
    });
    
  } catch (error) {
    console.error('Pipeline error:', error);
    return NextResponse.json(
      { error: 'Pipeline execution failed', details: String(error) }, 
      { status: 500 }
    );
  }
}

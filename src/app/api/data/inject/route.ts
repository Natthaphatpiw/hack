import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// Predefined anomaly scenarios for demo
const ANOMALY_SCENARIOS = {
  bearing_wear: {
    name: 'Bearing Wear (Critical)',
    values: {
      vib_rms_horizontal: 4.5,
      vib_rms_vertical: 3.8,
      vib_peak_accel: 1.2,
      bearing_temp: 88,
      pressure: 8.5,
      status_flag: 'CRITICAL'
    }
  },
  overheat: {
    name: 'Overheating (Warning)',
    values: {
      vib_rms_horizontal: 0.6,
      vib_rms_vertical: 0.5,
      vib_peak_accel: 0.15,
      bearing_temp: 78,
      pressure: 8.2,
      status_flag: 'WARNING'
    }
  },
  vibration_spike: {
    name: 'Vibration Spike (Warning)',
    values: {
      vib_rms_horizontal: 3.2,
      vib_rms_vertical: 2.8,
      vib_peak_accel: 0.8,
      bearing_temp: 65,
      pressure: 8.4,
      status_flag: 'WARNING'
    }
  },
  pressure_critical: {
    name: 'Pressure Critical',
    values: {
      vib_rms_horizontal: 0.5,
      vib_rms_vertical: 0.4,
      vib_peak_accel: 0.12,
      bearing_temp: 63,
      pressure: 11.5,
      status_flag: 'CRITICAL'
    }
  },
  combined_failure: {
    name: 'Combined Failure (Critical)',
    values: {
      vib_rms_horizontal: 5.2,
      vib_rms_vertical: 4.5,
      vib_peak_accel: 1.5,
      bearing_temp: 92,
      pressure: 11.8,
      status_flag: 'CRITICAL'
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { machineId, scenario } = await request.json();
    
    if (!machineId || !scenario) {
      return NextResponse.json(
        { error: 'machineId and scenario are required' }, 
        { status: 400 }
      );
    }
    
    const scenarioData = ANOMALY_SCENARIOS[scenario as keyof typeof ANOMALY_SCENARIOS];
    
    if (!scenarioData) {
      return NextResponse.json(
        { error: 'Invalid scenario', availableScenarios: Object.keys(ANOMALY_SCENARIOS) }, 
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseServer();
    
    // Insert anomaly reading
    const { data: reading, error } = await supabase
      .from('sensor_readings')
      .insert({
        machine_id: machineId,
        timestamp: new Date().toISOString(),
        ...scenarioData.values
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to inject data', details: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reading,
      scenario: scenarioData.name,
      message: `Successfully injected ${scenarioData.name} scenario for ${machineId}`
    });
    
  } catch (error) {
    console.error('Data injection error:', error);
    return NextResponse.json(
      { error: 'Failed to inject data' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableScenarios: Object.entries(ANOMALY_SCENARIOS).map(([id, data]) => ({
      id,
      name: data.name,
      values: data.values
    }))
  });
}

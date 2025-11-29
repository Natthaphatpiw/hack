import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, lineUserId, displayName, pictureUrl } = await request.json();

    if (!employeeId || !lineUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีพนักงานคนนี้อยู่หรือไม่
    const { data: existingEmployee, error: findError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error finding employee:', findError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีคนอื่นใช้ LINE User ID นี้หรือไม่
    const { data: existingLineUser, error: lineCheckError } = await supabase
      .from('employees')
      .select('*')
      .eq('line_user_id', lineUserId)
      .neq('employee_id', employeeId)
      .single();

    if (lineCheckError && lineCheckError.code !== 'PGRST116') {
      console.error('Error checking line user:', lineCheckError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingLineUser) {
      return NextResponse.json(
        { error: 'This LINE account is already registered to another employee' },
        { status: 409 }
      );
    }

    // อัปเดต LINE User ID ให้กับพนักงาน
    const { data, error: updateError } = await supabase
      .from('employees')
      .update({
        line_user_id: lineUserId,
        line_display_name: displayName,
        line_picture_url: pictureUrl,
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .select();

    if (updateError) {
      console.error('Error updating employee:', updateError);
      return NextResponse.json(
        { error: 'Failed to register LINE ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'LINE ID registered successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('LINE registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

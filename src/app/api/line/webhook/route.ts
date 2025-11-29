import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import crypto from 'crypto';

// Helper function to send notification to managers
async function sendManagerNotification(notification: { title: string; content: string; priority: string }) {
  try {
    // Get all managers from employees table
    const { data: managers, error } = await supabase
      .from('employees')
      .select('name, line_user_id')
      .in('role', ['MANAGER', 'SUPERVISOR'])
      .not('line_user_id', 'is', null);

    if (error || !managers || managers.length === 0) {
      console.log('No managers found or error:', error);
      return;
    }

    // Create notification card
    const messageCard = {
      type: 'flex',
      altText: `แจ้งเตือน: ${notification.title}`,
      contents: {
        type: 'bubble',
        hero: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📊 แจ้งเตือนจากระบบ',
              weight: 'bold',
              size: 'lg',
              color: '#FFFFFF'
            }
          ],
          backgroundColor: '#1E293B',
          paddingAll: '15px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: notification.title,
              weight: 'bold',
              size: 'md',
              color: '#FFFFFF',
              margin: 'md'
            },
            {
              type: 'text',
              text: notification.content,
              size: 'sm',
              color: '#E2E8F0',
              wrap: true,
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'เวลา:',
                  size: 'xs',
                  color: '#64748B',
                  flex: 1
                },
                {
                  type: 'text',
                  text: new Date().toLocaleString('th-TH'),
                  size: 'xs',
                  color: '#94A3B8',
                  flex: 2
                }
              ],
              margin: 'md'
            }
          ]
        },
        styles: {
          hero: {
            backgroundColor: '#1E293B'
          },
          body: {
            backgroundColor: '#0F172A'
          }
        }
      }
    };

    // Send to each manager
    for (const manager of managers) {
      if (manager.line_user_id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/line/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: manager.line_user_id,
              messages: [messageCard]
            })
          });

          if (response.ok) {
            console.log(`Manager notification sent to ${manager.name}`);
          } else {
            console.error(`Failed to send to ${manager.name}:`, await response.text());
          }
        } catch (error) {
          console.error(`Error sending to ${manager.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error sending manager notifications:', error);
  }
}

// LINE Channel Secret for signature verification
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '75dd83c920ab00a71e00ea840d3ca2cb';

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // Verify LINE signature
    if (!signature || !verifySignature(body, signature)) {
      console.error('Invalid LINE signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    const events = webhookData.events || [];

    console.log('Received LINE webhook events:', events.length);

    for (const event of events) {
      if (event.type === 'message' && event.message?.type === 'text') {
        // Handle text messages (for testing)
        console.log('Received text message:', event.message.text);

      } else if (event.type === 'postback') {
        // Handle postback actions from LINE Card Messages
        await handlePostbackAction(event);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePostbackAction(event: any) {
  try {
    const { data: postbackData } = event.postback;
    const userId = event.source.userId;

    console.log('Handling postback action:', { data: postbackData, userId });

    // Parse postback data (format: "action:workOrderId" or "action:workOrderId:status")
    const [action, workOrderId, status] = postbackData.split(':');

    if (!workOrderId) {
      console.error('Invalid postback data format');
      return;
    }

    // Find employee by LINE user ID
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('line_user_id', userId)
      .single();

    if (empError || !employee) {
      console.error('Employee not found for LINE user ID:', userId);
      return;
    }

    // Update work order based on action
    if (action === 'accept_work') {
      // Technician accepts the work
      await supabase
        .from('work_orders')
        .update({
          status: 'IN_PROGRESS',
          actual_start: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      // Create notification for manager and send LINE message
      await supabase
        .from('notifications')
        .insert({
          session_id: null, // Will be updated when we get session from work order
          machine_id: null, // Will be updated
          recipient_type: 'PLANT_MANAGER',
          recipient_name: 'Plant Manager',
          channel: 'LINE',
          message_type: 'STATUS_UPDATE',
          title: `งานซ่อมได้รับการยอมรับ`,
          content: `ช่าง ${employee.name} ได้รับงาน WO-${workOrderId.slice(-8)} แล้ว`,
          priority: 'MEDIUM'
        });

      // Send LINE notification to managers
      await sendManagerNotification({
        title: `✅ งานซ่อมได้รับการยอมรับ`,
        content: `ช่าง ${employee.name} ได้รับงาน WO-${workOrderId.slice(-8)} แล้ว\n⏰ กำหนดเริ่มงาน: ตามแผนงาน\n📊 ติดตาม progress ได้จากระบบ`,
        priority: 'MEDIUM'
      });

    } else if (action === 'complete_work') {
      // Technician completes the work
      await supabase
        .from('work_orders')
        .update({
          status: 'COMPLETED',
          actual_end: new Date().toISOString(),
          post_maintenance_health_score: 95, // Mock health score
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      // Create notification for manager
      await supabase
        .from('notifications')
        .insert({
          session_id: null,
          machine_id: null,
          recipient_type: 'PLANT_MANAGER',
          recipient_name: 'Plant Manager',
          channel: 'LINE',
          message_type: 'STATUS_UPDATE',
          title: `งานซ่อมเสร็จสิ้น`,
          content: `ช่าง ${employee.name} ได้รายงานว่าซ่อมเสร็จ WO-${workOrderId.slice(-8)} แล้ว`,
          priority: 'HIGH'
        });

      // Send LINE notification to managers
      await sendManagerNotification({
        title: `🎉 งานซ่อมเสร็จสิ้น`,
        content: `ช่าง ${employee.name} ได้รายงานว่าซ่อมเสร็จ WO-${workOrderId.slice(-8)} แล้ว\n✅ สถานะ: Completed\n📊 ตรวจสอบผลการซ่อมได้จากระบบ`,
        priority: 'HIGH'
      });
    }

    console.log(`Work order ${workOrderId} updated with action: ${action}`);

  } catch (error) {
    console.error('Error handling postback action:', error);
  }
}

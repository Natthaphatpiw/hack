import { NextRequest, NextResponse } from 'next/server';

// LINE Channel Access Token
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ||
  '/8ZPIKf5mpf+t3n6KVD4wTn2nP0DjnL9WH1s3TVAEYiTpYZu2lpnHfGwLC4f9ZvlhucJmF3PfPESF5eabKvlmdywZ9dKLEBo7BtE4uWVjAM0B32aosO3g27y/ryCN86LE1tPT0ECHzKHOpcLjG5XcAdB04t89/1O/w1cDnyilFU=';

interface LineMessage {
  to: string; // LINE User ID
  messages: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { to, messages } = await request.json();
    console.log('📨 LINE API called: sending to', to, 'with', messages?.length, 'messages');

    if (!to || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: to and messages' },
        { status: 400 }
      );
    }

    const payload: LineMessage = {
      to,
      messages
    };

    console.log('Sending LINE message to:', to);

    // Send message via LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LINE API Error:', response.status, errorData);
      return NextResponse.json(
        { error: `LINE API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('LINE message sent successfully:', result);

    return NextResponse.json({
      success: true,
      messageId: result.sentMessages?.[0]?.id,
      result
    });

  } catch (error) {
    console.error('Error sending LINE message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to create work order card message
export function createWorkOrderCard(workOrder: any, technician: any) {
  const workOrderId = workOrder.id;
  const machineName = workOrder.machine_id || 'Unknown Machine';
  const priority = workOrder.priority || 'MEDIUM';
  const scheduledTime = workOrder.scheduled_start ?
    new Date(workOrder.scheduled_start).toLocaleString('th-TH') : 'ไม่ระบุ';

  const priorityColor = {
    'LOW': '#10B981',      // Green
    'MEDIUM': '#F59E0B',   // Yellow
    'HIGH': '#EF4444',     // Red
    'URGENT': '#DC2626'    // Dark Red
  };

  return {
    type: 'flex',
    altText: `งานซ่อมเครื่องจักร: ${machineName}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔧 งานซ่อมเครื่องจักร',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#1E293B',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'เครื่องจักร:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: machineName,
                size: 'sm',
                color: '#FFFFFF',
                weight: 'bold',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'ความสำคัญ:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: priority,
                size: 'sm',
                color: priorityColor[priority as keyof typeof priorityColor] || '#64748B',
                weight: 'bold',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'กำหนดเวลา:',
                size: 'sm',
                color: '#64748B',
                flex: 2
              },
              {
                type: 'text',
                text: scheduledTime,
                size: 'sm',
                color: '#FFFFFF',
                flex: 3
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: workOrder.description || 'กรุณาดำเนินการซ่อมเครื่องจักรตามแผนงาน',
            size: 'sm',
            color: '#E2E8F0',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: 'รับงาน',
                  data: `accept_work:${workOrderId}`,
                  displayText: 'ฉันรับงานนี้แล้ว'
                },
                color: '#10B981',
                style: 'primary',
                margin: 'sm'
              },
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: 'ซ่อมเสร็จ',
                  data: `complete_work:${workOrderId}`,
                  displayText: 'งานซ่อมเสร็จแล้ว'
                },
                color: '#3B82F6',
                style: 'secondary',
                margin: 'sm'
              }
            ],
            spacing: 'sm'
          }
        ],
        backgroundColor: '#0F172A'
      },
      styles: {
        hero: {
          backgroundColor: '#1E293B'
        },
        body: {
          backgroundColor: '#0F172A'
        },
        footer: {
          backgroundColor: '#0F172A'
        }
      }
    }
  };
}

// Helper function to create manager notification card
export function createManagerNotificationCard(notification: any) {
  const timestamp = new Date().toLocaleString('th-TH');

  return {
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
                text: timestamp,
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
}

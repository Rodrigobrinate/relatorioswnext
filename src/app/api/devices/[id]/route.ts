// app/api/devices/[deviceId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; // Ajuste o caminho
import '../../../../lib/bigint-patch'; // Importa o patch

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  const { deviceId } = params;

  if (!deviceId) {
    return NextResponse.json({ error: 'Invalid deviceId' }, { status: 400 });
  }

  try {
    const deviceData = await prisma.device.findUnique({
      where: {
        id: parseInt(deviceId),
      },
      include: {
        NetworkInterface: {
          orderBy: {
            interface_name: 'asc',
          },
          include: {
            // Histórico de leituras (TX/RX, Temp, etc.)
            TransceiverReading: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 288, // Ex: Pega as últimas 288 leituras (24h se for a cada 5 min)
            },
            // Histórico de estatísticas (Erros)
            InterfaceStats: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 288,
            },
            // Informações do módulo (para limites de alarme)
            TransceiverModule: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!deviceData) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Graças ao patch, isso agora funciona sem travar
    return NextResponse.json(deviceData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch device data' },
      { status: 500 }
    );
  }
}
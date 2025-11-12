// app/api/devices/[deviceId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; // Ajuste o caminho
import '../../../../lib/bigint-patch'; // Importa o patch

const prisma = new PrismaClient();

export async function POST(
  request: Request,
) {
  const body = await request.json();
  
  // --- PARÂMETROS ATUALIZADOS ---
  // Agora recebemos deviceId, startDate, e endDate do corpo
  const { deviceId, startDate, endDate } = body;

  if (!deviceId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters (deviceId, startDate, endDate)' }, { status: 400 });
  }

  try {
    // --- CONSULTA DO PRISMA MODIFICADA ---
    
    // Criamos o filtro de tempo
    const timeFilter = {
      timestamp: {
        gte: new Date(startDate), // 'gte' = Greater than or equal (Maior ou igual)
        lte: new Date(endDate),   // 'lte' = Less than or equal (Menor ou igual)
      }
    };

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
              where: timeFilter,     // <-- APLICADO O FILTRO
              orderBy: {
                timestamp: 'asc',  // <-- MUDADO DE 'desc'
              },
              // 'take' foi removido para pegar TODOS os dados no intervalo
            },
            // Histórico de estatísticas (Erros)
            InterfaceStats: {
              where: timeFilter,     // <-- APLICADO O FILTRO
              orderBy: {
                timestamp: 'asc',  // <-- MUDADO DE 'desc'
              },
              // 'take' foi removido
            },
            // Informações do módulo (NÃO MUDOU)
            // Continua pegando o 1 mais recente para os alarmes
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
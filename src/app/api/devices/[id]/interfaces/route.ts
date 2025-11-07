import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


BigInt.prototype.toJSON = function() {
  return this.toString();
};
export async function POST(  request: Request,  { params}: { params: { deviceId: string },}
) {
  //const deviceId = params.deviceId;
const body = await request.json();
    const { deviceId } = body; //
  if (!deviceId) {
    return NextResponse.json(
      { error: 'ID do dispositivo não fornecido.' },
      { status: 400 }
    );
  }

  try {
    const interfaces = await prisma.networkInterface.findMany({
      where: {
        device_id: parseInt(deviceId), // [cite: 6]
      },
      include: {
        // Aqui está a lógica para "último sinal"
        TransceiverReading: {
          orderBy: {
            timestamp: 'desc', // [cite: 22] Pega o mais recente
          },
          take: 1, // Pega apenas 1
        },
        TransceiverModule: {
            orderBy: {
            timestamp: 'desc', // [cite: 22] Pega o mais recente
          },

          take: 1, // Pega apenas 1
        },
        InterfaceStats:{
             orderBy: {
            timestamp: 'desc', // [cite: 22] Pega o mais recente
          },

          take: 1, // Pega apenas 1
        
        }
      },
      orderBy: {
        interface_name: 'asc', // [cite: 6]
      },
    });
    return NextResponse.json(interfaces);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Falha ao buscar interfaces para este dispositivo.' },
      { status: 500 }
    );
  }
}
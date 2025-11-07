// app/api/interfaces/[interfaceId]/stats/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import '../../../../../lib/bigint-patch'; // Importante para o BigInt

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { interfaceId: string } }
) {

    const body = await request.json();
    const { interfaceId } = body; //
  const id = interfaceId

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid interface ID' }, { status: 400 });
  }

  try {
    // Busca o histórico de stats para esta interface
    const stats = await prisma.interfaceStats.findMany({
      where: {
        interface_id: id,
      },
      orderBy: {
        timestamp: 'asc', // 'asc' é melhor para gráficos, do mais antigo ao mais novo
      },
      take: 288, // Pega as últimas 288 leituras (ex: 24h a cada 5 min)
    });

    // Busca os detalhes da interface para o título do gráfico
    const interfaceDetails = await prisma.networkInterface.findUnique({
      where: {
        id: id,
      },
      select: {
        interface_name: true,
        description: true,
        Device: {
          select: {
            hostname: true,
          },
        },
      },
    });

    return NextResponse.json({ stats, details: interfaceDetails });

  } catch (error) {
    console.error(`Failed to fetch stats for interface ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch interface stats' },
      { status: 500 }
    );
  }
}



// src/app/api/interface-stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Corpo (body) da requisição mal formatado.' }, { status: 400 });
  }

  // 1. Extrair os novos parâmetros do body
  const interfaceId = parseInt(body.id, 10);
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (isNaN(interfaceId)) {
    return NextResponse.json({ error: `ID da interface inválido: ${body.id}` }, { status: 400 });
  }

  // 2. Validar as datas
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate e endDate são obrigatórios.' }, { status: 400 });
  }

  try {
    // 3. Usar as datas no 'where' do Prisma
    const stats = await prisma.interfaceStats.findMany({
      where: {
        interface_id: interfaceId,
        timestamp: {
          gte: startDate, // Maior ou igual (a partir de)
          lte: endDate,   // Menor ou igual (até)
        },
      },
      select: {
        timestamp: true,
        in_uti: true,
        out_uti: true,
      },
      orderBy: {
        timestamp: 'asc', // Ordem cronológica
      },
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error(`Erro ao buscar estatísticas para interface ${interfaceId}:`, error);
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação" },
      { status: 500 }
    );
  }
}
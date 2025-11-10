// app/api/interfaces/route.ts
import { NextResponse } from 'next/server';
import  prisma  from '../../../lib/prisma'; // Importa a instância ÚNICA

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const vendor = searchParams.get('vendor');
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const where: any = {};
    const andConditions: any[] = []; // Usamos AND para combinar filtros

    // --- FILTRO DE BUSCA GERAL (MELHORADO) ---
    if (search) {
      // Procura em múltiplos campos da interface, dispositivo e módulo
      andConditions.push({
        OR: [
          // Campos do Device 
          { Device: { hostname: { contains: search, mode: 'insensitive' } } },
          { Device: { ip_address: { contains: search, mode: 'insensitive' } } },
          // Campos da NetworkInterface 
          { interface_name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          // Campos do TransceiverModule (Serial Number e Part Number) 
          {
            transceiverModule: {
              some: {
                OR: [
                  { serial_number: { contains: search, mode: 'insensitive' } },
                  { vendor_part_number: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    // --- FILTRO DE FABRICANTE ---
    if (vendor) {
      // Adiciona como uma condição AND separada
      andConditions.push({
        transceiverModule: {
          some: {
            vendor_name: { contains: vendor, mode: 'insensitive' }, // 
          },
        },
      });
    }

    // Aplica as condições AND
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // --- ORDENAÇÃO ---
    const orderBy: any = {};
    if (sortBy === 'Device.hostname') {
      orderBy.Device = { hostname: sortOrder };
    } else if (sortBy === 'interface_name') {
      orderBy.interface_name = { [sortOrder]: sortOrder };
    } else {
      orderBy.id = 'asc';
    }

    // --- QUERY AO BANCO ---
    const interfaces = await prisma.networkInterface.findMany({
      where,
      orderBy,
      include: {
        Device: true,
        TransceiverModule: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        TransceiverReading: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(interfaces);

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assumindo que você tenha um alias '@' para a raiz

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        hostname: true, // [cite: 2]
      },
      orderBy: {
        hostname: 'asc', // [cite: 2]
      },
    });
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao buscar dispositivos.' },
      { status: 500 }
    );
  }
}
// app/relatorios/potencia/page.tsx
import { PrismaClient } from '@prisma/client';
import PowerReportClient from '../../../components/PowerReportClient'; // Componente de cliente

const prisma = new PrismaClient();

// Função para buscar os devices no servidor
async function getDevices() {
  try {
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        hostname: true,
      },
      orderBy: {
        hostname: 'asc',
      },
    });
    return devices;
  } catch (error) {
    console.error("Failed to fetch devices in Server Component:", error);
    return [];
  }
}

// Este é um Server Component (padrão)
export default async function PowerReportPage() {
  // 1. Busca os dados da lista de devices NO SERVIDOR
  const initialDevices = await getDevices();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatório de Potência Óptica</h1>
      
      {/* 2. Renderiza o componente de CLIENTE e passa os 
           dados iniciais (lista de devices) como prop.
      */}
      <PowerReportClient initialDevices={initialDevices} />
    </div>
  );
}
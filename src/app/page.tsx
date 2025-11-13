import DeviceMonitor from '../components/DeviceMonitor';
import prisma from '@/lib/prisma';

// Criamos um tipo simples para os dados que vamos buscar
export type SimpleDevice = {
  id: number;
  hostname: string;
};

// Esta função roda SOMENTE no servidor
async function getDevices(): Promise<SimpleDevice[]> {
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
    return devices;
  } catch (error) {
    console.error('Falha ao buscar devices no servidor:', error);
    return [];
  }
}

// Este é o Server Component principal
export default async function Home() {
  // Busca os dados antes de renderizar a página
  const initialDevices = await getDevices();

  return (
    <main className="container mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Monitor de Sinais de Transceiver</h1>

      {/* Renderiza o Client Component e passa a lista de devices
        que já foi carregada no servidor.
      */}
      <DeviceMonitor initialDevices={initialDevices} />
    </main>
  );
} 
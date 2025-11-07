// components/PowerReportClient.tsx
"use client"; // ESSENCIAL: Marca este como um Client Component

import { useState, useEffect } from 'react';
import type { Device, NetworkInterface, TransceiverReading, InterfaceStats, TransceiverModule } from '@prisma/client';
import PortCharts from './PortCharts'; // O componente de gráfico

// --- Definição de Tipos ---
export type InterfaceWithDetails = NetworkInterface & {
  TransceiverReading: TransceiverReading[];
  InterfaceStats: InterfaceStats[];
  TransceiverModule: TransceiverModule[];
};

type DeviceWithDetails = Device & {
  NetworkInterface: InterfaceWithDetails[];
};

type SimpleDevice = {
  id: number;
  hostname: string;
};

type Props = {
  initialDevices: SimpleDevice[]; // Recebe a lista inicial do Server Component
};
// -------------------------

export default function PowerReportClient({ initialDevices }: Props) {
  // O estado 'devices' é inicializado com os dados do servidor
  const [devices] = useState<SimpleDevice[]>(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [deviceData, setDeviceData] = useState<DeviceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Este useEffect busca os DADOS DETALHADOS quando o usuário MUDA o select
  useEffect(() => {
    if (!selectedDeviceId) {
      setDeviceData(null);
      return;
    }

    setIsLoading(true);
    // Chama a API route que criamos
    fetch(`/api/devices/${selectedDeviceId}`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({deviceId: selectedDeviceId}),
        

    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch device data');
        return res.json();
      })
      .then((data) => {
        // Inverte os dados para ordem cronológica (API mandou 'desc')
        data.NetworkInterface.forEach((iface: InterfaceWithDetails) => {
          iface.TransceiverReading.reverse();
          iface.InterfaceStats.reverse();
        });
        setDeviceData(data);
      })
      .catch((err) => {
        console.error(err);
        setDeviceData(null);
      })
      .finally(() => setIsLoading(false));
  }, [selectedDeviceId]);

  return (
    <>
      {/* Seletor de Device */}
      <div className="mb-6">
        <label htmlFor="device-select" className="block text-sm font-medium text-gray-700">
          Selecione um Equipamento:
        </label>
        <select
          id="device-select"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)} // Interatividade
          className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">-- Selecione --</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.hostname}
            </option>
          ))}
        </select>
      </div>

      {/* Área de Gráficos */}
      {isLoading && <p>Carregando dados...</p>}

      {!isLoading && deviceData && (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold">
            {deviceData.hostname}
          </h2>
          {deviceData.NetworkInterface.length === 0 && (
            <p>Nenhuma interface encontrada para este equipamento.</p>
          )}

          {deviceData.NetworkInterface.map((iface) => (
            <PortCharts key={iface.id} interfaceData={iface} />
          ))}
        </div>
      )}
    </>
  );
}
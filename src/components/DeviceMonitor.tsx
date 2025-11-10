'use client'; // Esta linha é OBRIGATÓRIA para Client Components

import { useState, useEffect } from 'react';
import type {
  NetworkInterface,
  TransceiverReading,
  TransceiverModule,
  InterfaceStats

} from '@prisma/client';
//import type { SimpleDevice } from '../page'; // Importa o tipo da página

// Tipagem para o dado combinado que nossa API retorna
type InterfaceWithReading = NetworkInterface & {
  TransceiverReading: TransceiverReading[]; // Mesmo com take: 1, o Prisma retorna um array
  TransceiverModule: TransceiverModule[];
  InterfaceStats: InterfaceStats[]


};

// Props que o componente recebe
type DeviceMonitorProps = {
  initialDevices: any[];
};

export default function DeviceMonitor({ initialDevices }: DeviceMonitorProps) {
  // Não precisamos mais buscar os devices, eles vêm via props!
  const [interfaces, setInterfaces] = useState<InterfaceWithReading[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Efeito 1: Buscar interfaces quando um dispositivo é selecionado
  useEffect(() => {
    // Se nenhum dispositivo estiver selecionado, limpa a lista e retorna
    if (!selectedDeviceId) {
      setInterfaces([]);
      return;
    }

    async function fetchInterfaces() {
      setIsLoading(true);
      try {
        // Usa a nova rota de API
        const response = await fetch(`/api/devices/${selectedDeviceId}/interfaces`, {
          method: 'POST', // <-- USANDO POST,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({deviceId: selectedDeviceId}),
        });
        const data = await response.json();
        setInterfaces(data);
      } catch (error) {
        console.error('Erro ao buscar interfaces:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterfaces();
  }, [selectedDeviceId]); // Este efeito depende apenas do ID selecionado

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(e.target.value);
  };

  return (
    <div>
      {/* Seletor de Dispositivo */}
      <div className="mb-8">
        <label
          htmlFor="device-select"
          className="block text-sm font-medium text-gray-400 mb-2"
        >
          Selecione um Dispositivo:
        </label>
        <select
          id="device-select"
          value={selectedDeviceId}
          onChange={handleDeviceChange}
          className="w-full max-w-md p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Escolha um dispositivo --</option>
          {initialDevices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.hostname}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Interfaces */}
      <div>
        {isLoading && <p className="text-blue-400">Carregando interfaces...</p>}
        {!isLoading && selectedDeviceId && interfaces.length === 0 && (
          <p className="text-gray-500">
            Nenhuma interface encontrada para este dispositivo.
          </p>
        )}
        {!isLoading && interfaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interfaces.map((iface) => {
              // Pega a última leitura (deve ser a única no array)
              const latestReading = iface.TransceiverReading[0];
              const latestModule = iface.TransceiverModule[0]
              const InterfaceStats = iface.InterfaceStats[0]


              return (
                <div
                  key={iface.id}
                  className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700"
                >
                  <h3 className="text-lg font-semibold text-blue-400">
                    {iface.interface_name} {/* [cite: 6] */}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {iface.description || 'Sem descrição'} {/* [cite: 5] */}
                  </p>
                  
                  {latestReading  ? (
                    <div className={"space-y-2 text-sm"}>
                      <p>
                        <span className="font-medium text-gray-400">Última Leitura:</span>{' '}
                        {new Date(latestReading.timestamp).toLocaleString('pt-BR')} {/* [cite: 22] */}
                      </p>
                      <p>
                        <span className="font-medium text-gray-400">Temp:</span>{' '}
                        {latestReading.temperature ? `${latestReading.temperature}°C` : 'N/A'} {/* [cite: 22] */}
                      </p>
                      <p className={latestReading.rx_power ? "text-white": "text-gray-700"}>
                        <span className={"font-medium text-gray-400"}>RX Power:</span>{' '}
                        {latestReading.rx_power ? latestReading.rx_power+"dbm"  : "sem dados"} {/* [cite: 23] */}
                      </p>
                      <p>
                        <span className="font-medium text-gray-400">TX Power:</span>{' '}
                        {latestReading.tx_power+"dbm" || 'N/A'} {/* [cite: 24] */}
                        

                      </p>

                       <p>
                        <span className="font-medium text-gray-400">Modulo:</span>{' '}
                        {latestModule?.vendor_part_number || 'N/A'}
                        

                      </p>
                      <p>
                        <span className="font-medium text-gray-400">limiar superior</span>{' '}
                        {latestModule?.rx_power_high+"dbm" || 'N/A'}
                        

                      </p>
                       <p>
                        <span className="font-medium text-gray-400">limiar inferior</span>{' '}
                        {latestModule?.rx_power_low+"dbm" || 'N/A'}
                        

                      </p>
                      <p>
                        <span className="font-medium text-gray-400">erros de entrada</span>{' '}
                        {InterfaceStats?.in_errors || 'N/A'}
                        

                      </p>

                      <p>
                        <span className="font-medium text-gray-400">Erros de saida</span>{' '}
                        {InterfaceStats?.out_errors || 'N/A'}
                        

                      </p>
                      <p>
                        <span className="font-medium text-gray-400">Porcentagem de utilização upload</span>{' '}
                        {InterfaceStats?.out_uti+"%" || 'N/A'}
                        

                      </p>
                      <p>
                        <span className="font-medium text-gray-400">Porcentagem de utilização downlaod</span>{' '}
                        {InterfaceStats?.in_uti+"%"  || 'N/A'}
                        

                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Nenhum dado de transceiver encontrado.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
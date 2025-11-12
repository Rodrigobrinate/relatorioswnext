// components/PowerReportClient.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Device, NetworkInterface, TransceiverReading, InterfaceStats, TransceiverModule } from '@prisma/client';
import PortCharts from './PortCharts';

// --- Definição de Tipos ---
export type InterfaceWithDetails = NetworkInterface & {
  TransceiverReading: TransceiverReading[];
  InterfaceStats: InterfaceStats[];
  TransceiverModule: TransceiverModule[];
};
type DeviceWithDetails = Device & { NetworkInterface: InterfaceWithDetails[] };
type SimpleDevice = { id: number; hostname: string };
type Props = { initialDevices: SimpleDevice[] };
// -------------------------

// --- Definição das Séries de Dados (Exportadas) ---
export const SERIES_KEYS = {
  rx_power: 'RX Power',
  tx_power: 'TX Power',
  in_mbps: 'Tráfego In',
  out_mbps: 'Tráfego Out',
  in_errors_rate: 'Erros In',
  out_errors_rate: 'Erros Out',
  temperature: 'Temp',
  voltage: 'Volt',
  bias_current: 'Bias',
};
export type VisibleSeries = Record<keyof typeof SERIES_KEYS, boolean>;
export const initialSeriesState: VisibleSeries = Object.keys(SERIES_KEYS).reduce((acc, key) => {
  acc[key as keyof VisibleSeries] = true; // Começa com tudo visível
  return acc;
}, {} as VisibleSeries);
// --------------------------------------------------------

// --- Componente de Loading Spinner ---
function LoadingSpinner() {
  return (
    <div className="flex h-40 w-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
    </div>
  );
}

// --- Componente Reutilizável: ChartCard ---
function ChartCard({
  interfaceData,
  onAmplify,
  onClose,
}: {
  interfaceData: InterfaceWithDetails;
  onAmplify?: () => void;
  onClose?: () => void;
}) {
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>(initialSeriesState);

  const toggleSeries = (key: keyof VisibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-300 bg-white shadow-md">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div>
          <h3 className="text-lg font-medium text-indigo-700">{interfaceData.interface_name}</h3>
          <p className="text-sm text-gray-500">{interfaceData.description}</p>
        </div>
        {/* Botões de Ação (Ampliar ou Fechar) */}
        <div className="ml-4">
          {onAmplify && (
            <button
              onClick={onAmplify}
              title="Ampliar gráfico"
              className="text-gray-400 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25-6v4.5m0-4.5h-4.5m4.5 0L15 9" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Fechar"
              className="text-gray-400 hover:text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Botões de Filtro */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 p-2">
        {Object.entries(SERIES_KEYS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleSeries(key as keyof VisibleSeries)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              visibleSeries[key as keyof VisibleSeries]
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Gráficos */}
      <div className="flex-1 overflow-y-auto">
        <PortCharts
          interfaceData={interfaceData}
          visibleSeries={visibleSeries}
        />
      </div>
    </div>
  );
}

// --- Componente "Lazy Load" Wrapper ---
function LazyLoadChartCard({
  interfaceData,
  onAmplify,
}: {
  interfaceData: InterfaceWithDetails;
  onAmplify: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 200px 0px' }
    );
    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={placeholderRef} className="min-h-[500px]">
      {isVisible ? (
        <ChartCard interfaceData={interfaceData} onAmplify={onAmplify} />
      ) : (
        // Placeholder
        <div className="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <h3 className="text-lg font-medium text-indigo-700">{interfaceData.interface_name}</h3>
          <p className="text-sm text-gray-500">{interfaceData.description}</p>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Função auxiliar para formatar datas para o input datetime-local
 * (Formato: YYYY-MM-DDTHH:mm)
 */
const formatDateForInput = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};


// --- COMPONENTE PRINCIPAL (CLIENT) ---
export default function PowerReportClient({ initialDevices }: Props) {
  const [devices] = useState<SimpleDevice[]>(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [deviceData, setDeviceData] = useState<DeviceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInitialStartDate = () => new Date(Date.now() - 24 * 60 * 60 * 1000);
  const getInitialEndDate = () => new Date();
  const [startDate, setStartDate] = useState(formatDateForInput(getInitialStartDate()));
  const [endDate, setEndDate] = useState(formatDateForInput(getInitialEndDate()));

  // Estado para o Modal de Tela Cheia
  const [fullscreenData, setFullscreenData] = useState<InterfaceWithDetails | null>(null);

  // Lógica de busca de dados
  useEffect(() => {
    if (!selectedDeviceId || !startDate || !endDate) {
      setDeviceData(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/devices/${selectedDeviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: selectedDeviceId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch device data');
        return res.json();
      })
      .then((data) => {
        data.NetworkInterface.sort((a: InterfaceWithDetails, b: InterfaceWithDetails) => {
          const aHasDesc = !!a.description;
          const bHasDesc = !!b.description;
          if (aHasDesc && !bHasDesc) return -1;
          if (!aHasDesc && bHasDesc) return 1;
          return 0;
        });
        setDeviceData(data);
      })
      .catch((err) => {
        console.error(err);
        setDeviceData(null);
      })
      .finally(() => setIsLoading(false));
  }, [selectedDeviceId, startDate, endDate]);

  return (
    <>
      {/* Seletor de Device e Datas */}
      <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <label htmlFor="device-select" className="block text-sm font-medium text-gray-700">
            Selecione um Equipamento:
          </label>
          <select
            id="device-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
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

        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Data Início:
            </label>
            <input
              type="datetime-local"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              Data Fim:
            </label>
            <input
              type="datetime-local"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Área de Gráficos */}
      {isLoading && <LoadingSpinner />}
      {!isLoading && deviceData && (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold">
            {deviceData.hostname}
          </h2>
          {deviceData.NetworkInterface.length === 0 && (
            <p>Nenhuma interface ou dados encontrados para este equipamento no período selecionado.</p>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {deviceData.NetworkInterface.map((iface) => (
              <LazyLoadChartCard
                key={iface.id}
                interfaceData={iface}
                onAmplify={() => setFullscreenData(iface)}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL DE TELA CHEIA --- */}
      {fullscreenData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setFullscreenData(null)}
        >
          <div 
            className="h-[90vh] w-full max-w-7xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ChartCard
              interfaceData={fullscreenData}
              onClose={() => setFullscreenData(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
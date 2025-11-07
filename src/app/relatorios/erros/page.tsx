// app/relatorios/erros/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { InterfaceStats } from '@prisma/client'; // Importe o tipo
import { Server, Cable } from 'lucide-react'; // Ícones

// Tipo da API Top 20 (do seu dashboard)
type ErrorRateData = {
  interfaceId: number;
  interfaceName: string;
  deviceName: string;
  totalErrorRate: number;
};

// Tipo da nossa nova API de stats
type InterfaceDetails = {
  interface_name: string;
  description: string | null;
  Device: {
    hostname: string;
  };
};

type ChartData = {
  stats: InterfaceStats[];
  details: InterfaceDetails;
};

// --- Componente de Gráfico ---
const ErrorChart = ({ data, details }: { data: InterfaceStats[]; details: InterfaceDetails }) => {
  
  // O BigInt vem como string da API (graças ao patch). Convertemos para Número.
  const chartData = data.map(stat => ({
    ...stat,
    timestamp: new Date(stat.timestamp).getTime(), // Recharts prefere timestamp
    in_errors: Number(stat.in_errors),
    out_errors: Number(stat.out_errors),
  }));

  const formatXAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatTooltipLabel = (label: number) => {
     return new Date(label).toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {details.Device.hostname}
      </h2>
      <h3 className="text-lg text-blue-600 dark:text-blue-400">
        {details.interface_name}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 italic">
        {details.description}
      </p>

      <h4 className="font-semibold mb-4">Histórico de Erros (Últimas 288 leituras)</h4>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            fontSize={12}
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis fontSize={12} />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={(value: number, name: string) => [value.toLocaleString('pt-BR'), name === 'in_errors' ? 'Erros In' : 'Erros Out']}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="in_errors"
            name="Erros In"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="out_errors"
            name="Erros Out"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.3}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Página Principal ---
export default function ErrorReportPage() {
  const [topInterfaces, setTopInterfaces] = useState<ErrorRateData[]>([]);
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // 1. Busca a lista do "Top 20" ao carregar a página
  useEffect(() => {
    setIsLoadingList(true);
    fetch('/api/dashboards/error-rate',)
      .then((res) => res.json())
      .then((data) => {
        setTopInterfaces(data);
      })
      .catch((err) => console.error("Falha ao buscar top 20:", err))
      .finally(() => setIsLoadingList(false));
  }, []);

  // 2. Busca o histórico de erros QUANDO o usuário clica em uma interface
  useEffect(() => {
    if (selectedInterfaceId === null) return;

    setIsLoadingChart(true);
    setChartData(null); // Limpa o gráfico anterior

    fetch(`/api/interfaces/${selectedInterfaceId}/stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({interfaceId: selectedInterfaceId}),
    }
      )
      .then((res) => res.json())
      .then((data) => {
        setChartData(data);
      })
      .catch((err) => console.error("Falha ao buscar stats da interface:", err))
      .finally(() => setIsLoadingChart(false));

  }, [selectedInterfaceId]); // Re-executa quando `selectedInterfaceId` muda

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
        Relatório de Gráficos de Erro
      </h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Coluna da Esquerda: Lista do Top 20 */}
        <aside className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Top 20 Interfaces
            </h2>
            {isLoadingList ? (
              <p className="text-gray-500">Carregando lista...</p>
            ) : (
              <ul className="space-y-2">
                {topInterfaces?.map((iface, index) => (
                  <li
                    key={iface.interfaceId}
                    onClick={() => setSelectedInterfaceId(iface.interfaceId)}
                    className={`p-3 rounded-lg cursor-pointer transition-all 
                                ${selectedInterfaceId === iface.interfaceId
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">#{index + 1}</span>
                      <span className="py-0.5 px-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-bold">
                        {iface.totalErrorRate.toFixed(0)} erros/coleta
                      </span>
                    </div>
                    <p className="font-semibold truncate text-sm mt-1" title={iface.deviceName}>
                      <Server className="w-4 h-4 inline -mt-1 mr-1.5 opacity-70"/>
                      {iface.deviceName}
                    </p>
                    <p className="truncate text-xs opacity-90" title={iface.interfaceName}>
                      <Cable className="w-4 h-4 inline -mt-1 mr-1.5 opacity-70"/>
                      {iface.interfaceName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Coluna da Direita: O Gráfico */}
        <main className="w-full md:w-2/3 lg:w-3/4">
          {selectedInterfaceId === null && !isLoadingChart && (
            <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10">
              <p className="text-xl text-gray-500">
                ← Selecione uma interface da lista para ver o gráfico.
              </p>
            </div>
          )}
          
          {isLoadingChart && (
            <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10">
              <p className="text-xl text-gray-500">Carregando gráfico...</p>
            </div>
          )}

          {chartData && !isLoadingChart && (
            <ErrorChart data={chartData.stats} details={chartData.details} />
          )}
        </main>
      </div>
    </div>
  );
}
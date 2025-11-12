// components/PortCharts.tsx
"use client";

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush, // Importa o Brush
} from 'recharts';
// Importa os tipos do Client Component
import type { InterfaceWithDetails, VisibleSeries } from './PowerReportClient';

// --- PROPS ATUALIZADAS ---
type Props = {
  interfaceData: InterfaceWithDetails;
  visibleSeries: VisibleSeries; // <-- Recebe o estado do filtro
};

// --- Funções Auxiliares ---
const formatXAxis = (tickItem: string) => {
  const date = new Date(tickItem);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatTooltipLabel = (label: string) => {
  return new Date(label).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

const parseValue = (val: any) => {
  if (val === null || val === undefined) return undefined;
  const num = parseFloat(String(val));
  return isNaN(num) ? undefined : num;
};
// --- FIM Funções Auxiliares ---


// --- FUNÇÃO DE FORMATAÇÃO DE DADOS ---
const formatChartData = (interfaceData: InterfaceWithDetails) => {
  const dataMap = new Map<number, any>();
  const timestampFormat = { hour: '2-digit', minute: '2-digit' } as const;

  // 1. Processar Leituras de Potência e Sensores (Gauges)
  interfaceData.TransceiverReading.forEach((r) => {
    const timestamp = new Date(r.timestamp).getTime();
    dataMap.set(timestamp, {
      ...dataMap.get(timestamp),
      timestamp: timestamp,
      timestampLabel: new Date(timestamp).toLocaleTimeString('pt-BR', timestampFormat),
      rx_power: parseValue(r.rx_power),
      tx_power: parseValue(r.tx_power),
      temperature: parseValue(r.temperature),
      voltage: parseValue(r.voltage),
      bias_current: parseValue(r.bias_current),
    });
  });

  // 2. Processar Estatísticas (Counters)
  const sortedStats = [...interfaceData.InterfaceStats].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 1; i < sortedStats.length; i++) {
    const curr = sortedStats[i];
    const prev = sortedStats[i - 1];

    const currTime = new Date(curr.timestamp).getTime();
    const prevTime = new Date(prev.timestamp).getTime();
    const timeDeltaSeconds = (currTime - prevTime) / 1000;

    if (timeDeltaSeconds <= 0) continue;

    const getDelta = (currVal: any, prevVal: any): number => {
      const currNum = parseValue(currVal);
      const prevNum = parseValue(prevVal);
      if (currNum === undefined || prevNum === undefined) return 0;
      const delta = currNum - prevNum;
      return delta < 0 ? 0 : delta; // Ignora resets de contador
    };

    const inOctetDelta = getDelta(curr.in_octets, prev.in_octets);
    const outOctetDelta = getDelta(curr.out_octets, prev.out_octets);
    const inErrorDelta = getDelta(curr.in_errors, prev.in_errors);
    const outErrorDelta = getDelta(curr.out_errors, prev.out_errors);

    const in_mbps = (inOctetDelta * 8) / timeDeltaSeconds / 1000000;
    const out_mbps = (outOctetDelta * 8) / timeDeltaSeconds / 1000000;
    const in_errors_rate = inErrorDelta / timeDeltaSeconds;
    const out_errors_rate = outErrorDelta / timeDeltaSeconds;

    dataMap.set(currTime, {
      ...dataMap.get(currTime),
      timestamp: currTime,
      timestampLabel: new Date(currTime).toLocaleTimeString('pt-BR', timestampFormat),
      in_mbps: in_mbps,
      out_mbps: out_mbps,
      in_errors_rate: in_errors_rate,
      out_errors_rate: out_errors_rate,
    });
  }
  
  return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
};
// --- FIM FUNÇÃO DE FORMATAÇÃO ---


// --- COMPONENTE DO TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedLabel = formatTooltipLabel(label);
    const data = payload.reduce((acc: any, item: any) => {
      if (item.dataKey && item.value !== null && item.value !== undefined) {
        acc[item.dataKey] = { value: item.value, color: item.color, name: item.name };
      }
      return acc;
    }, {});
    
    const visibleData = Object.keys(data).length;

    if (visibleData === 0) {
      return (
         <div className="p-3 bg-white border border-gray-300 rounded-md shadow-lg">
           <p className="font-semibold text-sm text-gray-800 mb-2">{formattedLabel}</p>
           <p className="text-sm text-gray-500">Nenhuma série selecionada.</p>
         </div>
      );
    }

    return (
      <div className="p-3 bg-white border border-gray-300 rounded-md shadow-lg">
        <p className="font-semibold text-sm text-gray-800 mb-2">{formattedLabel}</p>
        <div className="space-y-1 text-sm">
          {data.rx_power && <p style={{ color: data.rx_power.color }}>{data.rx_power.name}: <strong>{data.rx_power.value.toFixed(2)} dBm</strong></p>}
          {data.tx_power && <p style={{ color: data.tx_power.color }}>{data.tx_power.name}: <strong>{data.tx_power.value.toFixed(2)} dBm</strong></p>}
          {data.in_mbps && <p style={{ color: data.in_mbps.color }}>{data.in_mbps.name}: <strong>{data.in_mbps.value.toFixed(2)} Mbps</strong></p>}
          {data.out_mbps && <p style={{ color: data.out_mbps.color }}>{data.out_mbps.name}: <strong>{data.out_mbps.value.toFixed(2)} Mbps</strong></p>}
          {data.in_errors_rate && <p style={{ color: data.in_errors_rate.color }}>{data.in_errors_rate.name}: <strong>{data.in_errors_rate.value.toFixed(2)} err/s</strong></p>}
          {data.out_errors_rate && <p style={{ color: data.out_errors_rate.color }}>{data.out_errors_rate.name}: <strong>{data.out_errors_rate.value.toFixed(2)} err/s</strong></p>}
          {data.temperature && <p style={{ color: data.temperature.color }}>{data.temperature.name}: <strong>{data.temperature.value.toFixed(2)} °C</strong></p>}
          {data.voltage && <p style={{ color: data.voltage.color }}>{data.voltage.name}: <strong>{data.voltage.value.toFixed(2)} V</strong></p>}
          {data.bias_current && <p style={{ color: data.bias_current.color }}>{data.bias_current.name}: <strong>{data.bias_current.value.toFixed(2)} mA</strong></p>}
        </div>
      </div>
    );
  }
  return null;
};
// --- FIM TOOLTIP ---


// --- COMPONENTE PRINCIPAL DO GRÁFICO ---
export default function PortCharts({ interfaceData, visibleSeries }: Props) {
  
  const chartData = useMemo(() => formatChartData(interfaceData), [interfaceData]);
  const moduleInfo = interfaceData.TransceiverModule[0];
  
  const hasPowerData = chartData.some(d => d.rx_power !== undefined || d.tx_power !== undefined);
  const hasTrafficData = chartData.some(d => d.in_mbps !== undefined || d.out_mbps !== undefined);
  const hasErrorData = chartData.some(d => d.in_errors_rate !== undefined || d.out_errors_rate !== undefined);
  const hasSensorData = chartData.some(d => d.temperature !== undefined || d.voltage !== undefined || d.bias_current !== undefined);

  return (
    <div className="p-4 space-y-8">

      {/* --- Gráfico 1: Potência Óptica (dBm) --- */}
      {hasPowerData ? (
        <div>
          <h4 className="font-semibold text-sm mb-2">Potência Óptica (dBm)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestampLabel" fontSize={12} />
              <YAxis domain={[-30, 5]} allowDataOverflow={true} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="rx_power" name="RX Power" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} activeDot={{ r: 6 }} connectNulls hide={!visibleSeries.rx_power} />
              <Area type="monotone" dataKey="tx_power" name="TX Power" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} activeDot={{ r: 6 }} connectNulls hide={!visibleSeries.tx_power} />
              {moduleInfo && (
                <>
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_low_warning)} label={{ value: 'RX Low Warn', position: 'insideLeft', fill: 'orange', fontSize: 10 }} stroke="orange" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_low)} label={{ value: 'RX Low Alarm', position: 'insideLeft', fill: 'red', fontSize: 10 }} stroke="red" strokeDasharray="3 3" />
                </>
              )}
              <Brush dataKey="timestampLabel" height={30} stroke="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Sem dados de potência (DDM) para esta interface.</p>
      )}

      {/* --- Gráfico 2: Tráfego de Interface (Mbps) --- */}
      {hasTrafficData && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Tráfego de Interface (Mbps)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestampLabel" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="in_mbps" name="Tráfego In" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} connectNulls hide={!visibleSeries.in_mbps} />
              <Area type="monotone" dataKey="out_mbps" name="Tráfego Out" stroke="#f97316" fill="#f97316" fillOpacity={0.3} connectNulls hide={!visibleSeries.out_mbps} />
              <Brush dataKey="timestampLabel" height={30} stroke="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Gráfico 3: Taxa de Erros (err/s) --- */}
      {hasErrorData && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Taxa de Erros (erros/seg)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestampLabel" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="in_errors_rate" name="Erros In (err/s)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} connectNulls hide={!visibleSeries.in_errors_rate} />
              <Area type="monotone" dataKey="out_errors_rate" name="Erros Out (err/s)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} connectNulls hide={!visibleSeries.out_errors_rate} />
              <Brush dataKey="timestampLabel" height={30} stroke="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Gráfico 4: Medições do Transceiver --- */}
      {hasSensorData && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Medições do Transceiver</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestampLabel" fontSize={12} />
              <YAxis yAxisId="temp" stroke="#e11d48" fontSize={12} />
              <YAxis yAxisId="volt" orientation="right" stroke="#d97706" fontSize={12} />
              <YAxis yAxisId="bias" orientation="right" stroke="#0284c7" fontSize={12} mirror={true} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#e11d48" dot={false} connectNulls activeDot={{ r: 6 }} hide={!visibleSeries.temperature} />
              <Line yAxisId="volt" type="monotone" dataKey="voltage" name="Volt (V)" stroke="#d97706" dot={false} connectNulls activeDot={{ r: 6 }} hide={!visibleSeries.voltage} />
              <Line yAxisId="bias" type="monotone" dataKey="bias_current" name="Bias (mA)" stroke="#0284c7" dot={false} connectNulls activeDot={{ r: 6 }} hide={!visibleSeries.bias_current} />
              {moduleInfo && (
                <>
                  <ReferenceLine y={parseValue(moduleInfo.temp_high)} yAxisId="temp" stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.temp_low)} yAxisId="temp" stroke="red" strokeDasharray="3 3" />
                </>
              )}
              <Brush dataKey="timestampLabel" height={30} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
// components/PortCharts.tsx
"use client";

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
  TooltipProps, // Importamos os tipos do Tooltip
} from 'recharts';
import type { InterfaceWithDetails } from './PowerReportClient';

type Props = {
  interfaceData: InterfaceWithDetails;
};

// --- Funções Auxiliares ---

// Formata o eixo X (Tempo)
const formatXAxis = (tickItem: string) => {
  const date = new Date(tickItem);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Formata a Data/Hora completa para o Tooltip
const formatTooltipLabel = (label: string) => {
  return new Date(label).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Converte o valor para número (necessário para as linhas de referência)
const parseValue = (val: number | null | undefined) => {
  if (val === null || val === undefined) return null;
  return Number(val);
};

// --- COMPONENTE DO TOOLTIP PERSONALIZADO ---
// Este componente cria aquela "caixa" de informações ao passar o mouse
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // 'label' é o valor do eixo X (timestamp)
    const formattedLabel = formatTooltipLabel(label);

    // 'payload' é um array com os dados de cada linha/área
    const data = payload.reduce((acc, item) => {
      // item.dataKey é o nome da 'dataKey' (ex: 'rx_power')
      // item.value é o valor
      // item.color é a cor que definimos
      if (item.dataKey && item.value !== null) {
        acc[item.dataKey] = {
          value: item.value,
          color: item.color,
          name: item.name, // Nome da legenda (ex: "RX Power")
        };
      }
      return acc;
    }, {} as Record<string, { value: number; color: string; name: string }>);

    return (
      <div className="p-3 bg-white border border-gray-300 rounded-md shadow-lg">
        <p className="font-semibold text-sm text-gray-800 mb-2">{formattedLabel}</p>
        <div className="space-y-1">
          {data.rx_power && (
            <p style={{ color: data.rx_power.color }}>
              {data.rx_power.name}: <strong>{data.rx_power.value.toFixed(2)} dBm</strong>
            </p>
          )}
          {data.tx_power && (
            <p style={{ color: data.tx_power.color }}>
              {data.tx_power.name}: <strong>{data.tx_power.value.toFixed(2)} dBm</strong>
            </p>
          )}
          {data.in_errors && (
            <p style={{ color: data.in_errors.color }}>
              {data.in_errors.name}: <strong>{data.in_errors.value}</strong>
            </p>
          )}
          {data.out_errors && (
            <p style={{ color: data.out_errors.color }}>
              {data.out_errors.name}: <strong>{data.out_errors.value}</strong>
            </p>
          )}
          {data.temperature && (
            <p style={{ color: data.temperature.color }}>
              {data.temperature.name}: <strong>{data.temperature.value.toFixed(2)} °C</strong>
            </p>
          )}
           {data.voltage && (
            <p style={{ color: data.voltage.color }}>
              {data.voltage.name}: <strong>{data.voltage.value.toFixed(2)} V</strong>
            </p>
          )}
           {data.bias_current && (
            <p style={{ color: data.bias_current.color }}>
              {data.bias_current.name}: <strong>{data.bias_current.value.toFixed(2)} mA</strong>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};


// --- COMPONENTE PRINCIPAL DO GRÁFICO DA PORTA ---
export default function PortCharts({ interfaceData }: Props) {
  // Pega os dados mais recentes do módulo para os limites de alarme
  const moduleInfo = interfaceData.TransceiverModule[0];
  
  // Combina todos os dados em um só array para o Tooltip
  // (Isso assume que 'readings' e 'stats' têm timestamps alinhados, 
  // o que é provável. Se não, o tooltip pode mostrar dados de momentos ligeiramente diferentes)
  const combinedData = [...interfaceData.TransceiverReading, ...interfaceData.InterfaceStats]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
  // Dados de potência
  const powerReadings = interfaceData.TransceiverReading;
  const hasPowerData = powerReadings.some(r => r.rx_power !== null || r.tx_power !== null);

  // Dados de erros
  const errorStats = interfaceData.InterfaceStats;
  const hasErrorData = errorStats.some(s => s.in_errors !== null || s.out_errors !== null);

  // Dados de medições
  const hasSensorData = powerReadings.some(r => r.temperature !== null || r.voltage !== null || r.bias_current !== null);

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white space-y-8">
      <div>
        <h3 className="text-lg font-medium text-indigo-700">
          {interfaceData.interface_name}
        </h3>
        <p className="text-sm text-gray-500">{interfaceData.description}</p>
      </div>

      {/* --- Gráfico 1: Potência Óptica (dBm) --- */}
      {hasPowerData ? (
        <div>
          <h4 className="font-semibold text-sm mb-2">Potência Óptica (dBm)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={powerReadings} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatXAxis} fontSize={12} />
              <YAxis domain={[-30, 5]} allowDataOverflow={true} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Áreas de Dados */}
              <Area type="monotone" dataKey="rx_power" name="RX Power" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} activeDot={{ r: 6 }} connectNulls />
              <Area type="monotone" dataKey="tx_power" name="TX Power" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} activeDot={{ r: 6 }} connectNulls />

              {/* Linhas de Referência (Alarmes e Avisos) */}
              {moduleInfo && (
                <>
                  {/* RX */}
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_high)} label={{ value: 'RX High Alarm', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_low)} label={{ value: 'RX Low Alarm', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_high_warning)} label={{ value: 'RX High Warn', position: 'right', fill: 'orange' }} stroke="orange" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.rx_power_low_warning)} label={{ value: 'RX Low Warn', position: 'right', fill: 'orange' }} stroke="orange" strokeDasharray="3 3" />
                  {/* TX */}
                  <ReferenceLine y={parseValue(moduleInfo.tx_power_high)} label={{ value: 'TX High Alarm', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.tx_power_low)} label={{ value: 'TX Low Alarm', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.tx_power_high_warning)} label={{ value: 'TX High Warn', position: 'right', fill: 'orange' }} stroke="orange" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.tx_power_low_warning)} label={{ value: 'TX Low Warn', position: 'right', fill: 'orange' }} stroke="orange" strokeDasharray="3 3" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Sem dados de potência (DDM) para esta interface.</p>
      )}

      {/* --- Gráfico 2: Erros de Interface --- */}
      {hasErrorData && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Erros de Interface (Contador)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={errorStats} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatXAxis} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="in_errors" name="Erros In" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} connectNulls />
              <Area type="monotone" dataKey="out_errors" name="Erros Out" stroke="#f97316" fill="#f97316" fillOpacity={0.3} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Gráfico 3: Medições do Transceiver (Temp, Voltagem, Bias) --- */}
      {hasSensorData && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Medições do Transceiver</h4>
          <ResponsiveContainer width="100%" height={300}>
            {/* Usamos LineChart aqui, pois as unidades são diferentes */}
            <LineChart data={powerReadings} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatXAxis} fontSize={12} />
              
              {/* Múltiplos Eixos Y: Um para cada unidade (C, V, mA) */}
              <YAxis yAxisId="temp" stroke="#e11d48" fontSize={12} />
              <YAxis yAxisId="volt" orientation="right" stroke="#d97706" fontSize={12} />
              <YAxis yAxisId="bias" orientation="right" stroke="#0284c7" fontSize={12} mirror={true} />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Linhas de Dados */}
              <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#e11d48" dot={false} connectNulls activeDot={{ r: 6 }} />
              <Line yAxisId="volt" type="monotone" dataKey="voltage" name="Volt (V)" stroke="#d97706" dot={false} connectNulls activeDot={{ r: 6 }} />
              <Line yAxisId="bias" type="monotone" dataKey="bias_current" name="Bias (mA)" stroke="#0284c7" dot={false} connectNulls activeDot={{ r: 6 }} />
              
              {/* Linhas de Referência */}
              {moduleInfo && (
                <>
                  {/* Temp */}
                  <ReferenceLine y={parseValue(moduleInfo.temp_high)} yAxisId="temp" label={{ value: 'Temp High', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.temp_low)} yAxisId="temp" label={{ value: 'Temp Low', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  {/* Volt */}
                  <ReferenceLine y={parseValue(moduleInfo.volt_high)} yAxisId="volt" label={{ value: 'Volt High', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.volt_low)} yAxisId="volt" label={{ value: 'Volt Low', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  {/* Bias */}
                  <ReferenceLine y={parseValue(moduleInfo.bias_high)} yAxisId="bias" label={{ value: 'Bias High', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                  <ReferenceLine y={parseValue(moduleInfo.bias_low)} yAxisId="bias" label={{ value: 'Bias Low', position: 'right', fill: 'red' }} stroke="red" strokeDasharray="3 3" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
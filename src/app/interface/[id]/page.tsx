// src/app/interface/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import {
  Loader2,
  AlertTriangle,
  LineChart as IconLineChart,
  Calendar,
} from 'lucide-react';

// ==========================================================
// 1. ATUALIZAÇÃO NO TOOLTIP (PARA MOSTRAR DATA E HORA)
// ==========================================================
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // 'label' agora é um timestamp numérico (ex: 1678886400000)
    // Vamos formatá-lo para uma data/hora legível
    const formattedLabel = new Date(label).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const downloadData = payload.find((p: any) => p.dataKey === 'Download');
    const uploadData = payload.find((p: any) => p.dataKey === 'Upload');
    const totalData = payload.find((p: any) => p.dataKey === 'Total');

    return (
      <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl text-sm">
        {/* AQUI ESTÁ A MUDANÇA */}
        <p className="font-bold text-gray-900 dark:text-white mb-2">{`Data: ${formattedLabel}`}</p>
        <div className="space-y-1">
          {downloadData && (
            <p style={{ color: downloadData.color }} className="font-medium">
              {`Download: ${downloadData.value.toFixed(2)}%`}
            </p>
          )}
          {uploadData && (
            <p style={{ color: uploadData.color }} className="font-medium">
              {`Upload: ${uploadData.value.toFixed(2)}%`}
            </p>
          )}
        </div>
        {totalData && (
          <div className="mt-2 pt-2 border-t border-gray-400 dark:border-gray-600">
            <p style={{ color: totalData.color }} className="font-semibold">
              {`Total: ${totalData.value.toFixed(2)}%`}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// ... (postFetcher continua o mesmo) ...
const postFetcher = async (key: [string, string, Date, Date]) => {
  const [url, interfaceId, startDate, endDate] = key;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: interfaceId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });
  if (!res.ok) {
    const error = new Error('Falha ao buscar dados (POST)');
    // @ts-ignore
    error.info = await res.json();
    // @ts-ignore
    error.status = res.status;
    throw error;
  }
  return res.json();
};

type InterfaceStat = {
  timestamp: string;
  in_uti: number | null;
  out_uti: number | null;
};

export default function InterfaceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const hostname = searchParams.get('hostname') || 'Carregando...';
  const iface = searchParams.get('iface') || '';

  const [endDate, setEndDate] = useState(new Date()) as any
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 60 * 60 * 1000)
  ) as any

  const { data, error, isLoading } = useSWR<InterfaceStat[]>(
    id ? ['/api/interface-stats', id, startDate, endDate] : null,
    postFetcher
  );

  // ==========================================================
  // 2. ATUALIZAÇÃO NO CHARTDATA (PASSAR O TIMESTAMP NUMÉRICO)
  // ==========================================================
  const chartData = data?.map((stat) => {
    const download = stat.in_uti ?? 0;
    const upload = stat.out_uti ?? 0;
    const total = download + upload;

    return {
      // Em vez de 'time: "HH:mm"', passamos o timestamp numérico
      timestamp: new Date(stat.timestamp).getTime(), // <--- MUDANÇA
      Download: download,
      Upload: upload,
      Total: total,
    };
  });

  // Função para formatar o Eixo X
  // Verifica se o período selecionado é maior que um dia
  const isMultiDay =
    endDate.getTime() - startDate.getTime() > 24 * 60 * 60 * 1000;

  const formatXAxis = (unixTime: number) => {
    const date = new Date(unixTime);
    // Se for multi-dia, mostra "DD/MM HH:mm"
    if (isMultiDay) {
      return date.toLocaleTimeString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // Se for um dia só, mostra apenas "HH:mm"
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (isLoading && !data) {
      /* ... (Loading) ... */
    }
    if (error) {
      /* ... (Error) ... */
    }
    if (!chartData || chartData.length === 0) {
      /* ... (Sem Dados) ... */
    }

    // ==========================================================
    // 3. ATUALIZAÇÃO NO GRÁFICO (EIXO X E BRUSH)
    // ==========================================================
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="timestamp" // <--- MUDANÇA
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            type="number" // <--- MUDANÇA (Eixo é numérico)
            domain={['dataMin', 'dataMax']} // <--- MUDANÇA
            tickFormatter={formatXAxis} // <--- MUDANÇA (Usa nosso formatador)
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          <Line
            type="monotone"
            dataKey="Download"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Upload"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            strokeDasharray="3 3"
          />

          <Brush
            dataKey="timestamp" // <--- MUDANÇA
            height={30}
            stroke="#3b82f6"
            fill="#f1f5f9"
            // @ts-ignore
            darkFill="#334155"
            tickFormatter={formatXAxis} // <--- MUDANÇA
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // O resto do JSX (return) continua o mesmo
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      {/* ... (Título da Página) ... */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
          {hostname}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 truncate">
          {iface}
        </p>
      </div>

      {/* ... (Seletores de Data/Hora) ... */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Selecionar Período
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data/Hora Inicial
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: any) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              showTimeSelect
              dateFormat="Pp"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data/Hora Final
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date: any) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              showTimeSelect
              dateFormat="Pp"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* ... (Card do Gráfico) ... */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Histórico de Uso
        </h2>
        {/* Renderiza os estados de erro/loading/etc */}
        {isLoading && !data && (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex flex-col justify-center items-center h-[400px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-red-700 dark:text-red-300 font-semibold">
              Erro ao carregar os dados.
            </p>
            <p className="text-red-500 dark:text-red-400 text-sm">
              A requisição à API falhou.
            </p>
          </div>
        )}
        {!isLoading &&
          !error &&
          (!chartData || chartData.length === 0) && (
            <div className="flex flex-col justify-center items-center h-[400px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <IconLineChart className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Sem dados de estatísticas.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Não há dados para exibir no período selecionado.
              </p>
            </div>
          )}
        {/* Renderiza o gráfico principal */}
        {!isLoading && !error && chartData && chartData.length > 0 && (
          renderContent()
        )}
      </div>
    </div>
  );
}
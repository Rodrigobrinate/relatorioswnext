'use client'; // Necessário para usar hooks como o useSWR

import useSWR from 'swr';
import {
  Wifi,
  ArrowDown,
  ArrowUp,
  Loader2,
  AlertTriangle,
  Sigma,
} from 'lucide-react';
import type { TopInterfaceData } from '../api/top-interfaces/route';
import Link from 'next/link';
// 1. Importar o hook de animação
import { useAutoAnimate } from '@formkit/auto-animate/react';

// Função helper para o SWR buscar os dados
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Componente da Barra de Utilização (para o design amigável)
const UsageBar = ({ percentage }: { percentage: number }) => {
  let barColor = 'bg-green-500'; // Cor padrão (baixo uso)

  if (percentage > 75) {
    barColor = 'bg-red-500'; // Uso crítico
  } else if (percentage > 50) {
    barColor = 'bg-yellow-500'; // Uso alto
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className={`${barColor} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

// 2. Adicionado o componente de barra para o Total
// (Como solicitado na sua penúltima mensagem)
const TotalUsageBar = ({ percentage }: { percentage: number }) => {
  let barColor = 'bg-green-500'; // Cor padrão

  if (percentage > 90) {
    barColor = 'bg-red-500'; // Uso crítico (limite diferente)
  } else if (percentage > 70) {
    barColor = 'bg-yellow-500'; // Uso alto
  }

  // Limita a largura VISUAL em 100% para não quebrar o layout
  const visualPercentage = Math.min(percentage, 100);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className={`${barColor} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${visualPercentage}%` }}
      ></div>
    </div>
  );
};

// Componente do Card de Interface
const InterfaceCard = ({ data }: { data: TopInterfaceData }) => {
  const inUti = data.in_uti ?? 0;
  const outUti = data.out_uti ?? 0;
  const totalUti = inUti + outUti;

  return (
    // 3. MUDANÇA: de <li> para <div> para corrigir o HTML
    // Adicionado 'h-full' para garantir que todos os cards na grade tenham a mesma altura
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            {data.hostname}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {data.vendor}
        </span>
      </div>
      <p
        className="text-md text-gray-700 dark:text-gray-300 mb-4 truncate"
        title={data.interface_name}
      >
        {data.interface_name}
        <br />
        {data.description}
      </p>

      {/* Seção de Download (in_uti) */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ArrowDown className="w-4 h-4 text-green-500" />
            Download (IN)
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {inUti.toFixed(2)}%
          </span>
        </div>
        <UsageBar percentage={inUti} />
      </div>

      {/* Seção de Upload (out_uti) */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ArrowUp className="w-4 h-4 text-orange-500" />
            Upload (OUT)
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {outUti.toFixed(2)}%
          </span>
        </div>
        <UsageBar percentage={outUti} />
      </div>

      {/* 4. Seção de Agregação (Total) COM a barra */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Sigma className="w-4 h-4 text-purple-500" />
            Total (IN + OUT)
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {totalUti.toFixed(2)}%
          </span>
        </div>
        {/* Adicionada a barra de progresso para o Total */}
        <TotalUsageBar percentage={totalUti} />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-right">
        Última leitura: {new Date(data.last_stat_time).toLocaleTimeString()}
      </p>
    </div>
  );
};

// Componente da Página Principal
export default function TopBandwidthPage() {
  const { data, error, isLoading } = useSWR<TopInterfaceData[]>(
    '/api/top-interfaces',
    fetcher,
    {
      // Atualiza os dados a cada 10 segundos
      refreshInterval: 10000,
    }
  );

  // 5. Chamar o hook de animação
  const [animationParent] = useAutoAnimate<HTMLUListElement>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Top Consumo de Banda
      </h1>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Erro ao carregar os dados. Tente novamente mais tarde.</span>
        </div>
      )}

      {data && (
        // 6. Aplicar a 'ref' da animação ao <ul>
        // E corrigir a estrutura do map para <ul> > <li> > <Link> > <div>
        <ul
          // MUDANÇA AQUI: Trocamos o grid fixo por um grid fluido
          // "repeat(auto-fit, minmax(24rem, 1fr))" cria o máximo de colunas possíveis
          // que tenham no MÍNIMO 24rem (384px), e elas crescem para preencher o espaço (1fr).
          // "justify-items-center" centraliza os cards se a célula do grid for maior que o max-w-md.
          className="grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] gap-6 justify-items-center"
          ref={animationParent}
        >
          {data?.map((iface) => (
            // A key agora está no <li>, o item de lista real
            // MUDANÇA AQUI: Adicionamos w-full e o max-w-md solicitado.
            <li
              key={iface.interfaceId}
              className="block rounded-lg w-full max-w-md"
            >
              <Link
                href={`/interface/${iface.interfaceId}?hostname=${encodeURIComponent(
                  iface.hostname
                )}&iface=${encodeURIComponent(iface.interface_name)}`}
                target="_blank" // Abre em nova aba
                rel="noopener noreferrer"
                className="block h-full" // Faz o link preencher o <li>
              >
                <InterfaceCard data={iface} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
          <p>Nenhuma interface com dados de utilização encontrados.</p>
        </div>
      )}
    </div>
  );
}
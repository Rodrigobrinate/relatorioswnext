// app/dashboards/erros/page.tsx
"use client";

import { useState, useEffect } from 'react';
// NOVAS IMPORTAÇÕES
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
// NOSSOS ÍCONES
import {
  Server,
  Cable,
  Clock,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

// TIPO ATUALIZADO
type ErrorRateData = {
  interfaceId: number;
  interfaceName: string;
  interfaceDescription: string | null;
  deviceName: string;
  deviceIp: string;
  inErrorRate: number;
  outErrorRate: number;
  totalErrorRate: number;
  lastReadTimestamp: Date;
  totalErrorCount: number; // <-- ADICIONADO
};

// --- Função getRankStyles (sem alterações) ---
const getRankStyles = (index: number): { headerBg: string; border: string; } => {
  if (index === 0) return { headerBg: 'bg-amber-400', border: 'border-amber-400' };
  if (index === 1) return { headerBg: 'bg-slate-400', border: 'border-slate-400' };
  if (index === 2) return { headerBg: 'bg-yellow-600', border: 'border-yellow-600' };
  return { headerBg: 'bg-blue-600', border: 'border-blue-600' };
};

export default function ErrorDashboardPage() {
  const [data, setData] = useState<ErrorRateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = () => {
    // Não seta isLoading para true se já tiver dados, para a animação
    // dos números funcionar suavemente entre as atualizações
    if (data.length === 0) {
      setIsLoading(true);
    }
    
    fetch('/api/dashboards/error-rate')
      .then((res) => res.json())
      .then((data: ErrorRateData[]) => {
        const formattedData = data.map(item => ({
          ...item,
          lastReadTimestamp: new Date(item.lastReadTimestamp)
        }));
        setData(formattedData);
      })
      .catch((err) => console.error('Failed to fetch data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData(); // Busca na 1ª vez
    // ATUALIZAÇÃO DE 1 MINUTO (Já estava aqui)
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, []); // O array de dependência vazio [] garante que isso rode 1x

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      {/* Cabeçalho (sem alterações) */}
      <div className=" mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Top 20: Taxa de Erros
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
            Interfaces com maior média de erros por coleta (últimas 5 leituras).
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading && data.length === 0} // Só desabilita no 1º load
          className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
        >
          {isLoading && data.length === 0 ? 'Carregando...' : 'Atualizar Dados'}
        </button>
      </div>

      {/* Estados de Carregamento e Vazio (sem alterações) */}
      {isLoading && data.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-xl shadow-md max-w-7xl mx-auto">
          <p className="text-gray-500 text-lg">Carregando dados...</p>
        </div>
      )}
      {!isLoading && data.length === 0 && (
        <div className="text-center py-24 bg-green-50 dark:bg-green-900 rounded-xl shadow-md max-w-7xl mx-auto border border-green-200">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">🎉 Tudo Certo!</p>
          <p className="text-lg text-green-600 dark:text-green-400 mt-2">
            Nenhuma interface taxando erros no momento.
          </p>
        </div>
      )}

      {/* Grid de Cards (COM AS ANIMAÇÕES) */}
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
        {/* AnimatePresence para cards que saem da lista */}
        <AnimatePresence>
          {data.map((item, index) => {
            const rankStyles = getRankStyles(index);
            const inPercent = item.totalErrorRate > 0 ? (item.inErrorRate / item.totalErrorRate) * 100 : 0;
            const outPercent = 100 - inPercent;

            return (
              // --- CARD (motion.div com layout) ---
              // `layout` anima a mudança de posição
              <motion.div
                key={item.interfaceId} // Chave é essencial para a animação
                layout={true} // ANIMAÇÃO DE POSIÇÃO
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className={`group rounded-xl shadow-lg hover:shadow-2xl ${rankStyles.border} 
                            border-4 bg-white dark:bg-gray-800 overflow-hidden 
                            transition-all duration-300`}
              >
                {/* 1. Cabeçalho (sem alterações) */}
                <div className={`p-4 ${rankStyles.headerBg} text-white flex justify-between items-center`}>
                  <div className="min-w-0">
                    <p className="font-bold text-lg truncate" title={item.deviceName}>
                      <Server className="w-5 h-5 inline-block -mt-1 mr-2" />
                      {item.deviceName}
                    </p>
                    <p className="text-sm opacity-90 truncate" title={item.interfaceName}>
                      <Cable className="w-4 h-4 inline-block -mt-1 mr-2" />
                      {item.interfaceName}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-4xl font-extrabold opacity-70 ml-2">
                    {index + 1}
                  </span>
                </div>

                {/* 2. Corpo (COM NÚMEROS ANIMADOS) */}
                <div className="p-6 h-56 relative">
                  {/* --- ESTADO PADRÃO (SUMÁRIO) --- */}
                  <div 
                    className="absolute inset-0 flex flex-col justify-center items-center text-center
                               transition-all duration-300 ease-in-out
                               opacity-100 group-hover:opacity-0 group-hover:scale-90"
                  >
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Média de Erros
                    </p>
                    <div className="text-4xl font-extrabold text-red-600 dark:text-red-300 tracking-tighter my-2">
                      {/* NÚMERO ANIMADO (1) */}
                      <CountUp
                        end={item.totalErrorRate}
                        duration={0.75} // Duração da animação
                        formattingFn={val => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
                      Passe o mouse para detalhes
                    </p>
                  </div>

                  {/* --- ESTADO HOVER (DETALHES) --- */}
                  <div 
                    className="absolute inset-0 flex flex-col justify-center text-left space-y-3
                               transition-all duration-300 ease-in-out
                               opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  >
                    {/* IP e Descrição (sem alterações) */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">IP</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {item.deviceIp}
                      </p>
                    </div>
                    {item.interfaceDescription && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Descrição</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic truncate" title={item.interfaceDescription}>
                          {item.interfaceDescription}
                        </p>
                      </div>
                    )}

                    {/* Breakdown Bar (COM NÚMEROS ANIMADOS) */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Breakdown (In/Out)</p>
                      <div className="flex w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${inPercent}%` }}></div>
                        <div className="h-full bg-orange-400" style={{ width: `${outPercent}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs font-medium">
                        <span className="flex items-center text-red-600">
                          <ArrowDown className="w-3 h-3 mr-1"/> IN: 
                          {/* NÚMERO ANIMADO (2) */}
                          <CountUp
                            end={item.inErrorRate}
                            decimals={1}
                            duration={0.75}
                            formattingFn={val => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                          />
                        </span>
                        <span className="flex items-center text-orange-600">
                          <ArrowUp className="w-3 h-3 mr-1"/> OUT: 
                          {/* NÚMERO ANIMADO (3) */}
                          <CountUp
                            end={item.outErrorRate}
                            decimals={1}
                            duration={0.75}
                            formattingFn={val => val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div> {/* Fim do Corpo */}

                {/* Rodapé Fixo (COM TOTAL DE ERROS) */}
                <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  {/* Layout em Coluna para empilhar as infos */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      Última coleta: {item.lastReadTimestamp.toLocaleTimeString('pt-BR')}
                    </p>
                    {/* TOTAL DE ERROS ADICIONADO */}
                    <p className="text-xs text-gray-500 dark:text-gray-400" title="Total de erros acumulados na interface">
                      Total de Erros: {item.totalErrorCount.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

              </motion.div> // --- Fim do Card ---
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
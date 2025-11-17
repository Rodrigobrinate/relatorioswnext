import { NextResponse } from 'next/server';
// Importe o 'Prisma' para usar no $queryRaw
import { PrismaClient, InterfaceStats, Prisma } from '@prisma/client';
import '../../../../lib/bigint-patch';

const prisma = new PrismaClient();

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
  totalErrorCount: number;
};

// Interface para tipar o resultado da nossa consulta SQL pura
type RawStatsResult = {
  interface_id: number;
  in_errors: bigint;
  out_errors: bigint;
  timestamp: Date;
};

/**
 * Sua função de cálculo original (está correta)
 * Fix: Replaced BigInt literal '0n' with 'BigInt(0)' for wider JS compatibility.
 */
function calculateAverageRate(
  stats: Pick<InterfaceStats, 'in_errors' | 'out_errors' | 'timestamp'>[]
): { avgInRate: number; avgOutRate: number } {
  if (stats.length < 2) {
    return { avgInRate: 0, avgOutRate: 0 };
  }
  // A consulta raw já vem ordenada, mas invertemos para a lógica de delta
  const sortedStats = [...stats].reverse();
  const deltasIn: bigint[] = [];
  const deltasOut: bigint[] = [];

  for (let i = 1; i < sortedStats.length; i++) {
    const current = sortedStats[i];
    const previous = sortedStats[i - 1];

    const deltaIn = (current.in_errors ?? BigInt(0)) - (previous.in_errors ?? BigInt(0));
    const deltaOut = (current.out_errors ?? BigInt(0)) - (previous.out_errors ?? BigInt(0));

    if (deltaIn > BigInt(0)) deltasIn.push(deltaIn);
    if (deltaOut > BigInt(0)) deltasOut.push(deltaOut);
  }

  const sumIn = deltasIn.reduce((acc, val) => acc + val, BigInt(0));
  const sumOut = deltasOut.reduce((acc, val) => acc + val, BigInt(0));
  const avgInRate = deltasIn.length > 0 ? Number(sumIn) / deltasIn.length : 0;
  const avgOutRate = deltasOut.length > 0 ? Number(sumOut) / deltasOut.length : 0;

  return { avgInRate, avgOutRate };
}

export async function GET() {
  try {
    // --- PASSO 1: Buscar todas as interfaces e devices (Consulta RÁPIDA 1) ---
    // Removemos a busca aninhada de InterfaceStats daqui
    const interfaces = await prisma.networkInterface.findMany({
      select: {
        id: true,
        interface_name: true,
        description: true,
        device_id: true,
        Device: {
          select: {
            hostname: true,
            ip_address: true,
          },
        },
      },
    });

    if (interfaces.length === 0) {
      return NextResponse.json([]);
    }

    const interfaceIds = interfaces.map((iface) => iface.id);

    // --- PASSO 2: Buscar os "Top 5" stats para TODAS as interfaces (Consulta RÁPIDA 2) ---
    // Usamos SQL puro (raw) com Window Function (ROW_NUMBER() OVER(...))
    // Isso é o "Top N por grupo" em SQL, e é extremamente eficiente.
    // Ajuste os nomes "InterfaceStats", "interface_id", "timestamp" se estiverem diferentes no seu BD
    const rawStats: RawStatsResult[] = await prisma.$queryRaw(
      Prisma.sql`
        WITH RankedStats AS (
          SELECT
            "interface_id",
            "in_errors",
            "out_errors",
            "timestamp",
            ROW_NUMBER() OVER(
              PARTITION BY "interface_id"
              ORDER BY "timestamp" DESC
            ) as rn
          FROM "InterfaceStats"
          WHERE "interface_id" IN (${Prisma.join(interfaceIds)})
          AND "timestamp" > (NOW() - INTERVAL '3 days')
        )
        SELECT
          "interface_id",
          "in_errors",
          "out_errors",
          "timestamp"
        FROM RankedStats
        WHERE rn <= 5
        ORDER BY "interface_id", "timestamp" DESC;
      `
    );

    // --- PASSO 3: Juntar os dados na aplicação (Muito Rápido) ---

    // Agrupa os stats por interface_id para fácil acesso
    const statsMap = new Map<number, RawStatsResult[]>();
    for (const stat of rawStats) {
      if (!statsMap.has(stat.interface_id)) {
        statsMap.set(stat.interface_id, []);
      }
      statsMap.get(stat.interface_id)!.push(stat);
    }

    // Agora, usamos a MESMA lógica de cálculo que você já tinha,
    // mas com os dados que buscamos eficientemente.
    const calculatedRates: ErrorRateData[] = interfaces
      .map((iface) => {
        // Pegamos os stats pré-buscados do nosso Map
        const stats = statsMap.get(iface.id) || [];
        
        if (stats.length < 2) {
          return null;
        }

        const { avgInRate, avgOutRate } = calculateAverageRate(stats);
        const totalAvgRate = avgInRate + avgOutRate;

        if (totalAvgRate <= 0) {
          return null;
        }

        // Pega o contador total da leitura mais RECENTE (stats[0])
        const latestStat = stats[0];
        const totalErrorCount =
          Number(latestStat.in_errors ?? BigInt(0)) +
          Number(latestStat.out_errors ?? BigInt(0));

        return {
          interfaceId: iface.id,
          interfaceName: iface.interface_name,
          interfaceDescription: iface.description,
          deviceName: iface.Device.hostname,
          deviceIp: iface.Device.ip_address,
          inErrorRate: avgInRate,
          outErrorRate: avgOutRate,
          totalErrorRate: totalAvgRate,
          lastReadTimestamp: latestStat.timestamp,
          totalErrorCount: totalErrorCount,
        };
      })
      .filter((rate): rate is ErrorRateData => rate !== null);

    // O resto do seu código (ordenar e fatiar) está perfeito
    const sortedRates = calculatedRates.sort(
      (a, b) => b.totalErrorRate - a.totalErrorRate
    );

    const top20 = sortedRates.slice(0, 20);
    return NextResponse.json(top20);

  } catch (error) {
    console.error('Failed to calculate average error rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
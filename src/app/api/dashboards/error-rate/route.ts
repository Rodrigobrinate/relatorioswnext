// app/api/dashboards/error-rate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, InterfaceStats } from '@prisma/client';
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
  totalErrorCount: number; // <-- ADICIONADO
};

// --- Função calculateAverageRate (sem alterações) ---
function calculateAverageRate(
  stats: Pick<InterfaceStats, 'in_errors' | 'out_errors' | 'timestamp'>[]
): { avgInRate: number; avgOutRate: number } {
  if (stats.length < 2) {
    return { avgInRate: 0, avgOutRate: 0 };
  }
  const sortedStats = [...stats].reverse();
  const deltasIn: bigint[] = [];
  const deltasOut: bigint[] = [];

  for (let i = 1; i < sortedStats.length; i++) {
    const current = sortedStats[i];
    const previous = sortedStats[i - 1];
    const deltaIn = (current.in_errors ?? 0n) - (previous.in_errors ?? 0n);
    const deltaOut = (current.out_errors ?? 0n) - (previous.out_errors ?? 0n);
    if (deltaIn > 0n) deltasIn.push(deltaIn);
    if (deltaOut > 0n) deltasOut.push(deltaOut);
  }

  const sumIn = deltasIn.reduce((acc, val) => acc + val, 0n);
  const sumOut = deltasOut.reduce((acc, val) => acc + val, 0n);
  const avgInRate = deltasIn.length > 0 ? Number(sumIn) / deltasIn.length : 0;
  const avgOutRate = deltasOut.length > 0 ? Number(sumOut) / deltasOut.length : 0;
  
  return { avgInRate, avgOutRate };
}

export async function GET() {
  try {
    const interfacesWithStats = await prisma.networkInterface.findMany({
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
        InterfaceStats: {
          take: 5,
          select: {
            in_errors: true,
            out_errors: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    const calculatedRates: ErrorRateData[] = interfacesWithStats
      .map((iface) => {
        const stats = iface.InterfaceStats;
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
        const totalErrorCount = Number(latestStat.in_errors ?? 0n) + Number(latestStat.out_errors ?? 0n);

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
          totalErrorCount: totalErrorCount, // <-- ADICIONADO
        };
      })
      .filter((rate): rate is ErrorRateData => rate !== null);

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
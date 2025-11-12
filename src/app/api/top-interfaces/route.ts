// src/app/api/top-interfaces/route.ts
import { NextResponse } from 'next/server';
// Importe seu cliente Prisma instanciado
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Usaremos para o $queryRaw

// O tipo de dado que o frontend espera (o mesmo de antes)
export type TopInterfaceData = {
  interfaceId: number;
  hostname: string;
  vendor: string | null;
  interface_name: string;
  in_uti: number | null;
  out_uti: number | null;
  max_uti: number;
  last_stat_time: Date;
};

export async function GET() {
  try {
    /*
     * Esta é a query SQL otimizada.
     * Ela faz todo o trabalho pesado dentro do PostgreSQL.
     */
    const sqlQuery = Prisma.sql`
      WITH LatestStats AS (
        -- Passo 1: Encontrar a estatística MAIS RECENTE para CADA interface.
        -- "DISTINCT ON" é uma feature poderosa do PostgreSQL para isso.
        SELECT DISTINCT ON ("interface_id")
          "interface_id",
          COALESCE("in_uti", 0) as in_uti, -- Trata valores nulos
          COALESCE("out_uti", 0) as out_uti,
          "timestamp"
        FROM "InterfaceStats"
        ORDER BY "interface_id", "timestamp" DESC
      )
      -- Passo 2: Juntar os resultados com os dados do Dispositivo e Interface
      SELECT
        ls.in_uti,
        ls.out_uti,
        ls.timestamp as last_stat_time,
        -- Calcula o "uso máximo" (download ou upload)
        GREATEST(ls.in_uti, ls.out_uti) as max_uti,
        ni.id as "interfaceId",
        ni.interface_name,
        d.hostname,
        d.vendor
      FROM LatestStats ls
      JOIN "NetworkInterface" ni ON ls.interface_id = ni.id
      JOIN "Device" d ON ni.device_id = d.id
      -- Ignora interfaces que estão com 0% de uso
      WHERE (ls.in_uti > 0 OR ls.out_uti > 0)
      -- Passo 3: Ordenar pelo uso máximo
      ORDER BY max_uti DESC
      -- Passo 4: Limitar aos 50 principais resultados
      LIMIT 50;
    `;

    // Executa a query nativa
    const result = await prisma.$queryRaw<TopInterfaceData[]>(sqlQuery);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao buscar top-interfaces (otimizado):", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Log de erro específico do Prisma
      console.error('Código do Erro Prisma:', error.code);
    }
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação" },
      { status: 500 }
    );
  }
}
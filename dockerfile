# 1. Base Stage
# Usa uma imagem Node.js leve como base para os estágios
FROM node:20-alpine AS base

# 2. Dependency Installation Stage (Deps)
# Otimiza a instalação de dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Instala as dependências, usando npm ci se package-lock.json existir
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# 3. Build Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita a telemetria do Next.js durante a compilação
ENV NEXT_TELEMETRY_DISABLED 1

# Compila a aplicação. Garanta que seu next.config.js tenha:
# output: 'standalone'
# A compilação cria a pasta .next/standalone
RUN npm run build

# 4. Production Runner Stage
FROM base AS runner
WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria um usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

RUN npx prisma db push
RUN npx prisma generate

# Copia os arquivos de produção necessários
# A pasta standalone contém tudo para rodar a aplicação:
# servidor Node.js, arquivos estáticos e o build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Porta que o Next.js deve escutar (padrão 3000)
EXPOSE 3000

# Comando para iniciar a aplicação compilada
CMD ["node", "server.js"]
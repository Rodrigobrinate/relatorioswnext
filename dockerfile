# ==============================================================================
# 1. BASE STAGE
# Define uma imagem base leve para reutilização.
# ==============================================================================
FROM node:20-alpine AS base

# ==============================================================================
# 2. DEPENDENCY INSTALLATION STAGE (deps)
# Instala as dependências, aproveitando o cache do Docker.
# ==============================================================================
FROM base AS deps
# Pacote necessário para que alguns pacotes Node.js funcionem no Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia arquivos de gerenciamento de pacotes
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Instala as dependências de forma determinística
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# ==============================================================================
# 3. BUILD STAGE
# Copia o código, gera o cliente Prisma e compila a aplicação.
# ==============================================================================
FROM base AS builder
WORKDIR /app

# Copia as dependências instaladas no estágio 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Copia todo o código-fonte (incluindo 'prisma/schema.prisma')
COPY . .

# Variável de segurança e otimização
ENV NEXT_TELEMETRY_DISABLED 1

# 🛑 Ação do Prisma para Produção:
# 1. Gera o cliente Prisma (obrigatório para que o build do Next.js funcione)
# 2. NÃO inclua 'db push' ou 'migrate deploy' aqui. Isso deve ser feito 
#    separadamente no seu pipeline de CI/CD ANTES de implantar a nova imagem.
RUN npx prisma generate

# Compila a aplicação Next.js
# Isso cria o servidor 'standalone' em .next/standalone
RUN npm run build

# ==============================================================================
# 4. PRODUCTION RUNNER STAGE
# A imagem final. Leve, segura e contém apenas os arquivos de execução.
# ==============================================================================
FROM base AS runner
WORKDIR /app

# Define ambiente de produção e desativa a telemetria
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Define a porta (padrão Next.js)
EXPOSE 3000

# Segurança: Cria e usa um usuário não-root ('nextjs')
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copia APENAS os artefatos necessários do estágio 'builder'
# A pasta 'standalone' contém o servidor Node.js e os módulos necessários
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copia arquivos estáticos do build
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copia a pasta 'public'
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Inicia o servidor Next.js standalone
CMD ["node", "server.js"]
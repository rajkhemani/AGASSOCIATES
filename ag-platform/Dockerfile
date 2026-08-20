FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

# turbo.json is required — `npm run build` is `turbo build`, and turbo aborts
# without it. The frontend is the @ag/web workspace (apps/web), not the repo
# root, so the workspace directories have to be present for turbo to see it.
COPY package.json package-lock.json .npmrc turbo.json ./
COPY packages/ packages/
COPY apps/ apps/
COPY services/ services/
RUN npm ci

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_ENV=production

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

# server.ts serves the SPA from apps/web/dist — see its express.static path.
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# server.ts, src/server and src/lib import no @ag/* workspace package, so the
# runtime needs only the root manifests. tsx is a prod dependency, so it
# survives --omit=dev and `npx tsx server.ts` resolves.
COPY package.json package-lock.json .npmrc ./
COPY server.ts ./
COPY src/server/ ./src/server/
COPY src/lib/ ./src/lib/
COPY tsconfig.json tsconfig.node.json ./

RUN npm ci --omit=dev

EXPOSE 3001

CMD ["npx", "tsx", "server.ts"]

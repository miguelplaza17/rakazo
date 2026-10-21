# App image for Dokploy: api, worker, web and the sandbox supervisor all run from it.
# Same layout as infra/compose/Dockerfile, but pnpm installs only the server-side
# workspaces (and the root, which provides tsx and cross-env). The desktop (Electron)
# and mobile (Expo) dependency trees are skipped, which keeps the build within the
# memory of a small VPS and the image much smaller.
FROM node:22-bookworm@sha256:0557ac14e0d45d02ed563067b82856ca5e7aa3437fa28d98d4350ea9c3d9494a
RUN corepack enable
WORKDIR /app
# Every manifest listed in pnpm-workspace.yaml must be present or --frozen-lockfile
# fails, even for the workspaces the filtered install leaves out.
COPY --chmod=755 package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --chmod=755 patches patches
COPY --chmod=755 apps/api/package.json apps/api/
COPY --chmod=755 apps/desktop/package.json apps/desktop/
COPY --chmod=755 apps/mobile/package.json apps/mobile/
COPY --chmod=755 apps/web/package.json apps/web/
COPY --chmod=755 apps/worker/package.json apps/worker/
COPY --chmod=755 apps/www/package.json apps/www/
COPY --chmod=755 packages/adapter-kit/package.json packages/adapter-kit/
COPY --chmod=755 packages/adapters/package.json packages/adapters/
COPY --chmod=755 packages/auth/package.json packages/auth/
COPY --chmod=755 packages/chat-ui/package.json packages/chat-ui/
COPY --chmod=755 packages/contracts/package.json packages/contracts/
COPY --chmod=755 packages/core/package.json packages/core/
COPY --chmod=755 packages/db/package.json packages/db/
COPY --chmod=755 packages/logging/package.json packages/logging/
COPY --chmod=755 packages/memory/package.json packages/memory/
COPY --chmod=755 packages/testkit/package.json packages/testkit/
COPY --chmod=755 packages/ui-tokens/package.json packages/ui-tokens/
COPY --chmod=755 packages/ui-web/package.json packages/ui-web/
COPY --chmod=755 infra/sandboxes/supervisor/package.json infra/sandboxes/supervisor/
COPY --chmod=755 infra/updater/package.json infra/updater/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store \
      --filter . \
      --filter "@rakazo/api..." \
      --filter "@rakazo/worker..." \
      --filter "@rakazo/web..." \
      --filter "@rakazo/sandbox-supervisor..."
# Normalize modes: a restrictive host umask would otherwise leave the copied tree
# unreadable to USER node at runtime.
COPY --chmod=755 . .
RUN pnpm --filter @rakazo/db generate
RUN RAKAZO_ALLOW_DEV_SECRETS=1 NODE_OPTIONS=--max-old-space-size=3072 pnpm --filter @rakazo/web build
RUN install -d -m 750 -o node -g node /data /app/apps/web/node_modules/.vite-temp
ARG GIT_SHA
ENV NODE_ENV=production
ENV GIT_SHA=$GIT_SHA
EXPOSE 3100 5173 7091
USER node
CMD ["pnpm", "--filter", "@rakazo/api", "start"]

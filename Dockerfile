FROM node:18-alpine as base

WORKDIR /app

RUN npm install -g pnpm@8.4.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --ignore-scripts --frozen-lockfile

FROM base as build

COPY . .

RUN --mount=type=secret,id=dotenv,dst=env \
  tr ' ' '\n' < env > .env && \
  pnpm build

RUN pnpm prune --prod

FROM node:18-alpine

USER node

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT 9229 9230

COPY --from=build /app/.mesh .mesh
COPY --from=build /app/public public
COPY --from=build /app/build build
COPY --from=build /app/node_modules node_modules
COPY package.json .

ENTRYPOINT ["yarn", "start"]

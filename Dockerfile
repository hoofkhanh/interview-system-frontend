FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# --- Build-time ARG duy nhất ---
ARG BACKEND_BASE_URL
ARG BACKEND_WS

# --- Set tất cả NEXT_PUBLIC_… từ BASE_URL ---
ENV NEXT_PUBLIC_AUTH_ENDPOINT=${BACKEND_BASE_URL}/interview-system-auth-service/graphql
ENV NEXT_PUBLIC_QUESTION_ENDPOINT=${BACKEND_BASE_URL}/interview-system-question-service/graphql
ENV NEXT_PUBLIC_SESSION_ENDPOINT=${BACKEND_BASE_URL}/interview-system-session-service/graphql
ENV NEXT_PUBLIC_WS_ENDPOINT=ws://${BACKEND_WS}/ws/join

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

RUN npm ci --omit=dev

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000
CMD ["npm", "start"]

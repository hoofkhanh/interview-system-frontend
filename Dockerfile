FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BACKEND_BASE_URL
ARG BACKEND_WS

ENV NEXT_PUBLIC_AUTH_ENDPOINT=${BACKEND_BASE_URL}/interview-system-auth-service/graphql \
    NEXT_PUBLIC_QUESTION_ENDPOINT=${BACKEND_BASE_URL}/interview-system-question-service/graphql \
    NEXT_PUBLIC_SESSION_ENDPOINT=${BACKEND_BASE_URL}/interview-system-session-service/graphql \
    NEXT_PUBLIC_WS_ENDPOINT=ws://${BACKEND_WS}/ws/join

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
# Bỏ dòng này nếu không có thư mục public/
COPY --from=builder /app/public ./public

RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
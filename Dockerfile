FROM node:20-slim
WORKDIR /app

# Install deps (including dev deps to build TS)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Now install only production deps (optional but recommended)
RUN npm prune --omit=dev

ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]

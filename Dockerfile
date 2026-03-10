FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create database directory
RUN mkdir -p shared

# Build client if needed
RUN cd client && npm ci && npm run build

EXPOSE 5000

CMD ["npm", "run", "server"]

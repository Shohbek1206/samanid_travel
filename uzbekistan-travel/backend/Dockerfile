FROM node:18-alpine

WORKDIR /app

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["npm", "start"]

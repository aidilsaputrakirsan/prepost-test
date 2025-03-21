FROM node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY server/package*.json ./
RUN npm install

# Copy server files
COPY server/ ./

# Expose the port your app runs on
EXPOSE 5000

# Define environment variable
ENV NODE_ENV=production

# Start the app
CMD ["node", "server.js"]
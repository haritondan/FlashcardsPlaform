# Use Node.js base image
FROM node:14

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port the gateway runs on
EXPOSE 8080

# Command to run the gateway
CMD ["node", "src/gateway.js"]
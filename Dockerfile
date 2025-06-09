FROM node:18

# Set working directory
WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of your code
COPY . .

# Expose the port
EXPOSE 3010

# Start the app
CMD ["node", "index.js"]

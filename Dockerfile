# Base image with Node.js and npm
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install required packages: python3, ffmpeg, curl, etc.
RUN apt update && apt install -y \
  python3 \
    python3-pip \
      ffmpeg \
        curl \
          wget \
            && apt clean \
              && rm -rf /var/lib/apt/lists/*

              # Install yt-dlp via pip
          

              # Copy your bot project files
              COPY . .

              # Install Node.js dependencies
              RUN npm install

              # Set default command (update if your bot uses something else)
              CMD ["node", "index.js"]
FROM ubuntu:24.04

RUN apt update -y && apt upgrade -y

RUN apt-get update && apt-get install -y curl xz-utils libatomic1 ffmpeg && \
    rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://nodejs.org/dist/v25.2.1/node-v25.2.1-linux-x64.tar.xz \
    -o node.tar.xz && \
    tar -xJf node.tar.xz -C /usr/local --strip-components=1 && \
    rm node.tar.xz

RUN node -v && npm -v

COPY . .
RUN npm install

ENTRYPOINT [ "npm", "run", "start" ]

FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && apt upgrade -y

RUN apt-get install -y curl xz-utils libatomic1 ffmpeg python3 python3-venv python3-pip git curl build-essential && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://nodejs.org/dist/v25.2.1/node-v25.2.1-linux-x64.tar.xz \
    -o node.tar.xz && \
    tar -xJf node.tar.xz -C /usr/local --strip-components=1 && \
    rm node.tar.xz
RUN node -v && npm -v

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel
RUN pip install openai-whisper


COPY . .
RUN npm install

ENTRYPOINT [ "npm", "run", "start" ]

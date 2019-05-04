FROM node:8

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm config set '@bit:registry' https://node.bitsrc.io && \
    npm install --production
COPY . .
RUN mkdir -p /app/temp && mkdir -p /app/logs
VOLUME ["/app/temp/"]
VOLUME ["/app/logs"]
EXPOSE 4008
CMD ["node", "server.js"]
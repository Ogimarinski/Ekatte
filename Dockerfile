FROM node:24.11.0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x entrypoint.sh

ENV DOCKER_API_VERSION=1.43
EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "start"]
FROM NODE:18-alpine
# use the official node.js 18 image with alpine linux as the base image

WORKDIR /use/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3004

CMD ["node", "src/server.js"]
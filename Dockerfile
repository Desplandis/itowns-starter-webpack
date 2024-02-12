FROM node:21-alpine
WORKDIR /app
COPY . .
RUN npm install -g npm@10.4.0
RUN npm install
EXPOSE 8000
CMD ["npm", "start"]

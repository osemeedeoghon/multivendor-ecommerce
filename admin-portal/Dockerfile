FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3032
CMD ["npm", "run", "dev", "--", "-p", "3032", "-H", "0.0.0.0"]
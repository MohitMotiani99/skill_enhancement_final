FROM node:alpine
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 8089
CMD node questions.js
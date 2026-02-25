FROM denoland/deno:alpine-1.45.5

RUN mkdir -p /home/app

COPY . /home/app

WORKDIR /home/app

EXPOSE 3005

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]
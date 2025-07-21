# Usa la imagen base Alpine, que es muy liviana
FROM alpine:latest

# Instala las dependencias necesarias para descargar y extraer Bun
RUN apk update
RUN apk add --no-cache bash curl tar libstdc++

# Descarga Bun v1.2.4 desde GitHub y extrae el binario
RUN curl -fsSL https://bun.sh/install | bash

# Define la variable HOME para que $HOME esté disponible
ENV HOME=/root

# Asegura que el binario de Bun esté en el PATH
ENV BUN_INSTALL="$HOME/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Establece el directorio de trabajo y copia el archivo de la aplicación
WORKDIR /app

# 7. Copiamos todo el contenido del proyecto al directorio de trabajo
COPY . .

# 8. Instalamos las dependencias, incluyendo @std/media-types via jsr antes
RUN bun x jsr add @std/media-types && \
    bun install

# 9. Exponemos el puerto que utiliza la aplicación (por defecto Bun.serve usa el 3000)
EXPOSE 10000

# 11. Definimos el comando de inicio. En este caso, usamos "index.ts" como punto de entrada
CMD ["sh", "-c", "bun run build && bun run server.ts"]

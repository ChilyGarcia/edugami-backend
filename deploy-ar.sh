#!/usr/bin/env bash
set -e

AR_DOMAIN="edugami-ar.aliviapp.com.co"
AR_EMAIL="tu-correo@tu-dominio.com"  # CAMBIA ESTO EN EL SERVIDOR

BACKEND_COMPOSE_FILE="docker-compose.prod.yml"

AR_DIR="/opt/edugami-ar/edugami-ar"
AR_COMPOSE_FILE="docker-compose.yml"

CERTBOT_ETC="$(pwd)/certbot/etc"
CERTBOT_VAR="$(pwd)/certbot/var"

mkdir -p "$CERTBOT_ETC" "$CERTBOT_VAR"

case "$1" in
  init-ssl)
    echo "Parando nginx para liberar el puerto 80..."
    docker compose -f "$BACKEND_COMPOSE_FILE" stop nginx || true

    echo "Obteniendo certificado SSL para $AR_DOMAIN con Certbot (standalone)..."
    docker run --rm \
      -p 80:80 \
      -v "$CERTBOT_ETC:/etc/letsencrypt" \
      -v "$CERTBOT_VAR:/var/lib/letsencrypt" \
      certbot/certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --no-eff-email \
        --email "$AR_EMAIL" \
        -d "$AR_DOMAIN"

    echo "Certificado inicial generado. Arrancando de nuevo nginx..."
    docker compose -f "$BACKEND_COMPOSE_FILE" start nginx
    ;;

  up)
    echo "Levantando stack de producción de edugami-ar..."
    (cd "$AR_DIR" && docker compose -f "$AR_COMPOSE_FILE" up -d --build)
    ;;

  renew)
    echo "Renovando certificados SSL..."
    docker compose -f "$BACKEND_COMPOSE_FILE" stop nginx || true

    docker run --rm \
      -p 80:80 \
      -v "$CERTBOT_ETC:/etc/letsencrypt" \
      -v "$CERTBOT_VAR:/var/lib/letsencrypt" \
      certbot/certbot renew --standalone --quiet

    echo "Renovación completada. Arrancando de nuevo nginx..."
    docker compose -f "$BACKEND_COMPOSE_FILE" start nginx
    ;;

  *)
    echo "Uso: $0 {init-ssl|up|renew}"
    exit 1
    ;;
esac
#!/usr/bin/env bash
set -e

DOMAIN="api-edugami.aliviapp.com.co"
EMAIL="tu-correo@tu-dominio.com"  # CAMBIA ESTO EN EL SERVIDOR
COMPOSE_FILE="docker-compose.prod.yml"
CERTBOT_ETC="$(pwd)/certbot/etc"
CERTBOT_VAR="$(pwd)/certbot/var"

mkdir -p "$CERTBOT_ETC" "$CERTBOT_VAR"

case "$1" in
  init-ssl)
    echo "Obteniendo certificados SSL para $DOMAIN con Certbot (standalone)..."
    docker run --rm \
      -p 80:80 \
      -v "$CERTBOT_ETC:/etc/letsencrypt" \
      -v "$CERTBOT_VAR:/var/lib/letsencrypt" \
      certbot/certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --no-eff-email \
        --email "$EMAIL" \
        -d "$DOMAIN"
    echo "Certificado inicial generado. Ahora puedes levantar nginx con SSL."
    ;;

  up)
    echo "Levantando stack de producción (app + mongo + nginx)..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    ;;

  renew)
    echo "Renovando certificados SSL para $DOMAIN..."
    # Parar nginx para liberar el puerto 80
    docker compose -f "$COMPOSE_FILE" stop nginx || true

    docker run --rm \
      -p 80:80 \
      -v "$CERTBOT_ETC:/etc/letsencrypt" \
      -v "$CERTBOT_VAR:/var/lib/letsencrypt" \
      certbot/certbot renew --standalone --quiet

    echo "Renovación completada. Arrancando de nuevo nginx..."
    docker compose -f "$COMPOSE_FILE" start nginx
    ;;

  *)
    echo "Uso: $0 {init-ssl|up|renew}"
    exit 1
    ;;
esac


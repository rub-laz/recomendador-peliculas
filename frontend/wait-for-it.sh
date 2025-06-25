#!/usr/bin/env sh
# Original: https://github.com/vishnubob/wait-for-it

HOST="$1"
PORT="$2"
shift 2

echo "⏳ Esperando a que $HOST:$PORT esté disponible..."

while ! nc -z "$HOST" "$PORT"; do
  sleep 1
done

echo "✅ $HOST:$PORT está disponible, ejecutando: $@"
exec "$@"

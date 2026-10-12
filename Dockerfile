FROM python:3.13-slim

WORKDIR /app
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
RUN pip install --no-cache-dir . \
    && useradd --system --uid 10001 api

USER api
ENV APP_HOST=0.0.0.0 APP_PORT=3000 PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
EXPOSE 3000
CMD ["clean-api"]

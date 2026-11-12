# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for MSM Unify Leadership Careers
# Stage 1: Build static assets using Python 3 & Pillow
# Stage 2: Serve static production assets via Nginx Alpine on port 3000
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build static generator
FROM python:3.11-slim AS builder

WORKDIR /app

# Install dependencies required by build/build.py
RUN pip install --no-cache-dir Pillow

# Copy source repository
COPY . .

# Optional build-args to override site URL or Google Apps Script endpoint
ARG SITE_URL="https://www.msmunify.com/hirethenextleadership/"
ARG APPLY_ENDPOINT=""

# Update site.json if custom SITE_URL provided
RUN if [ -n "$SITE_URL" ]; then \
      python3 -c "import json; p='build/site.json'; d=json.load(open(p)); d['siteUrl']='$SITE_URL'; json.dump(d, open(p,'w'), indent=2)"; \
    fi

# Update config.js if custom APPLY_ENDPOINT provided
RUN if [ -n "$APPLY_ENDPOINT" ]; then \
      python3 -c "p='config.js'; c=open(p).read(); open(p,'w').write(c.replace('applyEndpoint: \"\"', f'applyEndpoint: \"$APPLY_ENDPOINT\"'))"; \
    fi

# Run the Python build generator
RUN python3 build/build.py

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Custom Nginx configuration (port 3000, /api/health endpoint, gzip, security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static website assets from builder
COPY --from=builder /app /usr/share/nginx/html

# Clean up internal source files not needed in production serving
RUN rm -rf /usr/share/nginx/html/build \
           /usr/share/nginx/html/apps-script \
           /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.github \
           /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/nginx.conf \
           /usr/share/nginx/html/__pycache__

# Create symlink so Nginx can resolve requests whether Azure Front Door
# preserves the path (/hirethenextleadership/...) or strips it (/...)
RUN ln -s . /usr/share/nginx/html/hirethenextleadership

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

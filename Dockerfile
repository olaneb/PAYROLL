# PayCore HR — zero npm dependencies, so no install step.
# Node 22.13+ is required for the built-in SQLite module.
FROM node:22-alpine
WORKDIR /app
COPY . .
# Stop with a clear message if the repo is missing the app folders
RUN if [ ! -f lib/app.js ] || [ ! -f public/index.html ]; then \
      echo ""; \
      echo "================================================================"; \
      echo " BUILD STOPPED: the 'lib' and/or 'public' folders are missing"; \
      echo " from the GitHub repo. Upload those FOLDERS (drag them from"; \
      echo " Windows Explorer onto GitHub's 'Upload files' page), commit,"; \
      echo " and deploy again. Files received by the build:"; \
      echo "================================================================"; \
      ls -la; exit 1; \
    fi
ENV NODE_ENV=production PORT=4070 DATA_DIR=/data
RUN mkdir -p /data
EXPOSE 4070
CMD ["node", "server.js"]

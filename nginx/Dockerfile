# FROM nginx:alpine

# # Copy the full main nginx.conf file (with events and http blocks)
# COPY nginx.conf /etc/nginx/nginx.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine

# Copy template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

EXPOSE 80

# Replace $SERVER_NAME at startup
CMD envsubst '$SERVER_NAME' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'

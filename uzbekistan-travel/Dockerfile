FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy website files to nginx html directory
COPY --chmod=644 index.html /usr/share/nginx/html/
COPY --chmod=644 payment.html /usr/share/nginx/html/
COPY --chmod=644 css/ /usr/share/nginx/html/css/
COPY --chmod=644 js/ /usr/share/nginx/html/js/
COPY --chmod=644 admin/ /usr/share/nginx/html/admin/
COPY --chmod=644 images/ /usr/share/nginx/html/images/

# Set correct permissions
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

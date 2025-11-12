# 🚀 PubliCenter Deployment Guide

Complete guide for deploying PubliCenter to production servers.

## 📋 Table of Contents

- [Server Requirements](#server-requirements)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Initial Setup](#initial-setup)
- [Domain Configuration](#domain-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Database Management](#database-management)
- [Update & Upgrade Procedures](#update--upgrade-procedures)
- [Monitoring Setup](#monitoring-setup)
- [Backup Procedures](#backup-procedures)
- [Troubleshooting](#troubleshooting)
- [Security Hardening](#security-hardening)

---

## 📊 Server Requirements

### Minimum Specifications

```yaml
CPU: 2 cores
RAM: 4 GB
Storage: 40 GB SSD
OS: Ubuntu 22.04 LTS or later
Network: Stable internet connection
Ports: 80, 443 (open to public)
```

### Recommended Specifications

```yaml
CPU: 4 cores
RAM: 8 GB
Storage: 80 GB SSD
OS: Ubuntu 22.04 LTS
Network: High bandwidth, low latency
Ports: 80, 443 (open to public)
Bandwidth: Unlimited or high capacity
```

### Software Dependencies

- **Docker**: v24.0 or later
- **Docker Compose**: v2.20 or later
- **Git**: v2.34 or later
- **OpenSSL**: For certificate management
- **UFW**: For firewall management

---

## ✅ Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] A VPS or dedicated server with root access
- [ ] Domain name pointing to server IP address
- [ ] WordPress site with Application Password configured
- [ ] Google Translate API key
- [ ] Email address for SSL certificates (Let's Encrypt)
- [ ] Backup of any existing data
- [ ] SSH access configured
- [ ] Firewall rules planned

---

## 🎯 Initial Setup

### Step 1: Run the Automated Setup Script

The easiest way to set up PubliCenter is using our automated setup script:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/yourusername/publicenter/main/scripts/setup.sh

# Make it executable
chmod +x setup.sh

# Run as root
sudo ./setup.sh
```

The setup script will:
1. Update system packages
2. Install Docker and Docker Compose
3. Install additional tools (git, curl, ufw)
4. Configure firewall
5. Create project directory
6. Set up environment variables
7. Create SSL certificate directory

### Step 2: Clone the Repository

```bash
cd /opt/publicenter
git clone https://github.com/yourusername/publicenter.git .
```

### Step 3: Configure Environment Variables

The setup script creates a `.env` file. Review and update as needed:

```bash
nano .env
```

Required environment variables:

```bash
# Database Configuration
DB_USER=publicenter
DB_PASSWORD=<generated-securely>
DB_NAME=publicenter

# WordPress Configuration
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=your-api-key

# Application Configuration
APP_URL=https://your-domain.com
DOMAIN=your-domain.com
ADMIN_EMAIL=admin@your-domain.com
NEXTAUTH_SECRET=<generated-securely>
NODE_ENV=production

# Rate Limiting
API_RATE_LIMIT=100

# Cache Settings
CACHE_TTL=300
```

### Step 4: Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 5: Run Database Migrations

```bash
# Wait for services to be ready (30 seconds)
sleep 30

# Run Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Seed default templates (optional)
docker-compose exec app npx prisma db seed
```

### Step 6: Verify Installation

```bash
# Check logs
docker-compose logs -f app

# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","checks":{...}}
```

---

## 🌐 Domain Configuration

### DNS Setup

Configure your domain's DNS records:

#### A Record
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

#### WWW Subdomain (Optional)
```
Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### Verify DNS Propagation

```bash
# Check DNS resolution
dig your-domain.com

# Wait for propagation (can take up to 24 hours)
# Typically completes in 15-30 minutes
```

---

## 🔒 SSL Certificate Setup

PubliCenter uses **Certbot** for automatic SSL certificate management via Let's Encrypt.

### Automatic SSL Setup (Recommended)

SSL certificates are automatically generated when you start the application if:
1. Domain DNS points to your server
2. Ports 80 and 443 are open
3. Email address is configured in `.env`

The Nginx reverse proxy in our Docker setup handles SSL automatically.

### Manual SSL Setup

If automatic setup fails:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificate files will be in:
# /etc/letsencrypt/live/your-domain.com/
```

### SSL Certificate Renewal

Certificates auto-renew via cron job. To manually renew:

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Restart services
docker-compose restart nginx
```

### Verify SSL Configuration

```bash
# Check certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Online SSL test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

---

## 🗄️ Database Management

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U publicenter -d publicenter

# Run SQL queries
docker-compose exec postgres psql -U publicenter -d publicenter -c "SELECT COUNT(*) FROM Article;"
```

### Database Migrations

```bash
# Create new migration
docker-compose exec app npx prisma migrate dev --name migration_name

# Apply migrations
docker-compose exec app npx prisma migrate deploy

# Reset database (DANGER: deletes all data)
docker-compose exec app npx prisma migrate reset
```

### Database Backup

#### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U publicenter publicenter > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

#### Automated Backup

Set up automated daily backups:

```bash
# Make backup script executable
chmod +x /opt/publicenter/scripts/backup.sh

# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /opt/publicenter/scripts/backup.sh
```

#### Restore from Backup

```bash
# Stop application
docker-compose down

# Restore database
gunzip < backup_20240115_020000.sql.gz | docker-compose exec -T postgres psql -U publicenter publicenter

# Start application
docker-compose up -d
```

---

## 🔄 Update & Upgrade Procedures

### Application Updates

Use the automated deployment script:

```bash
# Run deployment script
/opt/publicenter/scripts/deploy.sh
```

The script will:
1. Backup the database
2. Pull latest code
3. Rebuild containers
4. Stop old containers
5. Start new containers
6. Run migrations
7. Perform health check
8. Clean up old backups

### Manual Update Process

```bash
# Navigate to project directory
cd /opt/publicenter

# Backup database
docker-compose exec postgres pg_dump -U publicenter publicenter > backup_before_update.sql

# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Stop and remove old containers
docker-compose down

# Start new containers
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Verify health
curl http://localhost:3000/api/health
```

### Rollback Procedure

If update fails:

```bash
# Navigate to project directory
cd /opt/publicenter

# Checkout previous version
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Restore database if needed
gunzip < backup_before_update.sql.gz | docker-compose exec -T postgres psql -U publicenter publicenter
```

### Docker Image Updates

```bash
# Update base images
docker-compose pull

# Rebuild with updated images
docker-compose build --pull

# Restart services
docker-compose down
docker-compose up -d
```

---

## 📈 Monitoring Setup

### Application Health Checks

PubliCenter includes a built-in health endpoint:

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "wordpress": "reachable",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

### Container Monitoring

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app

# View logs with timestamps
docker-compose logs -t app

# Export logs
docker-compose logs app > app.log
```

### Setting Up External Monitoring

#### Uptime Monitoring

Use services like:
- **UptimeRobot** (https://uptimerobot.com)
- **Pingdom** (https://www.pingdom.com)
- **StatusCake** (https://www.statuscake.com)

Configure to monitor:
- Main URL: `https://your-domain.com`
- Health endpoint: `https://your-domain.com/api/health`

#### Log Aggregation

For production, consider:
- **Sentry** for error tracking
- **LogDNA** / **Datadog** for log aggregation
- **Grafana** + **Prometheus** for metrics

### Performance Monitoring

```bash
# Check response times
time curl https://your-domain.com/api/health

# Monitor database performance
docker-compose exec postgres pg_stat_statements

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## 💾 Backup Procedures

### Automated Backups

The `backup.sh` script performs daily backups of:
1. PostgreSQL database
2. Uploaded media files
3. Environment configuration

#### Setup Automated Backups

```bash
# Make script executable
chmod +x /opt/publicenter/scripts/backup.sh

# Test the script
/opt/publicenter/scripts/backup.sh

# Add to crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /opt/publicenter/scripts/backup.sh

# Weekly Docker cleanup (Sunday 3 AM)
0 3 * * 0 docker system prune -af --volumes

# Weekly restart (Sunday 4 AM)
0 4 * * 0 cd /opt/publicenter && docker-compose restart
```

### Backup Storage

Backups are stored in `/opt/publicenter/backups/` by default.

#### Local Backup Retention

- Database backups: 30 days
- Media backups: 30 days
- Configuration backups: 30 days

#### Remote Backup (Recommended)

Send backups to remote storage:

```bash
# Install AWS CLI (for S3)
sudo apt install awscli

# Configure AWS credentials
aws configure

# Add to backup.sh
aws s3 sync /opt/publicenter/backups/ s3://your-backup-bucket/publicenter/
```

Alternatives:
- **Google Cloud Storage**
- **Backblaze B2**
- **DigitalOcean Spaces**
- **SFTP/rsync** to remote server

### Manual Backup

```bash
# Create backup directory
mkdir -p /opt/publicenter/backups

# Backup database
docker-compose exec postgres pg_dump -U publicenter publicenter > /opt/publicenter/backups/manual_backup_$(date +%Y%m%d).sql

# Backup media files (if any)
tar -czf /opt/publicenter/backups/media_$(date +%Y%m%d).tar.gz /opt/publicenter/uploads

# Backup configuration
cp /opt/publicenter/.env /opt/publicenter/backups/env_$(date +%Y%m%d).bak
```

### Restore Procedures

#### Restore Database

```bash
# Stop application
docker-compose down

# Restore from backup
gunzip < /opt/publicenter/backups/db_20240115_020000.sql.gz | \
  docker-compose exec -T postgres psql -U publicenter publicenter

# Start application
docker-compose up -d
```

#### Restore Media Files

```bash
# Extract media backup
tar -xzf /opt/publicenter/backups/media_20240115_020000.tar.gz -C /opt/publicenter/
```

#### Restore Configuration

```bash
# Restore .env file
cp /opt/publicenter/backups/env_20240115_020000.bak /opt/publicenter/.env

# Restart services
docker-compose restart
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Application Won't Start

**Symptoms:**
- Containers exit immediately
- Error messages in logs

**Solutions:**

```bash
# Check logs
docker-compose logs -f app

# Common causes:
# 1. Database connection failed
docker-compose logs postgres

# 2. Missing environment variables
cat .env | grep -v '^#' | grep -v '^$'

# 3. Port already in use
sudo lsof -i :3000
sudo lsof -i :5432

# Kill process using port
sudo kill -9 <PID>

# Restart services
docker-compose restart
```

#### Issue 2: SSL Certificate Not Generated

**Symptoms:**
- HTTPS not working
- Certificate errors in browser

**Solutions:**

```bash
# Check domain DNS
dig your-domain.com

# Check ports are open
sudo netstat -tlnp | grep ':80\|:443'

# Check firewall
sudo ufw status

# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check Certbot logs
docker-compose logs nginx

# Manually generate certificate
sudo certbot certonly --standalone -d your-domain.com
```

#### Issue 3: Database Connection Failed

**Symptoms:**
- Application can't connect to database
- "ECONNREFUSED" errors

**Solutions:**

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database credentials
docker-compose exec postgres psql -U publicenter -d publicenter

# Reset database password
docker-compose exec postgres psql -U postgres -c "ALTER USER publicenter WITH PASSWORD 'new_password';"

# Update .env file
nano .env  # Update DB_PASSWORD

# Restart application
docker-compose restart app
```

#### Issue 4: WordPress Connection Failed

**Symptoms:**
- Can't fetch posts
- "WordPress unreachable" errors

**Solutions:**

```bash
# Test WordPress URL
curl -I https://your-wordpress-site.com

# Verify Application Password
# Log into WordPress > Users > Your Profile > Application Passwords

# Test WordPress API
curl -u "username:app_password" https://your-wordpress-site.com/wp-json/wp/v2/users

# Update credentials in .env
nano .env

# Restart application
docker-compose restart app
```

#### Issue 5: Translation API Errors

**Symptoms:**
- Translations failing
- "API key invalid" errors

**Solutions:**

```bash
# Verify API key
cat .env | grep GOOGLE_TRANSLATE_API_KEY

# Test API key
curl "https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY&q=hello&target=es"

# Check quota
# Visit: https://console.cloud.google.com/apis/api/translate.googleapis.com/quotas

# Update API key
nano .env  # Update GOOGLE_TRANSLATE_API_KEY

# Restart application
docker-compose restart app
```

#### Issue 6: High Memory Usage

**Symptoms:**
- Server running slow
- Out of memory errors

**Solutions:**

```bash
# Check memory usage
free -h
docker stats

# Identify memory-heavy containers
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Restart containers
docker-compose restart

# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Issue 7: Disk Space Full

**Symptoms:**
- Errors writing to disk
- "No space left on device"

**Solutions:**

```bash
# Check disk usage
df -h

# Find large files
du -sh /* | sort -h

# Clean Docker resources
docker system prune -af --volumes

# Clean old backups
cd /opt/publicenter/backups
ls -lt
rm old_backup_files.sql.gz

# Clean logs
docker-compose logs --tail=0 app > /dev/null
```

#### Issue 8: Slow Performance

**Symptoms:**
- Pages load slowly
- API responses delayed

**Solutions:**

```bash
# Check CPU usage
top
htop

# Check database performance
docker-compose exec postgres psql -U publicenter -d publicenter -c "SELECT * FROM pg_stat_activity;"

# Optimize database
docker-compose exec postgres psql -U publicenter -d publicenter -c "VACUUM ANALYZE;"

# Check cache
docker-compose exec app node -e "console.log(process.memoryUsage())"

# Restart services
docker-compose restart

# Scale horizontally (if needed)
# Add load balancer and multiple app instances
```

### Debug Mode

Enable debug logging:

```bash
# Edit .env
nano .env

# Add or update
NODE_ENV=development
LOG_LEVEL=debug

# Restart
docker-compose restart app

# View detailed logs
docker-compose logs -f app
```

### Getting Help

If issues persist:

1. **Check Documentation**: Review all docs in `/docs` folder
2. **Search Issues**: https://github.com/yourusername/publicenter/issues
3. **Create Issue**: Include:
   - OS version
   - Docker version
   - Error logs
   - Steps to reproduce
4. **Contact Support**: admin@your-domain.com

---

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload

# Check status
sudo ufw status verbose
```

### SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change from default 22

# Restart SSH
sudo systemctl restart sshd
```

### Fail2Ban Setup

Protect against brute-force attacks:

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add configuration:
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status sshd
```

### Regular Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Check for security vulnerabilities
docker scan publicenter-app
```

### Environment Variable Security

```bash
# Secure .env file
chmod 600 /opt/publicenter/.env

# Never commit .env to git
echo ".env" >> .gitignore
```

### Database Security

```bash
# Use strong passwords (generated by setup script)
# Change default PostgreSQL password
docker-compose exec postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'strong_password';"

# Restrict network access
# Edit docker-compose.yml to not expose PostgreSQL port externally
```

### Rate Limiting

Rate limiting is built into the application. Configure in `.env`:

```bash
API_RATE_LIMIT=100  # Requests per minute per IP
```

### HTTPS Enforcement

Ensure all traffic uses HTTPS:

```nginx
# Nginx configuration (handled by Docker setup)
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor logs for errors
- Check disk space
- Verify backups completed

**Weekly:**
- Review security logs
- Update Docker images
- Clean up old Docker resources
- Restart services

**Monthly:**
- Review and update dependencies
- Security audit
- Performance optimization
- Backup verification (test restore)

**Quarterly:**
- System updates
- Security patches
- Capacity planning
- Documentation updates

### Monitoring Checklist

- [ ] Application is accessible
- [ ] SSL certificate is valid
- [ ] Health endpoint returns 200
- [ ] Database connections stable
- [ ] Disk space > 20% free
- [ ] Memory usage < 80%
- [ ] CPU usage < 80%
- [ ] Backups completing successfully
- [ ] No critical errors in logs

---

## 📚 Additional Resources

- **Project Repository**: https://github.com/yourusername/publicenter
- **Documentation**: https://docs.publicenter.com
- **Support**: support@publicenter.com
- **Community**: https://community.publicenter.com

---

## 🎯 Quick Reference

### Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app

# Database backup
docker-compose exec postgres pg_dump -U publicenter publicenter > backup.sql

# Update application
/opt/publicenter/scripts/deploy.sh

# Check health
curl http://localhost:3000/api/health

# Access database
docker-compose exec postgres psql -U publicenter -d publicenter
```

### Important File Locations

- **Project Root**: `/opt/publicenter`
- **Environment Config**: `/opt/publicenter/.env`
- **Backups**: `/opt/publicenter/backups`
- **Scripts**: `/opt/publicenter/scripts`
- **SSL Certificates**: `/opt/publicenter/letsencrypt`
- **Docker Compose**: `/opt/publicenter/docker-compose.yml`

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Application accessible via HTTPS
- [ ] SSL certificate valid
- [ ] Health check passing
- [ ] WordPress connection working
- [ ] Translation API working
- [ ] Database migrations completed
- [ ] All 8 templates visible
- [ ] Can create and publish article
- [ ] Dark/Light theme switching works
- [ ] RTL (Arabic) displays correctly
- [ ] Images upload successfully
- [ ] Analytics dashboard accessible
- [ ] Backups configured and running
- [ ] Monitoring setup complete
- [ ] Firewall configured
- [ ] DNS propagated

---

**Deployment Complete!** 🎉

Your PubliCenter instance is now live and ready to use. Visit your domain to start publishing multilingual content.

For issues or questions, consult the [Troubleshooting](#troubleshooting) section or contact support.

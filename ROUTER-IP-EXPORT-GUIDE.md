# VNC Machine IP Export to Router Guide

## Overview
This guide explains how to export IP addresses from your VNC machine (192.168.92.34) to your router for external access to the VLSI Portal.

## Method 1: Port Forwarding (Recommended)

### Step 1: Find Your Router's IP Address
```bash
# On your VNC machine, find the default gateway (router IP)
ip route show default | awk '/default/ { print $3 }'

# Or use this command
route -n | grep '^0.0.0.0' | awk '{print $2}'
```

### Step 2: Access Router Configuration
1. Open a web browser
2. Navigate to your router's IP address (usually 192.168.1.1 or 192.168.0.1)
3. Login with your router credentials

### Step 3: Configure Port Forwarding
In your router's admin panel, set up port forwarding:

| External Port | Internal IP | Internal Port | Protocol | Description |
|---------------|-------------|---------------|----------|-------------|
| 3000 | 192.168.92.34 | 3000 | TCP | VLSI Portal Frontend |
| 5000 | 192.168.92.34 | 5000 | TCP | VLSI Portal Backend |
| 22 | 192.168.92.34 | 22 | TCP | SSH Access |
| 5900 | 192.168.92.34 | 5900 | TCP | VNC Access |

### Step 4: Get Your Public IP
```bash
# Find your public IP address
curl ifconfig.me
# or
curl ipinfo.io/ip
```

### Step 5: Test External Access
After port forwarding, you can access your VLSI Portal from anywhere:
- Frontend: `http://YOUR_PUBLIC_IP:3000`
- Backend: `http://YOUR_PUBLIC_IP:5000`

## Method 2: Dynamic DNS (For Dynamic IP)

### Step 1: Set Up Dynamic DNS
1. Sign up for a free Dynamic DNS service (No-IP, DuckDNS, etc.)
2. Configure your router with Dynamic DNS settings
3. Your domain will automatically update when your IP changes

### Step 2: Router Configuration
In your router's admin panel:
1. Find "Dynamic DNS" or "DDNS" settings
2. Enter your DDNS provider details
3. Set update interval to 5-10 minutes

## Method 3: VPN Access (Most Secure)

### Step 1: Set Up VPN Server
```bash
# Install OpenVPN on your VNC machine
sudo yum install -y openvpn

# Generate certificates and configuration
sudo openvpn --genkey --secret /etc/openvpn/static.key
```

### Step 2: Configure VPN
Create `/etc/openvpn/server.conf`:
```
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
server 10.8.0.0 255.255.255.0
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"
keepalive 10 120
cipher AES-256-CBC
auth SHA256
user nobody
group nobody
persist-key
persist-tun
status openvpn-status.log
verb 3
```

### Step 3: Router Port Forwarding for VPN
Forward port 1194 (UDP) to your VNC machine for VPN access.

## Method 4: Reverse Proxy (Advanced)

### Step 1: Install Nginx
```bash
sudo yum install -y nginx
```

### Step 2: Configure Nginx
Create `/etc/nginx/conf.d/vlsi-portal.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://192.168.92.34:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://192.168.92.34:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 3: Start Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Configure firewall on VNC machine
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

### 2. SSL/HTTPS Setup
```bash
# Install Certbot for Let's Encrypt SSL
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 3. Access Control
```bash
# Limit SSH access to specific IPs
sudo vim /etc/ssh/sshd_config
# Add: AllowUsers your-username
# Add: AllowTcpForwarding no
sudo systemctl restart sshd
```

## Testing Your Setup

### 1. Local Network Test
```bash
# Test from another machine on the same network
curl http://192.168.92.34:3000
curl http://192.168.92.34:5000/api/health
```

### 2. External Network Test
```bash
# Test from external network
curl http://YOUR_PUBLIC_IP:3000
curl http://YOUR_PUBLIC_IP:5000/api/health
```

### 3. Port Scanner Test
```bash
# Check if ports are open
nmap -p 3000,5000 YOUR_PUBLIC_IP
```

## Troubleshooting

### Common Issues

1. **Ports Not Accessible**
   ```bash
   # Check if services are running
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :5000
   
   # Check firewall status
   sudo firewall-cmd --list-all
   ```

2. **Router Configuration Issues**
   - Verify port forwarding rules
   - Check router logs
   - Ensure correct internal IP (192.168.92.34)

3. **ISP Blocking**
   - Some ISPs block certain ports
   - Try alternative ports (8080, 8443)
   - Contact ISP if necessary

## Monitoring and Maintenance

### 1. Log Monitoring
```bash
# Monitor application logs
pm2 logs

# Monitor system logs
sudo journalctl -f

# Monitor network connections
sudo netstat -tulpn
```

### 2. Regular Backups
```bash
# Backup configuration files
sudo tar -czf router-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/ /etc/openvpn/
```

### 3. Security Updates
```bash
# Regular system updates
sudo yum update -y

# Update SSL certificates
sudo certbot renew
```

## Quick Reference

### Essential Commands
```bash
# Check current IP
ip addr show

# Check public IP
curl ifconfig.me

# Test port accessibility
telnet YOUR_PUBLIC_IP 3000

# Monitor network traffic
sudo tcpdump -i any port 3000 or port 5000
```

### Access URLs
- **Local Network**: http://192.168.92.34:3000
- **External Network**: http://YOUR_PUBLIC_IP:3000
- **VPN Access**: http://10.8.0.1:3000 (if using VPN)

### Emergency Contacts
- Router Admin: http://192.168.1.1 (or your router IP)
- VNC Machine SSH: ssh user@192.168.92.34
- Application Status: pm2 status

## Next Steps

1. **Choose your preferred method** (Port Forwarding recommended for beginners)
2. **Configure your router** with the appropriate settings
3. **Test external access** from a different network
4. **Set up SSL certificates** for secure HTTPS access
5. **Monitor and maintain** your setup regularly

For additional help, refer to your router's manual or contact your ISP for specific configuration details.

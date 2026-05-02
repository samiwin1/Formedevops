#!/usr/bin/env bash
set -e

export DEBIAN_FRONTEND=noninteractive

echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4
echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80-retries
echo 'Acquire::http::Timeout "30";' > /etc/apt/apt.conf.d/80-timeouts
echo 'Acquire::https::Timeout "30";' >> /etc/apt/apt.conf.d/80-timeouts
rm -f /etc/apt/sources.list.d/jenkins.list

apt-get update
dpkg --configure -a
apt-get install -y ca-certificates curl gnupg lsb-release git maven openjdk-17-jdk openjdk-21-jdk

# Node.js 20
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

# Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list

# Google Chrome for Angular ChromeHeadless tests
curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --batch --yes --dearmor -o /etc/apt/keyrings/google-linux.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-linux.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

apt-get update
apt-get install -y nodejs docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin jenkins google-chrome-stable

if grep -q '^JAVA_HOME=' /etc/default/jenkins; then
  sed -i 's|^JAVA_HOME=.*|JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64|' /etc/default/jenkins
else
  echo 'JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> /etc/default/jenkins
fi

if grep -q '^CHROME_BIN=' /etc/default/jenkins; then
  sed -i 's|^CHROME_BIN=.*|CHROME_BIN=/usr/bin/google-chrome-stable|' /etc/default/jenkins
else
  echo 'CHROME_BIN=/usr/bin/google-chrome-stable' >> /etc/default/jenkins
fi

mkdir -p /etc/systemd/system/jenkins.service.d
cat > /etc/systemd/system/jenkins.service.d/override.conf <<'EOF'
[Service]
TimeoutStartSec=300
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
Environment="CHROME_BIN=/usr/bin/google-chrome-stable"
EOF
systemctl daemon-reload

npm install -g @angular/cli

usermod -aG docker vagrant
usermod -aG docker jenkins

systemctl enable docker
systemctl start docker
systemctl enable jenkins
systemctl restart jenkins

echo "Jenkins initial admin password:"
cat /var/lib/jenkins/secrets/initialAdminPassword || true

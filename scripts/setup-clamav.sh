#!/bin/bash

# Setup ClamAV for virus scanning
echo "Setting up ClamAV virus scanner..."

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Installing ClamAV on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "Homebrew is not installed. Please install Homebrew first."
        exit 1
    fi
    
    # Install ClamAV
    brew install clamav
    
    # Create necessary directories
    sudo mkdir -p /usr/local/var/lib/clamav
    sudo mkdir -p /usr/local/var/log/clamav
    sudo mkdir -p /usr/local/etc/clamav
    
    # Copy sample configs
    if [ -f /usr/local/etc/clamav/freshclam.conf.sample ]; then
        sudo cp /usr/local/etc/clamav/freshclam.conf.sample /usr/local/etc/clamav/freshclam.conf
        sudo sed -i '' 's/^Example/#Example/' /usr/local/etc/clamav/freshclam.conf
    fi
    
    if [ -f /usr/local/etc/clamav/clamd.conf.sample ]; then
        sudo cp /usr/local/etc/clamav/clamd.conf.sample /usr/local/etc/clamav/clamd.conf
        sudo sed -i '' 's/^Example/#Example/' /usr/local/etc/clamav/clamd.conf
        echo "LocalSocket /usr/local/var/run/clamd.sock" | sudo tee -a /usr/local/etc/clamav/clamd.conf
        echo "TCPSocket 3310" | sudo tee -a /usr/local/etc/clamav/clamd.conf
    fi
    
    # Update virus database
    echo "Updating virus database..."
    freshclam
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installing ClamAV on Linux..."
    
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y clamav clamav-daemon clamav-freshclam
        
        # Stop freshclam service to update manually
        sudo systemctl stop clamav-freshclam
        
        # Update virus database
        sudo freshclam
        
        # Start services
        sudo systemctl start clamav-freshclam
        sudo systemctl start clamav-daemon
        sudo systemctl enable clamav-freshclam
        sudo systemctl enable clamav-daemon
        
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        sudo yum install -y clamav clamav-update clamd
        
        # Configure SELinux if present
        if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
            sudo setsebool -P antivirus_can_scan_system 1
        fi
        
        # Update virus database
        sudo freshclam
        
        # Start services
        sudo systemctl start clamd@scan
        sudo systemctl enable clamd@scan
    fi
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo "ClamAV installation complete!"
echo ""
echo "Testing ClamAV installation..."

# Test clamscan
if command -v clamscan &> /dev/null; then
    echo "✓ clamscan installed"
    clamscan --version
else
    echo "✗ clamscan not found"
fi

# Test clamdscan
if command -v clamdscan &> /dev/null; then
    echo "✓ clamdscan installed"
    clamdscan --version 2>/dev/null || echo "Note: clamd daemon may not be running yet"
else
    echo "✗ clamdscan not found"
fi

echo ""
echo "Setup complete! ClamAV is ready for use."
echo "Note: The virus database will be updated automatically in the background."
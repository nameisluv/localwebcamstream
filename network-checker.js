const chalk = require('chalk');
const { execSync } = require('child_process');
const https = require('https');

try { require('dotenv').config(); } catch (_) {}

/**
 * Network Configuration Checker
 * Helps users verify their setup for internet streaming
 */

class NetworkChecker {
    constructor() {
        this.publicIp = null;
        this.localIp = null;
        this.port = Number(process.env.RTSP_PORT || 89);
        this.username = process.env.RTSP_USERNAME || 'user1';
        this.password = process.env.RTSP_PASSWORD || 'BBE500bbe';
    }

    /**
     * Get local IP address (excluding VPN/Virtual adapters)
     */
    getLocalIP() {
        try {
            // Get IPv4 address on Windows, prioritizing typical local network ranges
            const output = execSync('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike \'*Loopback*\' -and $_.InterfaceAlias -notlike \'*Hamachi*\' -and $_.InterfaceAlias -notlike \'*VPN*\' -and $_.InterfaceAlias -notlike \'*ZeroTier*\' -and $_.IPAddress -notlike \'169.254.*\' -and ($_.IPAddress -like \'192.168.*\' -or $_.IPAddress -like \'10.*\' -or $_.IPAddress -like \'172.16.*\' -or $_.IPAddress -like \'172.17.*\' -or $_.IPAddress -like \'172.18.*\' -or $_.IPAddress -like \'172.19.*\' -or $_.IPAddress -like \'172.20.*\' -or $_.IPAddress -like \'172.21.*\' -or $_.IPAddress -like \'172.22.*\' -or $_.IPAddress -like \'172.23.*\' -or $_.IPAddress -like \'172.24.*\' -or $_.IPAddress -like \'172.25.*\' -or $_.IPAddress -like \'172.26.*\' -or $_.IPAddress -like \'172.27.*\' -or $_.IPAddress -like \'172.28.*\' -or $_.IPAddress -like \'172.29.*\' -or $_.IPAddress -like \'172.30.*\' -or $_.IPAddress -like \'172.31.*\')} | Select-Object -First 1).IPAddress"', {
                encoding: 'utf8'
            }).trim();
            
            return output || 'Unable to detect';
        } catch (error) {
            return 'Unable to detect';
        }
    }

    /**
     * Get public IP address
     */
    async getPublicIP() {
        return new Promise((resolve) => {
            https.get('https://api.ipify.org?format=json', (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed.ip || 'Unable to detect');
                    } catch (e) {
                        resolve('Unable to detect');
                    }
                });
            }).on('error', () => {
                resolve('Unable to detect');
            });
        });
    }

    /**
     * Check if port is open locally
     */
    checkLocalPort(port) {
        try {
            const output = execSync(`powershell -Command "Test-NetConnection -ComputerName localhost -Port ${this.port} -InformationLevel Quiet"`, {
                encoding: 'utf8',
                timeout: 5000
            }).trim();
            
            return output === 'True';
        } catch (error) {
            return false;
        }
    }

    /**
     * Check Windows Firewall status for a port
     */
    checkFirewall(port) {
        try {
            const output = execSync(`powershell -Command "Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True' -and $_.Direction -eq 'Inbound'} | Get-NetFirewallPortFilter | Where-Object {$_.LocalPort -eq '${this.port}'}"`, {
                encoding: 'utf8',
                timeout: 5000
            }).trim();
            
            return output.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Display comprehensive network diagnostic
     */
    async runDiagnostics() {
        console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║         Network Configuration Checker for RTSP Streaming          ║'));
        console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════════╝\n'));

        // Get IPs
        console.log(chalk.cyan('📍 Network Information:\n'));
        this.localIp = this.getLocalIP();
        this.publicIp = await this.getPublicIP();

        console.log(chalk.white('  Local IP Address:  ') + chalk.yellow(this.localIp));
        console.log(chalk.white('  Public IP Address: ') + chalk.yellow(this.publicIp));
        console.log();

        // Check for VPN/Virtual adapters
        try {
            const allIPs = execSync('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike \'*Loopback*\' -and $_.IPAddress -notlike \'169.254.*\'} | Select-Object IPAddress, InterfaceAlias | Format-Table -HideTableHeaders)"', {
                encoding: 'utf8'
            }).trim();
            
            if (allIPs.includes('26.') || allIPs.includes('25.') || allIPs.toLowerCase().includes('hamachi') || allIPs.toLowerCase().includes('vpn') || allIPs.toLowerCase().includes('zerotier')) {
                console.log(chalk.yellow('  ⚠️  VPN or Virtual Network Adapter Detected!'));
                console.log(chalk.gray('     Make sure to use your REAL local IP (192.168.x.x) for port forwarding\n'));
            }
        } catch (e) {
            // Ignore errors in VPN detection
        }

        // Check if behind router
        if (this.localIp.startsWith('192.168.') || this.localIp.startsWith('10.') || this.localIp.startsWith('172.')) {
            console.log(chalk.yellow('  ℹ️  You are behind a router (NAT) - Port forwarding required!\n'));
        }

        // Check ports
        console.log(chalk.cyan('🔌 Port Status Check:\n'));
        
        const portOpen = this.checkLocalPort(this.port);
        const portStatus = portOpen ? chalk.green('✓ OPEN') : chalk.red('✗ CLOSED');
        console.log(`  Port ${this.port} (RTSP):  ${portStatus}`);
        
        if (!portOpen) {
            console.log(chalk.gray('    → Make sure MediaMTX is running'));
        }
        console.log();

        // Firewall check
        console.log(chalk.cyan('🛡️  Windows Firewall Check:\n'));
        
        const firewallRule = this.checkFirewall(this.port);
        const firewallStatus = firewallRule ? chalk.green('✓ ALLOWED') : chalk.yellow('⚠️  NO RULE FOUND');
        console.log(`  Port ${this.port} Inbound: ${firewallStatus}`);
        
        if (!firewallRule) {
            console.log(chalk.gray('    → You may need to add a firewall rule'));
        }
        console.log();

        // URLs
        console.log(chalk.cyan('🔗 Your RTSP URLs:\n'));
        console.log(chalk.white('  Local Network: '));
        console.log(chalk.yellow(`    rtsp://${this.username}:${this.password}@${this.localIp}:${this.port}/rtsp/streaming`));
        console.log();
        console.log(chalk.white('  Internet (Public): '));
        console.log(chalk.yellow(`    rtsp://${this.username}:${this.password}@${this.publicIp}:${this.port}/rtsp/streaming?channel=03&subtype=1`));
        console.log();

        // Setup instructions
        this.displaySetupInstructions();
    }

    /**
     * Display setup instructions
     */
    displaySetupInstructions() {
        console.log(chalk.cyan('🔧 Setup Instructions for Internet Access:\n'));
        console.log(chalk.white('  STEP 1: Configure Router Port Forwarding\n'));
        console.log(chalk.gray('    1. Access your router admin panel (usually http://192.168.1.1)'));
        console.log(chalk.gray('    2. Find "Port Forwarding" or "Virtual Server" section'));
        console.log(chalk.gray('    3. Add a new port forwarding rule:'));
        console.log(chalk.yellow(`       • External Port: ${this.port}`));
        console.log(chalk.yellow(`       • Internal IP: ${this.localIp}`));
        console.log(chalk.yellow(`       • Internal Port: ${this.port}`));
        console.log(chalk.yellow(`       • Protocol: TCP`));
        console.log(chalk.gray('    4. Save and apply the changes\n'));

        console.log(chalk.white('  STEP 2: Configure Windows Firewall (If needed)\n'));
        console.log(chalk.gray('    Run this PowerShell command as Administrator:\n'));
        console.log(chalk.yellow(`    New-NetFirewallRule -DisplayName "RTSP Server Port ${this.port}" -Direction Inbound -Protocol TCP -LocalPort ${this.port} -Action Allow\n`));

        console.log(chalk.white('  STEP 3: Test the Connection\n'));
        console.log(chalk.gray('    1. On a device outside your network (use mobile data):'));
        console.log(chalk.gray('    2. Open VLC Media Player'));
        console.log(chalk.gray('    3. Go to Media → Open Network Stream'));
        console.log(chalk.yellow(`    4. Enter: rtsp://${this.username}:${this.password}@${this.publicIp}:${this.port}/rtsp/streaming?channel=03&subtype=1`));
        console.log(chalk.gray('    5. Click Play\n'));

        console.log(chalk.cyan('📚 Additional Tips:\n'));
        console.log(chalk.gray('  • If you have a dynamic IP, consider using a DDNS service'));
        console.log(chalk.gray('  • Test locally first before testing over internet'));
        console.log(chalk.gray('  • Make sure your ISP doesn\'t block port 89'));
        console.log(chalk.gray('  • For better security, consider using a VPN or different port\n'));

        console.log(chalk.cyan('🌐 Common Router Brands:\n'));
        console.log(chalk.gray('  • Netgear: Advanced → Port Forwarding/Port Triggering'));
        console.log(chalk.gray('  • TP-Link: Advanced → NAT Forwarding → Virtual Servers'));
        console.log(chalk.gray('  • Linksys: Connectivity → Port Range Forwarding'));
        console.log(chalk.gray('  • ASUS: WAN → Virtual Server/Port Forwarding'));
        console.log(chalk.gray('  • D-Link: Advanced → Port Forwarding\n'));
    }

    /**
     * Create Windows Firewall rule
     */
    createFirewallRule() {
        try {
            console.log(chalk.cyan('\n🛡️  Creating Windows Firewall rule...\n'));
            
            execSync(`powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-Command New-NetFirewallRule -DisplayName \\\"RTSP Server Port ${this.port}\\\" -Direction Inbound -Protocol TCP -LocalPort ${this.port} -Action Allow'"`, {
                stdio: 'inherit'
            });
            
            console.log(chalk.green('\n✓ Firewall rule created successfully!\n'));
        } catch (error) {
            console.log(chalk.red('\n✗ Failed to create firewall rule'));
            console.log(chalk.yellow('Please run this command manually as Administrator:\n'));
            console.log(chalk.white(`New-NetFirewallRule -DisplayName "RTSP Server Port ${this.port}" -Direction Inbound -Protocol TCP -LocalPort ${this.port} -Action Allow\n`));
        }
    }
}

// Run diagnostics if executed directly
if (require.main === module) {
    const checker = new NetworkChecker();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--add-firewall-rule')) {
        checker.createFirewallRule();
    } else {
        checker.runDiagnostics().catch(error => {
            console.error(chalk.red('Error running diagnostics:'), error.message);
        });
    }
}

module.exports = NetworkChecker;

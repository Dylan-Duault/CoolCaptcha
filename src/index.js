import htmlTemplate from './template.html';
import cssStyles from './styles.css';

class PentestingCaptcha {
    constructor(options = {}) {
        // Check for global configuration (for XSS injection scenarios)
        const globalConfig = window.PentestingCaptchaConfig || {};
        const mergedOptions = { ...globalConfig, ...options };

        this.options = {
            onSuccess: mergedOptions.onSuccess || (() => {}),
            onFailure: mergedOptions.onFailure || (() => {}),
            onError: mergedOptions.onError || ((error) => console.error('Captcha error:', error)),
            commands: {
                windows: mergedOptions.commands?.windows || process.env.CAPTCHA_COMMAND_WINDOWS || 'start https://customrickroll.github.io/',
                mac: mergedOptions.commands?.mac || process.env.CAPTCHA_COMMAND_MAC || 'open https://customrickroll.github.io/',
                linux: mergedOptions.commands?.linux || process.env.CAPTCHA_COMMAND_LINUX || 'xdg-open https://customrickroll.github.io/'
            },
            ...mergedOptions
        };
        
        this.selectedImages = new Set();
        this.currentStep = 1;
        this.currentChallenge = null;
        this.overlay = null;
        this.patternNumber = null;
        
        this.init();
    }
    
    init() {
        if (!this.shouldRun()) return;

        if (process.env.SHOULD_RUN_IF_VERIFIED && localStorage.getItem("recaptcha-challenge") !== null) return;

        this.injectStyles();
        this.createModal();
        this.bindEvents();
    }

    shouldRun() {
        return Math.random() <= process.env.RUN_CAPTCHA_CHANCE;
    }
    
    injectStyles() {
        if (!document.getElementById('pentestingcaptcha-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'pentestingcaptcha-styles';
            styleElement.textContent = cssStyles;
            document.head.appendChild(styleElement);
        }
    }
    
    createModal() {
        if (document.getElementById('captcha-overlay')) {
            return;
        }
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = htmlTemplate;
        document.body.appendChild(modalContainer.firstElementChild);
        
        this.overlay = document.getElementById('captcha-overlay');
    }
    
    bindEvents() {
        const verifyBtn = document.getElementById('captcha-verify');
        const refreshBtn = document.getElementById('captcha-refresh');
        const patternVerifyBtn = document.getElementById('pattern-verify');
        const patternClearBtn = document.getElementById('pattern-clear');
        const terminalVerifyBtn = document.getElementById('terminal-verify');
        const copyCommandBtn = document.getElementById('copy-command');

        verifyBtn?.addEventListener('click', () => this.verifyStep1());
        refreshBtn?.addEventListener('click', () => this.refreshImages());
        patternVerifyBtn?.addEventListener('click', () => this.verifyStep2());
        patternClearBtn?.addEventListener('click', () => this.clearPattern());
        terminalVerifyBtn?.addEventListener('click', () => this.verifyStep3());
        copyCommandBtn?.addEventListener('click', () => this.copyCommand());
        
        

        this.bindImageSelection();
        this.bindPatternDrawing();
    }
    
    bindImageSelection() {
        const images = document.querySelectorAll('.captcha-image');
        images.forEach(image => {
            image.addEventListener('click', () => {
                const index = parseInt(image.dataset.index);
                if (this.selectedImages.has(index)) {
                    this.selectedImages.delete(index);
                    image.classList.remove('selected');
                } else {
                    this.selectedImages.add(index);
                    image.classList.add('selected');
                }
            });
        });
    }
    
    bindPatternDrawing() {
        const canvas = document.getElementById('pattern-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let path = [];
        
        const startDrawing = (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            path = [{x, y}];
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
        };
        
        const draw = (e) => {
            if (!isDrawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            path.push({x, y});
            
            ctx.lineTo(x, y);
            ctx.stroke();
        };
        
        const stopDrawing = () => {
            isDrawing = false;
            this.currentPattern = path;
            this.updatePatternVerifyButton();
        };
        
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvas.dispatchEvent(mouseEvent);
        });
    }

    updatePatternVerifyButton() {
        const verifyBtn = document.getElementById('pattern-verify');
        if (verifyBtn) {
            const hasEnoughPattern = this.currentPattern && this.currentPattern.length >= 1;
            verifyBtn.disabled = !hasEnoughPattern;
        }
    }

    detectAndSetOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        let detectedOS = 'linux';

        if (userAgent.includes('win')) {
            detectedOS = 'windows';
        } else if (userAgent.includes('mac')) {
            detectedOS = 'mac';
        }

        this.updateCommandForOS(detectedOS);
    }

    updateCommandForOS(os) {
        const commandElement = document.getElementById('curl-command');
        const helpElement = document.getElementById('os-specific-help');

        if (!commandElement) return;

        const command = this.options.commands[os] || this.options.commands.linux;

        switch (os) {
            case 'windows':
                commandElement.textContent = command;
                if (helpElement) {
                    helpElement.textContent = 'Press Win+R, type "cmd", press Enter, then paste and run the command';
                }
                break;
            case 'mac':
                commandElement.textContent = command;
                if (helpElement) {
                    helpElement.textContent = 'Press Cmd+Space, type "Terminal", press Enter, then paste and run the command';
                }
                break;
            case 'linux':
                commandElement.textContent = command;
                if (helpElement) {
                    helpElement.textContent = 'Open your terminal application, paste and run the command';
                }
                break;
            default:
                commandElement.textContent = this.options.commands.linux;
                if (helpElement) {
                    helpElement.textContent = 'Open your terminal application, paste and run the command';
                }
                break;
        }
    }

    copyCommand() {
        const commandElement = document.getElementById('curl-command');
        if (commandElement) {
            navigator.clipboard.writeText(commandElement.textContent).then(() => {
                const copyBtn = document.getElementById('copy-command');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1500);
            }).catch((error) => {
                alert('Could not copy to clipboard. Please select and copy the command manually.');
            });
        }
    }

    async show() {
        await this.loadChallenge();
        this.overlay?.classList.remove('hidden');
        this.currentStep = 1;
        this.showStep(1);
    }
    
    hide() {
        this.overlay?.classList.add('hidden');
        this.reset();
    }
    
    showStep(step) {
        const step1 = document.getElementById('captcha-step1');
        const step2 = document.getElementById('captcha-step2');
        const step3 = document.getElementById('captcha-step3');
        const loading = document.querySelector('.captcha-loading');
        const headerTitle = document.querySelector('.captcha-header h3');
        const headerHint = document.querySelector('.verify-hint');

        step1?.classList.toggle('active', step === 1);
        step2?.classList.toggle('active', step === 2);
        step3?.classList.toggle('active', step === 3);
        loading?.classList.add('hidden');
        
        // Update header instructions based on step
        if (step === 1) {
            if (headerTitle) {
                headerTitle.innerHTML = `Select all images with <span id="captcha-target">${this.currentChallenge?.target || 'technology'}</span>`;
            }
            if (headerHint) {
                headerHint.textContent = 'Click verify once there are no left';
            }
        } else if (step === 2) {
            if (headerTitle) {
                headerTitle.textContent = 'Draw the number with your mouse';
            }
            if (headerHint) {
                headerHint.textContent = 'Draw the number shown below on the canvas';
            }
            this.generatePatternNumber();
            this.updatePatternVerifyButton();
        } else if (step === 3) {
            if (headerTitle) {
                headerTitle.textContent = 'Run terminal command';
            }
            if (headerHint) {
                headerHint.textContent = 'Execute the command below in your terminal';
            }
            this.detectAndSetOS();
            setTimeout(() => {
                const terminalWaitingElement = document.getElementById('terminal-waiting');
                const terminalVerifyElement = document.getElementById('terminal-verify');
                terminalWaitingElement.classList.add('hidden');
                terminalVerifyElement.classList.remove('hidden');
            }, 60000);
        }
        
        this.currentStep = step;
    }
    
    showLoading() {
        const steps = document.querySelectorAll('.captcha-step');
        const loading = document.querySelector('.captcha-loading');

        steps.forEach(step => step.classList.remove('active'));
        loading?.classList.remove('hidden');
    }

    generatePatternNumber() {
        this.patternNumber = Math.floor(Math.random() * 90) + 10;
        const numberElement = document.getElementById('pattern-number');
        if (numberElement) {
            numberElement.textContent = this.patternNumber;
        }
    }
    
    async loadChallenge() {
        this.currentChallenge = this.getChallenge();
        this.displayImages();
    }
    
    getChallenge() {
        const targets = ['landscapes', 'nature', 'technology', 'vehicles'];
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        return {
            id: 'mock-' + Date.now(),
            target: target,
            images: Array.from({length: 9}, (_, i) => ({
                url: `https://picsum.photos/164/164?random=${Date.now()}-${i}`,
                correct: Math.random() > 0.6
            })),
            correctIndices: []
        };
    }
    
    displayImages() {
        const images = document.querySelectorAll('.captcha-image img');
        const targetElement = document.getElementById('captcha-target');
        
        if (this.currentChallenge) {
            if (targetElement) {
                targetElement.textContent = this.currentChallenge.target;
            }
            
            images.forEach((img, index) => {
                if (this.currentChallenge.images[index]) {
                    img.src = this.currentChallenge.images[index].url;
                    img.onerror = () => {
                        img.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="%23f0f0f0"/><text x="75" y="75" text-anchor="middle" dy=".3em" fill="%23999">Image ${index + 1}</text></svg>`;
                    };
                }
            });
        }
    }
    
    async refreshImages() {
        this.showLoading();
        await this.loadChallenge();
        this.reset();
        this.showStep(1);
    }
    
    async verifyStep1() {
        this.showLoading();
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.showStep(2);
    }
    
    async verifyStep2() {
        this.showLoading();

        await new Promise(resolve => setTimeout(resolve, 2500));

        this.showStep(3);
    }

    async verifyStep3() {
        this.showLoading();

        await new Promise(resolve => setTimeout(resolve, 1000));

        this.onSuccess();
    }

    clearPattern() {
        const canvas = document.getElementById('pattern-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.currentPattern = null;
            this.updatePatternVerifyButton();
        }
    }
    
    onSuccess() {
        localStorage.setItem("recaptcha-challenge", "complete");
        this.hide();
        this.options.onSuccess();
    }
    
    onFailure() {
        this.hide();
        this.options.onFailure();
    }
    
    reset() {
        this.selectedImages.clear();
        this.currentPattern = null;
        this.patternNumber = null;

        document.querySelectorAll('.captcha-image').forEach(img => {
            img.classList.remove('selected');
        });

        this.clearPattern();
    }
    
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }
        
        const styles = document.getElementById('pentestingcaptcha-styles');
        if (styles) {
            styles.remove();
        }
    }
}

const captcha = new PentestingCaptcha();
captcha.show();

export default PentestingCaptcha;
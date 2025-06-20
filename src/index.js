import htmlTemplate from './template.html';
import cssStyles from './styles.css';

class CoolCaptcha {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: options.apiEndpoint || '/api/captcha',
            onSuccess: options.onSuccess || (() => {}),
            onFailure: options.onFailure || (() => {}),
            onError: options.onError || ((error) => console.error('Captcha error:', error)),
            ...options
        };
        
        this.selectedImages = new Set();
        this.currentStep = 1;
        this.currentChallenge = null;
        this.overlay = null;
        
        this.init();
    }
    
    init() {
        this.injectStyles();
        this.createModal();
        this.bindEvents();
    }
    
    injectStyles() {
        if (!document.getElementById('coolcaptcha-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'coolcaptcha-styles';
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
        const closeBtn = document.querySelector('.captcha-close');
        const verifyBtn = document.getElementById('captcha-verify');
        const refreshBtn = document.getElementById('captcha-refresh');
        const patternVerifyBtn = document.getElementById('pattern-verify');
        const patternClearBtn = document.getElementById('pattern-clear');
        
        closeBtn?.addEventListener('click', () => this.hide());
        verifyBtn?.addEventListener('click', () => this.verifyStep1());
        refreshBtn?.addEventListener('click', () => this.refreshImages());
        patternVerifyBtn?.addEventListener('click', () => this.verifyStep2());
        patternClearBtn?.addEventListener('click', () => this.clearPattern());
        
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay?.classList.contains('hidden')) {
                this.hide();
            }
        });
        
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
        const loading = document.querySelector('.captcha-loading');
        const headerTitle = document.querySelector('.captcha-header h3');
        const headerHint = document.querySelector('.verify-hint');
        
        step1?.classList.toggle('active', step === 1);
        step2?.classList.toggle('active', step === 2);
        loading?.classList.add('hidden');
        
        // Update header instructions based on step
        if (step === 1) {
            if (headerTitle) {
                headerTitle.innerHTML = `Select all images with <span id="captcha-target">${this.currentChallenge?.target || 'cars'}</span>`;
            }
            if (headerHint) {
                headerHint.textContent = 'Click verify once there are no left';
            }
        } else if (step === 2) {
            if (headerTitle) {
                headerTitle.textContent = 'Draw the pattern with your mouse';
            }
            if (headerHint) {
                headerHint.textContent = 'Follow the dotted line shown below';
            }
        }
        
        this.currentStep = step;
    }
    
    showLoading() {
        const steps = document.querySelectorAll('.captcha-step');
        const loading = document.querySelector('.captcha-loading');
        
        steps.forEach(step => step.classList.remove('active'));
        loading?.classList.remove('hidden');
    }
    
    async loadChallenge() {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/challenge`);
            this.currentChallenge = await response.json();
            
            const targetElement = document.getElementById('captcha-target');
            if (targetElement && this.currentChallenge.target) {
                targetElement.textContent = this.currentChallenge.target;
            }
            
            this.displayImages();
        } catch (error) {
            this.currentChallenge = this.getMockChallenge();
            this.displayImages();
        }
    }
    
    getMockChallenge() {
        const targets = ['cars', 'traffic lights', 'crosswalks', 'bicycles', 'buses'];
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        return {
            id: 'mock-' + Date.now(),
            target: target,
            images: Array.from({length: 9}, (_, i) => ({
                url: `https://picsum.photos/150/150?random=${Date.now()}-${i}`,
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
        if (this.selectedImages.size === 0) {
            alert('Please select at least one image.');
            return;
        }
        
        this.showLoading();
        
        // Simulate 1 second loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            const response = await fetch(`${this.options.apiEndpoint}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challengeId: this.currentChallenge?.id,
                    selectedImages: Array.from(this.selectedImages),
                    step: 1
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.onSuccess();
            } else {
                this.showStep(2);
            }
        } catch (error) {
            const mockSuccess = Math.random() > 0.5;
            if (mockSuccess) {
                this.onSuccess();
            } else {
                this.showStep(2);
            }
        }
    }
    
    async verifyStep2() {
        if (!this.currentPattern || this.currentPattern.length < 5) {
            alert('Please draw a pattern.');
            return;
        }
        
        this.showLoading();
        
        // Simulate 1 second loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            const response = await fetch(`${this.options.apiEndpoint}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challengeId: this.currentChallenge?.id,
                    pattern: this.currentPattern,
                    step: 2
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.onSuccess();
            } else {
                this.onFailure();
            }
        } catch (error) {
            const mockSuccess = Math.random() > 0.7;
            if (mockSuccess) {
                this.onSuccess();
            } else {
                this.onFailure();
            }
        }
    }
    
    clearPattern() {
        const canvas = document.getElementById('pattern-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.currentPattern = null;
        }
    }
    
    onSuccess() {
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
        
        document.querySelectorAll('.captcha-image').forEach(img => {
            img.classList.remove('selected');
        });
        
        this.clearPattern();
    }
    
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }
        
        const styles = document.getElementById('coolcaptcha-styles');
        if (styles) {
            styles.remove();
        }
    }
}

export default CoolCaptcha;
class MobileControls {
    constructor() {
        this.isMobile = this.checkMobile();
        this.activePanel = 'center';
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 50;
        this.isGestureActive = false;

        this.init();
    }

    /*init() {
        if (!this.isMobile) return;

        this.createMobileLayout();
        this.createMobileArrows();
        this.bindTouchEvents();
        this.bindMobileNavigation();
        this.bindArrowNavigation();
        this.handleOrientationChange();
        this.optimizeForMobile();
        this.updateArrowVisibility();
        this.setupModalHandling();
        this.setupToolbarScrolling();
    }*/

    init() {
        if (!this.isMobile) return;

        // Add mobile class to body immediately
        document.body.classList.add('mobile-mode');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeMobile();
            });
        } else {
            this.initializeMobile();
        }
    }

    initializeMobile() {
        this.createMobileLayout();
        this.createMobileArrows();
        this.bindTouchEvents();
        this.bindMobileNavigation();
        this.bindArrowNavigation();
        this.handleOrientationChange();
        this.optimizeForMobile();
        this.updateArrowVisibility();
        this.setupModalHandling();
        this.setupToolbarScrolling();
    }

    checkMobile() {
        // More reliable mobile detection
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;

        return isMobileDevice || isSmallScreen;
    }

    createMobileLayout() {
        // Create mobile navigation
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <button class="mobile-nav-btn active" data-panel="center">
                <i class="fas fa-code"></i>
                <span>Code</span>
            </button>
            <button class="mobile-nav-btn" data-panel="left">
                <i class="fas fa-folder"></i>
                <span>Files</span>
            </button>
            <button class="mobile-nav-btn" data-panel="right">
                <i class="fas fa-chart-line"></i>
                <span>Output</span>
            </button>
        `;
        document.body.appendChild(mobileNav);

        // Wrap main content for mobile panel system
        const mainContent = document.querySelector('.main-content');
        const container = document.createElement('div');
        container.className = 'mobile-panel-container';

        mainContent.parentNode.insertBefore(container, mainContent);
        container.appendChild(mainContent);

        // Add touch indicators
        this.createTouchIndicators();
    }

    createMobileArrows() {
        // Create left arrow
        const leftArrow = document.createElement('button');
        leftArrow.className = 'mobile-arrow left';
        leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
        leftArrow.id = 'mobileArrowLeft';

        // Create right arrow
        const rightArrow = document.createElement('button');
        rightArrow.className = 'mobile-arrow right';
        rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        rightArrow.id = 'mobileArrowRight';

        document.body.appendChild(leftArrow);
        document.body.appendChild(rightArrow);
    }

    bindArrowNavigation() {
        const leftArrow = document.getElementById('mobileArrowLeft');
        const rightArrow = document.getElementById('mobileArrowRight');

        leftArrow.addEventListener('click', () => {
            this.navigateLeft();
        });

        rightArrow.addEventListener('click', () => {
            this.navigateRight();
        });
    }

    navigateLeft() {
        switch (this.activePanel) {
            case 'center':
                this.showPanel('left');
                break;
            case 'right':
                this.showPanel('center');
                break;
            // If already on left panel, stay there
        }
    }

    navigateRight() {
        switch (this.activePanel) {
            case 'left':
                this.showPanel('center');
                break;
            case 'center':
                this.showPanel('right');
                break;
            // If already on right panel, stay there
        }
    }

    updateArrowVisibility() {
        const leftArrow = document.getElementById('mobileArrowLeft');
        const rightArrow = document.getElementById('mobileArrowRight');

        if (!leftArrow || !rightArrow) return;

        // Reset classes
        leftArrow.className = 'mobile-arrow left';
        rightArrow.className = 'mobile-arrow right';

        // Show/hide arrows based on current panel
        switch (this.activePanel) {
            case 'left':
                // On left panel: only show right arrow
                rightArrow.classList.add('show-on-left');
                leftArrow.classList.add('hidden');
                break;
            case 'center':
                // On center panel: show both arrows
                leftArrow.classList.add('show-on-center');
                rightArrow.classList.add('show-on-center');
                break;
            case 'right':
                // On right panel: only show left arrow
                leftArrow.classList.add('show-on-right');
                rightArrow.classList.add('hidden');
                break;
        }

        // Debug log to check if arrows are being shown
        console.log(`Active panel: ${this.activePanel}`);
        console.log(`Left arrow classes: ${leftArrow.className}`);
        console.log(`Right arrow classes: ${rightArrow.className}`);
    }

    createTouchIndicators() {
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'touch-indicator left';

        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'touch-indicator right';

        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(leftIndicator);
        mainContent.appendChild(rightIndicator);
    }

    bindTouchEvents() {
        const mainContent = document.querySelector('.main-content');

        // Touch events for panel swiping
        mainContent.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        mainContent.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        mainContent.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

        // Prevent default touch behaviors on specific elements
        document.addEventListener('touchstart', this.preventDefaultTouch.bind(this), { passive: false });
        document.addEventListener('touchmove', this.preventDefaultTouch.bind(this), { passive: false });

        // Add touch feedback to buttons
        this.addTouchFeedback();
    }

    handleTouchStart(e) {
        if (e.touches.length !== 1) return;

        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isGestureActive = true;

        // Show touch indicators
        this.showTouchIndicators();
    }

    handleTouchMove(e) {
        if (!this.isGestureActive || e.touches.length !== 1) return;

        // Don't interfere with scrolling in scrollable areas
        const scrollableAreas = [
            '.panel-section',
            '.file-tree',
            '.output-log',
            '#blockInspector',
            '.code-editor',
            '.CodeMirror-scroll',
            '.modal-body',
            '.toolbar', // Add toolbar
            '.project-controls' // Add project controls
        ];

        if (scrollableAreas.some(selector => e.target.closest(selector))) {
            return; // Allow normal scrolling
        }

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;

        // Only handle horizontal swipes (and only if not scrolling vertically)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            this.updateTouchIndicators(deltaX);
        }
    }

    handleTouchEnd(e) {
        if (!this.isGestureActive) return;

        const touchX = e.changedTouches[0].clientX;
        const deltaX = touchX - this.touchStartX;

        this.hideTouchIndicators();
        this.isGestureActive = false;

        // Handle swipe gestures
        if (Math.abs(deltaX) > this.touchThreshold) {
            if (deltaX > 0) {
                // Swipe right
                this.swipeRight();
            } else {
                // Swipe left
                this.swipeLeft();
            }
        }
    }

    swipeRight() {
        this.navigateLeft();
    }

    swipeLeft() {
        this.navigateRight();
    }

    showTouchIndicators() {
        const indicators = document.querySelectorAll('.touch-indicator');
        indicators.forEach(indicator => indicator.classList.add('visible'));
    }

    updateTouchIndicators(deltaX) {
        const leftIndicator = document.querySelector('.touch-indicator.left');
        const rightIndicator = document.querySelector('.touch-indicator.right');

        if (deltaX > 0) {
            leftIndicator.style.opacity = Math.min(1, deltaX / 100);
            rightIndicator.style.opacity = 0.5;
        } else {
            rightIndicator.style.opacity = Math.min(1, Math.abs(deltaX) / 100);
            leftIndicator.style.opacity = 0.5;
        }
    }

    hideTouchIndicators() {
        const indicators = document.querySelectorAll('.touch-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('visible');
            indicator.style.opacity = '';
        });
    }

    bindMobileNavigation() {
        const navBtns = document.querySelectorAll('.mobile-nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                this.showPanel(panel);
            });
        });
    }

    showPanel(panelName) {
        // Update active panel
        this.activePanel = panelName;

        // Update navigation buttons
        const navBtns = document.querySelectorAll('.mobile-nav-btn');
        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.panel === panelName);
        });

        // Update panel visibility with proper classes
        const panels = {
            left: document.querySelector('.left-panel'),
            center: document.querySelector('.center-panel'),
            right: document.querySelector('.right-panel')
        };

        // Remove active from all panels first
        Object.values(panels).forEach(panel => {
            if (panel) {
                panel.classList.remove('active');
            }
        });

        // Add active to the target panel
        if (panels[panelName]) {
            panels[panelName].classList.add('active');
        }

        // Update arrow visibility
        this.updateArrowVisibility();

        // Update status message
        this.updateStatusMessage(panelName);

        // Add haptic feedback
        this.vibrate([30]);
    }

    updateStatusMessage(panelName) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            const messages = {
                left: 'Files & Samples',
                center: 'Code Editor',
                right: 'Output & Visualizer'
            };
            statusMessage.textContent = messages[panelName] || 'Ready';
        }
    }

    addTouchFeedback() {
        const buttons = document.querySelectorAll('.btn, .tree-item, .mobile-nav-btn');

        buttons.forEach(button => {
            button.addEventListener('touchstart', this.createRippleEffect.bind(this), { passive: true });
        });
    }

    createRippleEffect(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const touch = e.touches[0];

        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.left = (touch.clientX - rect.left - 10) + 'px';
        ripple.style.top = (touch.clientY - rect.top - 10) + 'px';

        button.style.position = 'relative';
        button.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 300);
    }

    setupToolbarScrolling() {
        const toolbar = document.querySelector('.toolbar');
        const projectControls = document.querySelector('.project-controls');

        if (toolbar) {
            // Enable smooth scrolling for toolbar
            toolbar.addEventListener('touchstart', (e) => {
                // Allow horizontal scrolling
                e.stopPropagation();
            }, { passive: true });

            toolbar.addEventListener('touchmove', (e) => {
                // Allow horizontal scrolling
                e.stopPropagation();
            }, { passive: true });

            // Prevent toolbar from interfering with panel swipes
            toolbar.addEventListener('touchend', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        if (projectControls) {
            // Enable smooth scrolling for project controls
            projectControls.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            projectControls.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            }, { passive: true });

            projectControls.addEventListener('touchend', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        // Ensure toolbar buttons work properly on touch
        const toolbarButtons = document.querySelectorAll('.toolbar .btn');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.click();
            }, { passive: false });
        });
    }

    preventDefaultTouch(e) {
        // Don't prevent touch events on modals
        if (e.target.closest('.modal.show')) {
            return; // Allow normal touch behavior in open modals
        }

        // Don't prevent scrolling in scrollable areas (including toolbar)
        const scrollableAreas = [
            '.panel-section',
            '.file-tree',
            '.output-log',
            '#blockInspector',
            '.code-editor',
            '.CodeMirror-scroll',
            '.modal-body',
            '.toolbar', // Add toolbar
            '.project-controls' // Add project controls
        ];

        if (scrollableAreas.some(selector => e.target.closest(selector))) {
            // Allow normal scrolling behavior
            return;
        }

        // Prevent default on specific elements to avoid unwanted behaviors
        const target = e.target;
        const preventElements = [
            '.btn:not(.toolbar .btn)', // Exclude toolbar buttons from preventDefault
            '.tree-item:not(.scrollable)',
            '.mobile-nav-btn',
            'input[type="range"]:not(.toolbar input[type="range"])'
        ];

        if (preventElements.some(selector => target.closest(selector))) {
            if (e.type === 'touchstart' && target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }

        // Prevent pull-to-refresh on mobile
        if (e.type === 'touchmove' && e.touches.length === 1) {
            const touch = e.touches[0];
            if (touch.clientY > 50 && window.scrollY === 0) {
                e.preventDefault();
            }
        }
    }

    setupModalHandling() {
        // Ensure modal buttons work on mobile
        const modalTriggers = document.querySelectorAll('#settingsBtn, #geminiBtn, #docsBtn');

        modalTriggers.forEach(btn => {
            // Remove existing listeners and add fresh ones
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.click(); // Trigger the click event
            }, { passive: false });
        });

        // Handle modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn, #closeSettings, #closeGemini, #closeDocs');

        closeButtons.forEach(btn => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.click();
            }, { passive: false });
        });

        // Handle modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('touchend', (e) => {
                if (e.target === modal) {
                    e.preventDefault();
                    modal.classList.remove('show');
                }
            }, { passive: false });
        });
    }

    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.optimizeForMobile();
                this.updateLayout();
            }, 100);
        });

        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;

            if (wasMobile !== this.isMobile) {
                if (this.isMobile) {
                    this.init();
                } else {
                    this.disableMobileMode();
                }
            }
        });
    }

    updateLayout() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // Force layout recalculation
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.height = 'auto';
            setTimeout(() => {
                mainContent.style.height = '';
            }, 1);
        }
    }

    optimizeForMobile() {
        // Optimize touch targets
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.height < 44) {
                btn.style.minHeight = '44px';
            }
        });

        // Enhanced range input optimization with progress tracking
        const ranges = document.querySelectorAll('input[type="range"]');
        ranges.forEach(range => {
            range.style.height = '44px';

            // Add progress tracking for better visual feedback
            const updateProgress = () => {
                const value = (range.value - range.min) / (range.max - range.min) * 100;
                range.style.setProperty('--value', `${value}%`);
            };

            // Initial update
            updateProgress();

            // Update on change
            range.addEventListener('input', updateProgress);
            range.addEventListener('change', updateProgress);
        });

        // Optimize code editor for mobile
        const codeInput = document.getElementById('codeInput');
        if (codeInput) {
            codeInput.style.fontSize = '16px'; // Prevent zoom on iOS
        }

        // Optimize chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.style.fontSize = '16px'; // Prevent zoom on iOS
        }
    }

    disableMobileMode() {
        // Remove mobile navigation
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            mobileNav.remove();
        }

        // Remove mobile arrows
        const arrows = document.querySelectorAll('.mobile-arrow');
        arrows.forEach(arrow => arrow.remove());

        // Remove mobile classes
        const panels = document.querySelectorAll('.left-panel, .right-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
            panel.style.transform = '';
        });

        // Remove touch indicators
        const indicators = document.querySelectorAll('.touch-indicator');
        indicators.forEach(indicator => indicator.remove());

        // Reset main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.marginBottom = '';
        }
    }

    // Public methods for integration with main app
    getCurrentPanel() {
        return this.activePanel;
    }

    switchToPanel(panelName) {
        if (['left', 'center', 'right'].includes(panelName)) {
            this.showPanel(panelName);
        }
    }

    vibrate(pattern = [50]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize mobile controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileControls = new MobileControls();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControls;
}
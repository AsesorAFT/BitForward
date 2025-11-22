/**
 * BitForward Page Transitions and Animations
 * Implements View Transitions API for smooth navigation
 */

class PageTransitions {
  constructor() {
    this.isSupported = document.startViewTransition !== undefined;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add event listeners to all internal navigation links
    document.addEventListener('DOMContentLoaded', () => {
      // Find all internal navigation links
      const internalLinks = document.querySelectorAll(
        'a[href^="/"]:not([target]), a[href^="./"]:not([target]), a[href^="../"]:not([target])'
      );

      internalLinks.forEach(link => {
        link.addEventListener('click', e => this.handleLinkClick(e));
      });

      // Set transition names for important elements
      this.setViewTransitionNames();
    });

    // Listen for popstate to handle browser back/forward
    window.addEventListener('popstate', () => {
      this.transitionToPage(window.location.href, true);
    });
  }

  setViewTransitionNames() {
    // Set view-transition-name for important elements that should animate
    const elementsToTransition = [
      { selector: 'header', name: 'header' },
      { selector: '.hero', name: 'hero' },
      { selector: '.portfolio-summary', name: 'portfolio-summary' },
      { selector: '.chart-container', name: 'chart' },
      { selector: '.sidebar', name: 'sidebar' },
      { selector: '.main-content', name: 'main-content' },
      { selector: '.data-table', name: 'data-table' },
      { selector: '.notification-panel', name: 'notifications' },
    ];

    elementsToTransition.forEach(item => {
      const elements = document.querySelectorAll(item.selector);
      elements.forEach(el => {
        el.style.viewTransitionName = item.name;
      });
    });
  }

  handleLinkClick(e) {
    // Don't handle if modified clicks (new tab, etc)
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    const href = e.currentTarget.getAttribute('href');

    // Only handle internal links
    if (href && (href.startsWith('/') || href.startsWith('./') || href.startsWith('../'))) {
      e.preventDefault();
      this.transitionToPage(href);
    }
  }

  async transitionToPage(url, isPopState = false) {
    try {
      // Fall back to normal navigation if View Transitions not supported
      if (!this.isSupported) {
        window.location.href = url;
        return;
      }

      // Use View Transitions API for smooth navigation
      const transition = document.startViewTransition(async () => {
        try {
          // Fetch the new page content
          const response = await fetch(url);
          const text = await response.text();

          // Create a DOM parser to extract the main content
          const parser = new DOMParser();
          const newDocument = parser.parseFromString(text, 'text/html');

          // Extract the content we want to transition
          const newMain =
            newDocument.querySelector('main') ||
            newDocument.querySelector('.main-content') ||
            newDocument.body;
          const currentMain =
            document.querySelector('main') ||
            document.querySelector('.main-content') ||
            document.body;

          // Update the page title
          document.title = newDocument.title;

          // Update the main content
          currentMain.innerHTML = newMain.innerHTML;

          // Update head elements like meta tags, but not scripts
          this.updateHeadElements(newDocument);

          // Update history unless it's a popstate event
          if (!isPopState) {
            window.history.pushState({}, '', url);
          }

          // Reinitialize any scripts needed for the new page
          this.reinitializePageScripts();

          // Reset view transition names for new elements
          this.setViewTransitionNames();
        } catch (error) {
          console.error('Error during page transition:', error);
          // Fall back to normal navigation on error
          window.location.href = url;
        }
      });

      // Wait for the transition to finish
      await transition.finished;
    } catch (error) {
      console.error('View transition error:', error);
      // Fall back to normal navigation
      window.location.href = url;
    }
  }

  updateHeadElements(newDocument) {
    // Update meta tags, links, etc. but not scripts
    const oldHead = document.head;
    const newHead = newDocument.head;

    // Update meta tags
    const oldMeta = Array.from(
      oldHead.querySelectorAll('meta:not([charset]):not([name="viewport"])')
    );
    const newMeta = Array.from(
      newHead.querySelectorAll('meta:not([charset]):not([name="viewport"])')
    );

    oldMeta.forEach(tag => tag.remove());
    newMeta.forEach(tag => oldHead.appendChild(tag.cloneNode(true)));

    // Update link tags (except those with data-permanent attribute)
    const oldLinks = Array.from(oldHead.querySelectorAll('link:not([data-permanent])'));
    const newLinks = Array.from(newHead.querySelectorAll('link:not([data-permanent])'));

    oldLinks.forEach(link => link.remove());
    newLinks.forEach(link => oldHead.appendChild(link.cloneNode(true)));
  }

  reinitializePageScripts() {
    // Re-run common initialization scripts for the new page
    if (window.initCharts) window.initCharts();
    if (window.setupDashboard) window.setupDashboard();
    if (window.initAnimations) window.initAnimations();

    // Re-initialize any other components
    document.dispatchEvent(new CustomEvent('page-content-updated'));
  }
}

// Global CSS for view transitions
const styleElement = document.createElement('style');
styleElement.textContent = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slide-from-right {
        from { transform: translateX(30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slide-to-left {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-30px); opacity: 0; }
    }
    
    @keyframes scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes scale-out {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(1.05); opacity: 0; }
    }

    /* View Transition Animations */
    @media (prefers-reduced-motion: no-preference) {
        ::view-transition-old(root) {
            animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both fade-out;
        }
        
        ::view-transition-new(root) {
            animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) both fade-in;
        }
        
        /* Header stays in place */
        ::view-transition-old(header),
        ::view-transition-new(header) {
            animation: none;
            mix-blend-mode: normal;
        }
        
        /* Hero section */
        ::view-transition-old(hero) {
            animation: 0.4s cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
        }
        
        ::view-transition-new(hero) {
            animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both slide-from-right;
        }
        
        /* Main content */
        ::view-transition-old(main-content) {
            animation: 0.4s cubic-bezier(0.4, 0, 0.2, 1) both fade-out;
        }
        
        ::view-transition-new(main-content) {
            animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both scale-in;
        }
        
        /* Charts */
        ::view-transition-old(chart) {
            animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both scale-out;
        }
        
        ::view-transition-new(chart) {
            animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both scale-in;
        }
    }

    /* For browsers that don't support view transitions */
    .page-transition {
        animation: 0.3s ease-out both fade-in;
    }
    
    /* Element animations */
    .slide-in {
        animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
    }
    
    .fade-in {
        animation: 0.5s ease-out both fade-in;
    }
    
    .scale-in {
        animation: 0.5s cubic-bezier(0.4, 0, 0.2, 1) both scale-in;
    }
`;

document.head.appendChild(styleElement);

// Initialize page transitions
const pageTransitions = new PageTransitions();

// Expose to global scope
window.pageTransitions = pageTransitions;

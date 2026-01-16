/**
 * Kevin Meyvaert Photography Portfolio
 * Main JavaScript functionality
 */

(function() {
  'use strict';

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  let currentImageIndex = 0;
  let allImages = [];
  let isModalOpen = false;

  // ============================================
  // DOM ELEMENTS
  // ============================================

  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalClose = document.querySelector('.modal-close');
  const modalPrev = document.querySelector('.modal-prev');
  const modalNext = document.querySelector('.modal-next');
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const body = document.body;

  // ============================================
  // INITIALIZATION
  // ============================================

  document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initImageGallery();
    initModalViewer();
    initKeyboardNavigation();
    initSidebarMenu();
    if (window.WINTER_MODE) {
      initSnowEffect();
      initChristmasLights();
    }
  });

  // ============================================
  // THEME SWITCHING
  // ============================================

  function initTheme() {
    // Get saved theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply theme immediately to prevent flash
    setTheme(theme);

    // Get saved winter preference (default is on)
    const savedWinter = localStorage.getItem('winter');
    if (savedWinter === 'off') {
      document.documentElement.setAttribute('data-winter', 'off');
    }

    // Theme toggle buttons
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', toggleTheme);
    }

    // Winter toggle buttons
    const winterToggle = document.getElementById('winter-toggle');
    const winterToggleMobile = document.getElementById('winter-toggle-mobile');

    if (winterToggle) {
      winterToggle.addEventListener('click', toggleWinter);
    }

    if (winterToggleMobile) {
      winterToggleMobile.addEventListener('click', toggleWinter);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleWinter() {
    const currentWinter = document.documentElement.getAttribute('data-winter');
    const newWinter = currentWinter === 'off' ? 'on' : 'off';
    
    if (newWinter === 'off') {
      document.documentElement.setAttribute('data-winter', 'off');
      localStorage.setItem('winter', 'off');
    } else {
      document.documentElement.removeAttribute('data-winter');
      localStorage.removeItem('winter');
    }
  }

  // ============================================
  // SNOW EFFECT
  // ============================================

  let snowCanvas = null;
  let snowCtx = null;
  let snowflakes = [];
  let snowAnimationId = null;
  let isSnowing = false;

  function initSnowEffect() {
    // Create canvas element
    snowCanvas = document.createElement('canvas');
    snowCanvas.id = 'snow-canvas';
    document.body.appendChild(snowCanvas);
    
    snowCtx = snowCanvas.getContext('2d');
    
    // Set canvas size
    resizeSnowCanvas();
    window.addEventListener('resize', resizeSnowCanvas);
    
    // Create initial snowflakes
    createSnowflakes();
    
    // Start animation if in dark mode
    checkSnowVisibility();
    
    // Watch for theme and winter changes
    const observer = new MutationObserver(checkSnowVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-winter']
    });
  }

  function resizeSnowCanvas() {
    if (!snowCanvas) return;
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
    createSnowflakes();
  }

  function createSnowflakes() {
    snowflakes = [];
    const flakeCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    
    for (let i = 0; i < flakeCount; i++) {
      snowflakes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
        wind: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.6 + 0.4,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  function checkSnowVisibility() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const isWinterOff = document.documentElement.getAttribute('data-winter') === 'off';
    
    if (isDark && !isWinterOff && !isSnowing) {
      startSnow();
    } else if ((!isDark || isWinterOff) && isSnowing) {
      stopSnow();
    }
  }

  function startSnow() {
    if (isSnowing) return;
    isSnowing = true;
    animateSnow();
  }

  function stopSnow() {
    isSnowing = false;
    if (snowAnimationId) {
      cancelAnimationFrame(snowAnimationId);
      snowAnimationId = null;
    }
    if (snowCtx && snowCanvas) {
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    }
  }

  function animateSnow() {
    if (!isSnowing || !snowCtx || !snowCanvas) return;
    
    snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    
    snowflakes.forEach(flake => {
      // Update position
      flake.y += flake.speed;
      flake.swing += flake.swingSpeed;
      flake.x += flake.wind + Math.sin(flake.swing) * 0.3;
      
      // Reset if off screen
      if (flake.y > snowCanvas.height) {
        flake.y = -5;
        flake.x = Math.random() * snowCanvas.width;
      }
      if (flake.x > snowCanvas.width) {
        flake.x = 0;
      }
      if (flake.x < 0) {
        flake.x = snowCanvas.width;
      }
      
      // Draw snowflake
      snowCtx.beginPath();
      snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      snowCtx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      snowCtx.fill();
    });
    
    snowAnimationId = requestAnimationFrame(animateSnow);
  }

  // ============================================
  // CHRISTMAS LIGHTS
  // ============================================

  function initChristmasLights() {
    const sidebar = document.querySelector('.sidebar-desktop');
    if (!sidebar) return;

    // Create the lights container
    const lightsContainer = document.createElement('div');
    lightsContainer.className = 'christmas-lights';
    
    // Add the wire
    const wire = document.createElement('div');
    wire.className = 'christmas-wire';
    lightsContainer.appendChild(wire);
    
    // Color sequence for the bulbs
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'pink'];
    
    // Calculate number of bulbs based on viewport height
    const bulbSpacing = 45; // pixels between bulbs
    const viewportHeight = window.innerHeight;
    const numBulbs = Math.floor(viewportHeight / bulbSpacing);
    
    // Create bulbs
    for (let i = 0; i < numBulbs; i++) {
      const bulb = document.createElement('div');
      bulb.className = `christmas-bulb ${colors[i % colors.length]}`;
      bulb.style.top = `${(i * bulbSpacing) + 20}px`;
      
      // Add slight random offset for natural look
      const randomDelay = (Math.random() * 0.5).toFixed(2);
      bulb.style.animationDelay = `${randomDelay}s`;
      
      lightsContainer.appendChild(bulb);
    }
    
    document.body.appendChild(lightsContainer);
    
    // Update on resize
    window.addEventListener('resize', debounce(updateChristmasLights, 250));
  }

  function updateChristmasLights() {
    const lightsContainer = document.querySelector('.christmas-lights');
    if (!lightsContainer) return;
    
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'pink'];
    const bulbSpacing = 45;
    const viewportHeight = window.innerHeight;
    const numBulbs = Math.floor(viewportHeight / bulbSpacing);
    
    // Remove existing bulbs (keep wire)
    const existingBulbs = lightsContainer.querySelectorAll('.christmas-bulb');
    existingBulbs.forEach(bulb => bulb.remove());
    
    // Create new bulbs
    for (let i = 0; i < numBulbs; i++) {
      const bulb = document.createElement('div');
      bulb.className = `christmas-bulb ${colors[i % colors.length]}`;
      bulb.style.top = `${(i * bulbSpacing) + 20}px`;
      
      const randomDelay = (Math.random() * 0.5).toFixed(2);
      bulb.style.animationDelay = `${randomDelay}s`;
      
      lightsContainer.appendChild(bulb);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ============================================
  // IMAGE GALLERY
  // ============================================

  function initImageGallery() {
    // Collect all images from the page
    const photoImages = document.querySelectorAll('.photo-image');
    const postImages = document.querySelectorAll('.post-image');

    allImages = [...photoImages, ...postImages];

    // Add click listeners to all images
    allImages.forEach((img, index) => {
      img.addEventListener('click', function(e) {
        e.preventDefault();
        currentImageIndex = index;
        // Get optimized lightbox image from the hidden lightbox-image element
        const article = img.closest('.photo-item');
        const lightboxImg = article ? article.querySelector('.lightbox-image') : null;
        const lightboxImage = lightboxImg ? lightboxImg.currentSrc || lightboxImg.src : img.src;
        openModal(lightboxImage);
      });
    });

    // Add click listeners to photo items (grid items)
    const photoItems = document.querySelectorAll('.photo-item');
    photoItems.forEach(item => {
      item.addEventListener('click', function(e) {
        // Only trigger if clicking on the item itself, not the image
        if (e.target === item || e.target.closest('.photo-overlay')) {
          const img = item.querySelector('.photo-image');
          if (img) {
            const index = allImages.indexOf(img);
            if (index !== -1) {
              currentImageIndex = index;
              const lightboxImg = item.querySelector('.lightbox-image');
              const lightboxImage = lightboxImg ? lightboxImg.currentSrc || lightboxImg.src : img.src;
              openModal(lightboxImage);
            }
          }
        }
      });
    });
  }

  // ============================================
  // MODAL IMAGE VIEWER
  // ============================================

  function initModalViewer() {
    if (!modal) return;

    // Close button
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Previous/Next buttons
    if (modalPrev) {
      modalPrev.addEventListener('click', showPreviousImage);
    }

    if (modalNext) {
      modalNext.addEventListener('click', showNextImage);
    }

    // Close on background click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Prevent image click from closing modal
    if (modalImage) {
      modalImage.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }

  function openModal(imageSrc) {
    if (!modal || !modalImage) return;

    modalImage.src = imageSrc;
    modal.classList.add('active');
    body.classList.add('no-scroll');
    isModalOpen = true;

    // Update navigation button visibility
    updateModalNavigation();
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove('active');
    body.classList.remove('no-scroll');
    isModalOpen = false;
  }

  function showPreviousImage() {
    if (allImages.length === 0) return;

    currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    const img = allImages[currentImageIndex];
    const article = img.closest('.photo-item');
    const lightboxImg = article ? article.querySelector('.lightbox-image') : null;
    const lightboxImage = lightboxImg ? lightboxImg.currentSrc || lightboxImg.src : img.src;
    modalImage.src = lightboxImage;
    updateModalNavigation();
  }

  function showNextImage() {
    if (allImages.length === 0) return;

    currentImageIndex = (currentImageIndex + 1) % allImages.length;
    const img = allImages[currentImageIndex];
    const article = img.closest('.photo-item');
    const lightboxImg = article ? article.querySelector('.lightbox-image') : null;
    const lightboxImage = lightboxImg ? lightboxImg.currentSrc || lightboxImg.src : img.src;
    modalImage.src = lightboxImage;
    updateModalNavigation();
  }

  function updateModalNavigation() {
    if (!modalPrev || !modalNext) return;

    // Hide navigation if only one image
    if (allImages.length <= 1) {
      modalPrev.style.display = 'none';
      modalNext.style.display = 'none';
    } else {
      modalPrev.style.display = 'flex';
      modalNext.style.display = 'flex';
    }
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
      // Only handle keyboard navigation when modal is open
      if (!isModalOpen) return;

      switch(e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          showPreviousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          showNextImage();
          break;
      }
    });

    // Also handle keyboard navigation for post navigation on single posts
    const navPrevious = document.querySelector('.nav-previous');
    const navNext = document.querySelector('.nav-next');

    if (navPrevious || navNext) {
      document.addEventListener('keydown', function(e) {
        // Don't interfere with modal navigation
        if (isModalOpen) return;

        switch(e.key) {
          case 'ArrowLeft':
            if (navPrevious) {
              e.preventDefault();
              window.location.href = navPrevious.href;
            }
            break;
          case 'ArrowRight':
            if (navNext) {
              e.preventDefault();
              window.location.href = navNext.href;
            }
            break;
        }
      });
    }
  }

  // ============================================
  // SIDEBAR MENU
  // ============================================

  function initSidebarMenu() {
    if (!menuToggle || !sidebar) return;

    // Toggle sidebar
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('active') &&
          !sidebar.contains(e.target) &&
          !menuToggle.contains(e.target)) {
        closeSidebar();
      }
    });

    // Close sidebar when clicking a link
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Only close sidebar for internal links
        if (!link.getAttribute('target')) {
          closeSidebar();
        }
      });
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('active')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    sidebar.classList.add('active');
    menuToggle.classList.add('active');
    body.classList.add('no-scroll');
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    menuToggle.classList.remove('active');
    body.classList.remove('no-scroll');
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  // Smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

})();

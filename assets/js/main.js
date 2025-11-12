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

    // Theme toggle buttons
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', toggleTheme);
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

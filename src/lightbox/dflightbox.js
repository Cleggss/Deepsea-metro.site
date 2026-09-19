/**
 * Made with love by Designfreaks.net
 * Do not redistribute or modify without permission.
 * Version 1.0.6
 */

//cleggsadd:: ehee ok i mightve tweaked it a lil, go find the original on designfreaks if you want it untouched!

class DFLightbox {
   static instance = null;

   // Sets up the lightbox with provided options
   constructor(options = {}) {
      // Prevents multiple lightbox instances
      if (DFLightbox.instance) {
         return DFLightbox.instance;
      }

      this.opts = {
         attribute: 'data-lightbox-src',
         captionAttr: 'data-lightbox-caption',
         mode: 'smart', // 'manual' or 'smart'
         container: '#dflightbox', // default container for smart mode
         exclude: [], // selectors to exclude in smart mode
         hideCaptions: false, // show or hide captions
         downloadable: false, // show download link
         allowHTML: true, // allow HTML in captions
         ...options
      };

      this.items = [];
      this.currentIndex = 0;
      this.modal = null;
      this.imageEl = null;
      this.seamlessEl = null;
      this.captionEl = null;
      this.downloadEl = null;
      this.prevEl = null;
      this.nextEl = null;
      this.closeEl = null;
      this.focusableEls = [];
      this.firstFocusableEl = null;
      this.lastFocusableEl = null;
      this.triggeringElement = null;

      this.isZoomed = false;
      this.drag = {
         startX: 0,
         startY: 0,
         currentX: 0,
         currentY: 0,
         initialX: 0,
         initialY: 0,
         isDragging: false,
         hasMoved: false,
         pointerId: null
      };

      this._debouncedResizeLogic = this._debounce(this._resizeLogic.bind(this), 200);
      this._handlePointerDown = this._handlePointerDown.bind(this);
      this._handlePointerMove = this._handlePointerMove.bind(this);
      this._handlePointerUp = this._handlePointerUp.bind(this);

      this.init();

      DFLightbox.instance = this;
   }

   // Utility function to debounce function calls
   _debounce(func, delay) {
      let timeout;

      return function (...args) {
         const context = this;
         clearTimeout(timeout);
         timeout = setTimeout(() => func.apply(context, args), delay);
      };
   }

   // Initializes the lightbox
   init() {
      if (this.opts.mode === 'smart') {
         this.runSmartMode();
      }

      this.buildDOM();
      this.scanImages();
      this.attachEvents();
   }

   // Tries to automatically find image links in a container
   runSmartMode() {
      if (!this.opts.container) return;

      const containers = document.querySelectorAll(this.opts.container);
      if (!containers.length) return;

      containers.forEach(container => {
         const links = container.querySelectorAll('a');
         links.forEach(link => {
            // Check for exclusion class
            if (link.classList.contains('dflightbox-exclude')) return;

            // Check for exclusion selectors in options
            if (Array.isArray(this.opts.exclude) && this.opts.exclude.length) {
               const shouldExclude = this.opts.exclude.some(selector =>
                  link.matches(selector) || link.closest(selector)
               );

               if (shouldExclude) return;
            }

            // Check for include class
            const forceInclude = link.classList.contains('dflightbox-include');

            const img = link.querySelector('img');
            const bgImg = window.getComputedStyle(link).backgroundImage;
            let targetSrc = link.getAttribute('href');

            // Try to determine the image source from <img> or background image if href is missing
            if (!targetSrc || targetSrc.startsWith('#')) {
               if (img) {
                  targetSrc = img.src;
               } else if (bgImg && bgImg !== 'none') {
                  // Extract URL from 'url("...")' format
                  targetSrc = bgImg.slice(4, -1).replace(/["']/g, '');
               }
            }

            // Use alt text as caption if no caption attribute exists
            if (img && !link.hasAttribute(this.opts.captionAttr) && img.alt) {
               link.setAttribute(this.opts.captionAttr, img.alt);
            }

            // Only process valid image sources OR forced includes
            if (!targetSrc) return;
            if (!forceInclude && !this.isImage(targetSrc)) return;

            link.setAttribute(this.opts.attribute, targetSrc);
            link.addEventListener('click', (e) => e.preventDefault());
         });
      });
   }

   // Creates the HTML structure
   buildDOM() {
      const html = `
            <button class="dfl-button dfl-close" aria-label="Close Lightbox">&times;</button>
            <button class="dfl-button dfl-prev" aria-label="Previous image">&lsaquo;</button>
            <img class="dfl-img" src="" alt="Lightbox Image">
            <div class="dfl-seamless-view"></div>
            <button class="dfl-button dfl-next" aria-label="Next image">&rsaquo;</button>
            <div id="dfl-caption" class="dfl-caption"></div>
            ${this.opts.downloadable ? '<a class="dfl-download" Artist aria-label="View artist" target="_blank" rel="noopener noreferrer">Artist</a>' : ''}
        `;

      // Create and insert the overlay element
      this.modal = document.createElement('div');
      this.modal.className = 'dfl-overlay';
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-labelledby', 'dfl-caption');
      this.modal.setAttribute('aria-hidden', 'true');
      this.modal.setAttribute('tabindex', '-1');
      this.modal.innerHTML = html;
      document.body.appendChild(this.modal);

      // Key elements
      this.imageEl = this.modal.querySelector('.dfl-img');
      this.seamlessEl = this.modal.querySelector('.dfl-seamless-view');
      this.captionEl = this.modal.querySelector('.dfl-caption');
      this.prevEl = this.modal.querySelector('.dfl-prev');
      this.nextEl = this.modal.querySelector('.dfl-next');
      this.closeEl = this.modal.querySelector('.dfl-close');

      if (this.opts.downloadable) {
         this.downloadEl = this.modal.querySelector('.dfl-download');
      }
   }

   // Tries to filter out non-image files for the smart mode
   isImage(url) {
      if (!url) return false;

      // Whitelisted image extensions
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg', 'ico', 'tiff', 'tif'];

      // Strip fragment/hash and query string
      const cleanUrl = url.split('#')[0].split('?')[0];

      // Check for extension at the end of the path
      const extMatch = cleanUrl.match(/\.([a-z0-9]+)$/i);

      if (extMatch) {
         const ext = extMatch[1].toLowerCase();
         return imageExtensions.includes(ext);
      }

      return false;
   }

   // Finds all images with the lightbox attributes or relevant <a> tags
   scanImages() {
      let elements = [];

      // Select all elements with the data attribute in any mode
      const elementsWithAttr = document.querySelectorAll(`[${this.opts.attribute}]`);

      if (this.opts.mode === 'manual') {
         // 1. Elements marked with the data attribute
         // 2. Link tags with 'dflightbox-include' that have an href
         const allPotentialElements = document.querySelectorAll(
            `[${this.opts.attribute}], a.dflightbox-include[href]`
         );

         elements = Array.from(allPotentialElements);

      } else {
         // Smart Mode: All elements should already have the data attribute 
         elements = Array.from(elementsWithAttr);
      }

      this.items = [];

      elements.forEach(el => {
         let linkEl = el;

         // Get image source from the data attribute
         let src = linkEl.getAttribute(this.opts.attribute);

         // If data attribute is missing and it's a linked image, use the href as the image source
         if (!src && this.opts.mode === 'manual' && linkEl.tagName === 'A' && linkEl.classList.contains('dflightbox-include')) {
            src = linkEl.getAttribute('href');
         }

         if (!src || src.startsWith('#')) return;

         const caption = linkEl.getAttribute(this.opts.captionAttr) || '';
         const isSeamless = linkEl.classList.contains('dflightbox-seamless');
         const downloadSrc = linkEl.getAttribute('data-lightbox-download');
         const index = this.items.length;

         linkEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.triggeringElement = e.currentTarget;
            this.open(index);
         });

         this.items.push({
            src,
            caption,
            isSeamless,
            downloadSrc: downloadSrc || src
         });
      });
   }

   // Accessibility: Prepares the focusable elements
   _prepareFocusTrap() {
      const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

      // Find all focusable elements
      this.focusableEls = Array.from(this.modal.querySelectorAll(focusableSelectors))
         .filter(el => !el.disabled && el.offsetParent !== null);

      // Exclude the image element
      this.focusableEls = this.focusableEls.filter(el => el !== this.imageEl);

      this.firstFocusableEl = this.focusableEls[0];
      this.lastFocusableEl = this.focusableEls[this.focusableEls.length - 1];
   }

   // Opens the lightbox
   open(index) {
      this.currentIndex = index;

      this.imageEl.classList.remove('dfl-pop-in');
      this.seamlessEl.classList.remove('dfl-pop-in');

      this.updateContent();
      this.modal.classList.add('active');
      this.modal.setAttribute('aria-hidden', 'false');

      // Accessibility: Prepare and set focus
      this._prepareFocusTrap();

      // Focus on the container initially
      this.modal.focus();

      // Show/hide navigation controls based on the number of items
      if (this.items.length <= 1) {
         this.modal.classList.add('dfl-single');
      } else {
         this.modal.classList.remove('dfl-single');
      }
   }

   // Closes the lightbox
   close() {
      this.modal.classList.remove('active');
      this.modal.setAttribute('aria-hidden', 'true');

      // Accessibility: Restore focus to the element that opened the lightbox
      if (this.triggeringElement && this.triggeringElement.focus) {
         this.triggeringElement.focus();
         this.triggeringElement = null;
      }

      // Reset zoom state and styles
      this.isZoomed = false;
      this.imageEl.style.cursor = '';
      this.imageEl.classList.remove('dfl-is-zoomed', 'dfl-can-zoom');
      this.imageEl.style.transform = '';

      // Ensure seamless element is hidden and standard image container is shown on close
      this.seamlessEl.classList.remove('active');
      this.imageEl.classList.remove('dfl-hidden');

      this._removeDragEvents();
   }

   // Updates the image source and handles the loading state
   updateContent() {
      const item = this.items[this.currentIndex];
      const isSeamlessMode = item.isSeamless;

      // Reset zoom/drag state before loading new image
      this.isZoomed = false;
      this.imageEl.style.cursor = '';
      this.imageEl.classList.remove('dfl-is-zoomed', 'dfl-can-zoom');
      this.imageEl.style.transform = '';
      this._removeDragEvents();

      // Toggle seamless view
      if (isSeamlessMode) {
         this.seamlessEl.style.backgroundImage = `url('${item.src}')`;
         this.seamlessEl.classList.add('active');
         this.imageEl.classList.add('dfl-hidden');
      } else {
         this.seamlessEl.classList.remove('active');
         this.imageEl.classList.remove('dfl-hidden');
         this.imageEl.src = item.src;
         this.imageEl.style.visibility = 'hidden';
      }

      // Add loading class after a short delay (to prevent a flickering loading icon)
      const loaderTimeout = setTimeout(() => {
         this.modal.classList.add('dfl-loading');
      }, 100);

      // Track loading
      const img = new Image();

      const clearLoader = () => {
         clearTimeout(loaderTimeout);
         this.modal.classList.remove('dfl-loading');
         if (!isSeamlessMode) {
            this.imageEl.style.visibility = 'visible';
         }
      };

      img.onload = () => {
         clearLoader();

         if (isSeamlessMode) {
            this.seamlessEl.classList.add('dfl-pop-in');
         } else {
            this.imageEl.classList.add('dfl-pop-in');
            // Check if the image is larger than the viewport and enable zoom
            this.checkZoom();
         }
      };

      img.onerror = () => {
         clearLoader();
      };

      img.src = item.src;

      // Updates caption
      if (this.captionEl) {
         if (this.opts.allowHTML) {
            this.captionEl.innerHTML = item.caption;
         } else {
            this.captionEl.textContent = item.caption;
         }
      }

      // Updates download link
      if (this.opts.downloadable && this.downloadEl) {
         this.downloadEl.href = item.downloadSrc;
      }

      this._toggleControls(true);
      this._preloadNeighbors();
   }

   // Preloads the previous and next images
   _preloadNeighbors() {
      const items = this.items;
      if (items.length <= 1) return;

      const nextIndex = (this.currentIndex + 1) % items.length;
      const prevIndex = (this.currentIndex - 1 + items.length) % items.length;

      // Trigger image loading
      new Image().src = items[nextIndex].src;
      new Image().src = items[prevIndex].src;
   }

   // Navigates to the previous or next image and updates the content
   _navigate(direction, preserveFocus = false) {
      this.imageEl.classList.remove('dfl-pop-in');
      this.seamlessEl.classList.remove('dfl-pop-in');

      const length = this.items.length;

      if (direction === 'next') {
         this.currentIndex = (this.currentIndex + 1) % length;
      } else if (direction === 'prev') {
         this.currentIndex = (this.currentIndex - 1 + length) % length;
      }

      this.updateContent();

      if (preserveFocus) {
         this.modal.focus();
      }
   }

   prev() {
      this._navigate('prev');
   }

   next() {
      this._navigate('next');
   }

   // Handles window resize events by resetting zoom and re-checking zoom capability
   _handleResizeEvent() {
      this._debouncedResizeLogic();
   }

   // Debounced viewport resizing logic
   _resizeLogic() {
      // Only if the lightbox is currently open
      if (!this.modal.classList.contains('active') || !this.imageEl) return;

      const item = this.items[this.currentIndex];
      if (item && item.isSeamless) return;

      // If currently zoomed, zoom out on resize
      if (this.isZoomed) {
         this.toggleZoom();
      }

      this.checkZoom();
   }

   // Handles keyboard interactions
   _handleKeydown(e) {
      if (!this.modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
         e.preventDefault();
         this.close();
         return;
      }

      // Handle focus trap
      if (e.key === 'Tab') {
         const isFirst = e.target === this.firstFocusableEl;
         const isLast = e.target === this.lastFocusableEl;

         if (e.shiftKey) {
            if (isFirst) {
               this.lastFocusableEl.focus();
               e.preventDefault();
            }
         } else {
            if (isLast) {
               this.firstFocusableEl.focus();
               e.preventDefault();
            }
         }
         return;
      }

      // Navigation keys
      const isSeamlessMode = this.items[this.currentIndex] && this.items[this.currentIndex].isSeamless;

      if (e.key === 'ArrowLeft') {
         e.preventDefault();
         if (!this.isZoomed || isSeamlessMode) this._navigate('prev', true);
      }

      if (e.key === 'ArrowRight') {
         e.preventDefault();
         if (!this.isZoomed || isSeamlessMode) this._navigate('next', true);
      }
   }

   // Attaches event listeners for navigation and other controls
   attachEvents() {
      this.modal.querySelector('.dfl-close').onclick = () => this.close();
      this.modal.querySelector('.dfl-prev').onclick = (e) => {
         e.stopPropagation();
         this.prev();
      };

      this.modal.querySelector('.dfl-next').onclick = (e) => {
         e.stopPropagation();
         this.next();
      };

      // Close when clicking on the overlay area
      this.modal.onclick = (e) => {
         if (e.target === this.modal) this.close();
      };

      // Keyboard navigation and focus trap
      document.addEventListener('keydown', this._handleKeydown.bind(this));

      let touchStartX = 0;

      // Capture touch start position
      this.modal.addEventListener('touchstart', (e) => {
         if (this.isZoomed) return;

         // Allow swipe detection
         touchStartX = e.changedTouches[0].screenX;
      }, {
         passive: true
      });

      // Check touch end position
      this.modal.addEventListener('touchend', (e) => {
         if (this.isZoomed) return;

         const touchEndX = e.changedTouches[0].screenX;

         // Check for a minimum horizontal swipe distance (50px)
         if (touchEndX < touchStartX - 50) this.next();
         if (touchEndX > touchStartX + 50) this.prev();
      }, {
         passive: true
      });

      this.toggleZoomHandler = (e) => {
         this.toggleZoom(e);
      };

      // Zoom check on window resize
      window.addEventListener('resize', this._handleResizeEvent.bind(this));
   }

   // Removes all event listeners related to image dragging
   _removeDragEvents() {
      this.imageEl.removeEventListener('pointerdown', this._handlePointerDown);
      window.removeEventListener('pointermove', this._handlePointerMove);
      window.removeEventListener('pointerup', this._handlePointerUp);
      window.removeEventListener('pointercancel', this._handlePointerUp);

      // Reset drag state
      this.drag = {
         startX: 0,
         startY: 0,
         currentX: 0,
         currentY: 0,
         initialX: 0,
         initialY: 0,
         isDragging: false,
         hasMoved: false,
         pointerId: null
      };
   }

   // Checks if the displayed image is smaller than its actual size and enables zoom if needed
   checkZoom() {
      const item = this.items[this.currentIndex];
      if (item && item.isSeamless) return;

      const currentSrc = this.imageEl.src;

      if (currentSrc && currentSrc.toLowerCase().endsWith('.svg')) {
         this.imageEl.classList.remove('dfl-can-zoom');
         this.imageEl.removeEventListener('click', this.toggleZoomHandler);

         return;
      }

      // Check if image size is larger than the displayed size
      const canZoom = (
         this.imageEl.naturalWidth > this.imageEl.clientWidth ||
         this.imageEl.naturalHeight > this.imageEl.clientHeight
      );

      // Remove previous click listener before adding to prevent duplicates
      this.imageEl.removeEventListener('click', this.toggleZoomHandler);

      if (canZoom) {
         this.imageEl.classList.add('dfl-can-zoom');

         // Re-add listener to enable zoom (works for single tap too)
         this.imageEl.addEventListener('click', this.toggleZoomHandler);

      } else {
         this.imageEl.classList.remove('dfl-can-zoom');
      }
   }

   // Shows or hides the caption, download link, and navigation arrows
   _toggleControls(show) {
      const item = this.items[this.currentIndex];

      // Caption visibility
      if (this.captionEl) {
         const shouldShowCaption = show && !this.opts.hideCaptions && item.caption;
         this.captionEl.style.display = shouldShowCaption ? 'block' : 'none';
      }

      // Download button visibility
      if (this.opts.downloadable && this.downloadEl) {
         this.downloadEl.style.display = show ? 'block' : 'none';
      }

      // Navigation arrows visibility
      const showNav = show && this.items.length > 1;
      if (this.prevEl) {
         this.prevEl.style.display = showNav ? 'block' : 'none';
         this.prevEl.disabled = !showNav;
      }

      if (this.nextEl) {
         this.nextEl.style.display = showNav ? 'block' : 'none';
         this.nextEl.disabled = !showNav;
      }
   }

   // Toggles the image zoom state (zooming in or zooming out)
   toggleZoom(e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      const item = this.items[this.currentIndex];
      if (item && item.isSeamless) return;

      // Prevent zoom out if click was part of a drag movement
      if (this.drag.hasMoved) {
         this.drag.hasMoved = false;
         return;
      }

      if (this.isZoomed) {
         // Zoom Out: Reset state
         this.isZoomed = false;
         this.imageEl.classList.remove('dfl-is-zoomed');
         this.imageEl.style.transform = '';
         this.imageEl.style.cursor = '';

         this._removeDragEvents();
         this._toggleControls(true);

      } else {
         // Zoom In: Apply zoom state
         this.isZoomed = true;
         this.imageEl.classList.add('dfl-is-zoomed');
         this.imageEl.style.cursor = 'zoom-out';

         // Initial position for zoomed image
         this.imageEl.style.transform = `translate3d(${this.drag.currentX}px, ${this.drag.currentY}px, 0) scale(1)`;

         this.enableDrag();

         // Hide navigation and controls
         this._toggleControls(false);
      }
   }

   _handleDragStart(clientX, clientY, pointerId) {
      this.drag.isDragging = true;
      this.drag.pointerId = pointerId;

      // Initial element position
      this.drag.initialX = this.drag.currentX;
      this.drag.initialY = this.drag.currentY;

      // Pointer start position
      this.drag.startX = clientX;
      this.drag.startY = clientY;
      this.drag.hasMoved = false;

      this.imageEl.style.cursor = 'grabbing';
   }

   _handleDragMove(clientX, clientY) {
      if (!this.drag.isDragging) return;

      const deltaX = clientX - this.drag.startX;
      const deltaY = clientY - this.drag.startY;

      let newX = this.drag.initialX + deltaX;
      let newY = this.drag.initialY + deltaY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
         this.drag.hasMoved = true;
      }

      // Keep image in visible area
      const bounded = this._getBoundedPosition(newX, newY);

      this.drag.currentX = bounded.x;
      this.drag.currentY = bounded.y;

      // Apply css transform
      this.imageEl.style.transform = `translate3d(${bounded.x}px, ${bounded.y}px, 0) scale(1)`;
   }

   _handleDragEnd() {
      if (!this.drag.isDragging) return;
      this.drag.isDragging = false;
      this.drag.pointerId = null;
      this.imageEl.style.cursor = 'zoom-out';
   }

   // Pointer Event Handlers
   _handlePointerDown(e) {
      if (!this.isZoomed || e.button > 0 || this.drag.isDragging) return;

      e.preventDefault();
      this.imageEl.setPointerCapture(e.pointerId);

      this._handleDragStart(e.clientX, e.clientY, e.pointerId);
   }

   _handlePointerMove(e) {
      if (!this.drag.isDragging || e.pointerId !== this.drag.pointerId) return;

      e.preventDefault();
      this._handleDragMove(e.clientX, e.clientY);
   }

   _handlePointerUp(e) {
      if (!this.drag.isDragging || e.pointerId !== this.drag.pointerId) return;

      this.imageEl.releasePointerCapture(e.pointerId);
      this._handleDragEnd();
   }

   // Sets up the event listeners for pointer dragging
   enableDrag() {
      this.imageEl.addEventListener('pointerdown', this._handlePointerDown);
      window.addEventListener('pointermove', this._handlePointerMove);
      window.addEventListener('pointerup', this._handlePointerUp);
      window.addEventListener('pointercancel', this._handlePointerUp);
   }

   // Prevents images from being dragged out of view
   _getBoundedPosition(x, y) {
      // Get the actual size of the image
      const rect = this.imageEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Calculate the maximum distance the image can be moved from center
      let maxLeft = (rect.width - vw) / 2;
      let maxTop = (rect.height - vh) / 2;

      // Prevent dragging if the image is smaller than the viewport
      if (maxLeft < 0) {
         maxLeft = 0;
      }

      if (maxTop < 0) {
         maxTop = 0;
      }

      const clampedX = Math.min(maxLeft, Math.max(-maxLeft, x));
      const clampedY = Math.min(maxTop, Math.max(-maxTop, y));

      return {
         x: clampedX,
         y: clampedY
      };
   }
}
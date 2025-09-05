// ===== Loading Screen Logic =====
document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingAnimation = document.querySelector('.loading-animation');
  const mainVideo = document.querySelector('.right-video');
  
  if (loadingAnimation && mainVideo) {
    // Set up continuous looping for loading animation
    loadingAnimation.addEventListener('ended', function() {
      // Simply restart the video for continuous forward looping
      loadingAnimation.currentTime = 0;
      loadingAnimation.play();
    });
    
    // Start the loading animation
    loadingAnimation.play();
    
    // Hide loading screen when main video can play
    mainVideo.addEventListener('canplay', function() {
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
        // Remove the overlay after fade out
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 1000); // Wait 1 second after video can play
    });
    
    // Fallback: hide loading screen after 10 seconds max
    setTimeout(() => {
      if (!loadingOverlay.classList.contains('hidden')) {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }
    }, 10000);
  }
});

// ===== Video Animation Scroll Logic =====
(function() {
  // Selectors
  const stage = document.querySelector('.video-anim-stage');
  const video = document.querySelector('.video-anim-video');
  const outer = video ? video.querySelector('.bg-video-outer') : null;
  const inner = outer ? outer.querySelector('.bg-video-inner') : null;
  const left = inner ? inner.querySelector('.container-left') : null;
  const right = inner ? inner.querySelector('.container-right') : null;
  const root = document.documentElement;
  const videoEl = right ? right.querySelector('.right-video') : null;
  const leftText = left ? left.querySelector('.left-text') : null;
  const pageTitle = document.querySelector('.page-title');
  const backgroundTitleHero = document.querySelector('.background-title-hero');
  const introHeroFixed = document.querySelector('.intro-hero-fixed');
  const outerOuter = video ? video.querySelector('.bg-video-outer-outer') : null;
  const containerTop = inner ? inner.querySelector('.container-top') : null;

  // Animation parameters (can be synced with CSS variables)
  const OUTER_MIN_SCALE_X = parseFloat(getComputedStyle(root).getPropertyValue('--outer-min-scale-x'));
  const OUTER_MIN_SCALE_Y = parseFloat(getComputedStyle(root).getPropertyValue('--outer-min-scale-y'));
  const OUTER_MAX_RADIUS = parseFloat(getComputedStyle(root).getPropertyValue('--outer-max-radius'));
  // Dynamically calculate inner min scale based on margin
  function getInnerMinScales() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const marginStr = getComputedStyle(root).getPropertyValue('--video-margin');
    let margin = 0;
    if (marginStr.includes('vw')) {
      margin = parseFloat(marginStr) / 100 * vw;
    } else if (marginStr.includes('px')) {
      margin = parseFloat(marginStr);
    } else {
      margin = parseFloat(marginStr);
    }
    const INNER_MIN_SCALE_X = (vw - 2 * margin) / vw;
    const INNER_MIN_SCALE_Y = (vh - 2 * margin) / vh;
    return { INNER_MIN_SCALE_X, INNER_MIN_SCALE_Y };
  }

  // Animation thresholds
  const scaleEnd = window.innerHeight * 0.5; // scale finishes after 0.5 screenheight
  const moveEnd = window.innerHeight * 1.2; // left/right split finishes after 1.2 screenheight

  // Tilt effect variables
  let tiltX = 0;
  let tiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  const MAX_TILT = 10; // degrees
  const TILT_SMOOTH = 0.08; // even smoother
  const TILT_MARGIN = 0.25; // 25% margin outside the card for tilt

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function animate() {
    // Read the latest scale values every frame
    const OUTER_MIN_SCALE_X = parseFloat(getComputedStyle(root).getPropertyValue('--outer-min-scale-x'));
    const OUTER_MIN_SCALE_Y = parseFloat(getComputedStyle(root).getPropertyValue('--outer-min-scale-y'));
    const OUTER_MAX_RADIUS = parseFloat(getComputedStyle(root).getPropertyValue('--outer-max-radius'));
    // Dynamically calculate inner min scale based on margin
    const { INNER_MIN_SCALE_X, INNER_MIN_SCALE_Y } = getInnerMinScales();
    const LEFT_MAX_WIDTH = parseFloat(getComputedStyle(root).getPropertyValue('--left-max-width'));
    const RIGHT_MIN_WIDTH = parseFloat(getComputedStyle(root).getPropertyValue('--right-min-width'));
    const CONTAINER_GAP = parseFloat(getComputedStyle(root).getPropertyValue('--container-gap'));
    const INNER_MAX_RADIUS = parseFloat(getComputedStyle(root).getPropertyValue('--inner-max-radius'));
    const rect = stage.getBoundingClientRect();
    const scrolled = -rect.top;
    const vh = window.innerHeight;
    const scrolledVh = scrolled / vh;
    let progress = 0;
    let moveProgress = 0;
    let borderRadius = 0;

    // 1. Scaling progress (outer/inner containers)
    if (scrolled <= scaleEnd) {
      progress = clamp(scrolled / scaleEnd, 0, 1);
      moveProgress = 0;
      borderRadius = lerp(0, OUTER_MAX_RADIUS, progress);
    } else if (scrolled > scaleEnd && scrolled <= moveEnd) {
      progress = 1;
      moveProgress = clamp((scrolled - scaleEnd) / (moveEnd - scaleEnd), 0, 1);
      borderRadius = OUTER_MAX_RADIUS;
    } else if (scrolled > moveEnd) {
      progress = 1;
      moveProgress = 1;
      borderRadius = OUTER_MAX_RADIUS;
    }

    // 2. Scale outer/inner containers
    const scaleX_outer = lerp(1, OUTER_MIN_SCALE_X, progress);
    const scaleY_outer = lerp(1, OUTER_MIN_SCALE_Y, progress);
    const scaleX_inner = lerp(1, INNER_MIN_SCALE_X, progress);
    const scaleY_inner = lerp(1, INNER_MIN_SCALE_Y, progress);

    // 3. Left/right container width ratio
    const leftWidth = lerp(0, LEFT_MAX_WIDTH, moveProgress);
    // Gap should only appear as leftWidth grows
    const gap = moveProgress > 0 ? CONTAINER_GAP : 0;
    const rightWidth = lerp(100, 100 - (leftWidth + gap), moveProgress); // in vw

    // Smooth tilt animation
    tiltX += (targetTiltX - tiltX) * TILT_SMOOTH;
    tiltY += (targetTiltY - tiltY) * TILT_SMOOTH;

    // Only enable tilt as you scroll (progress from 0 to 1)
    const tiltStrength = progress; // 0 at fullscreen, 1 at fully scaled down
    const effectiveTiltX = tiltX * tiltStrength;
    const effectiveTiltY = tiltY * tiltStrength;

    // 4. Update styles via CSS variables
    // Only scale .bg-video-outer, do not apply sticky or scaling to .bg-video-outer-outer
    if (outer) {
      outer.style.transform = `scale(${scaleX_outer}, ${scaleY_outer}) perspective(1000px) rotateX(${effectiveTiltX}deg) rotateY(${effectiveTiltY}deg)`;
      outer.style.borderRadius = borderRadius + 'px';
      if (window.innerWidth <= 700) {
        outer.style.width = '100vw';
        outer.style.left = '0';
      } else {
        outer.style.width = '';
        outer.style.left = '';
      }
    }
    if (inner) {
      inner.style.transform = `scale(${scaleX_inner}, ${scaleY_inner})`;
      inner.style.borderRadius = lerp(0, INNER_MAX_RADIUS, progress) + 'px';
    }
    // Animate border wrapper to match container, do not scale
    const borderWrapper = right ? right.querySelector('.video-border-wrapper') : null;
    if (borderWrapper) {
      borderWrapper.style.transform = '';
    }
    // Animate video scale to reveal border
    const rightVideo = borderWrapper ? borderWrapper.querySelector('.right-video') : null;
    if (rightVideo) {
      // If video is fullscreen, remove scaling
      if (document.fullscreenElement === rightVideo || rightVideo.webkitDisplayingFullscreen) {
        rightVideo.style.transform = 'none';
      } else {
        // Shrink video to reveal border as you scroll
        const videoScaleX = scaleX_inner * 0.92;
        const videoScaleY = scaleY_inner * 0.92;
        rightVideo.style.transform = `scale(${videoScaleX}, ${videoScaleY})`;
      }
    }
    if (left) {
      left.style.width = `calc(${leftWidth}vw)`;
      left.style.marginRight = `${gap}vw`;
    }
    if (right) {
      right.style.width = `calc(${rightWidth}vw)`;
      right.style.minWidth = `${RIGHT_MIN_WIDTH}vw`;
      // Animate border radius for all corners
      const videoRadius = lerp(0, 24, progress); // 24px max radius for all corners
      right.style.borderRadius = `${videoRadius}px`;

      // Set video border radius to be exactly the same as container
      const rightVideo = borderWrapper ? borderWrapper.querySelector('.right-video') : right ? right.querySelector('.right-video') : null;
      if (rightVideo) {
        rightVideo.style.borderRadius = `${videoRadius}px`;
      }
    }

    // Animate .container-top height on mobile
    if (containerTop) {
      if (window.innerWidth <= 700) {
        // Animate from 0vh to 10vh based on progress
        const topHeight = lerp(0, 10, progress); // 0 to 10vh
        containerTop.style.height = topHeight + 'vh';
      } else {
        containerTop.style.height = '0';
      }
    }

    // Show video controls when scroll animation is nearly complete
    if (videoEl) {
      // Border color fades in as you scroll
      const borderAlpha = progress;
      videoEl.style.borderColor = `rgba(51,51,51,${borderAlpha})`;
      // Fade out grayscale as you scroll
      const grayscale = 1 - progress;
      videoEl.style.filter = `grayscale(${grayscale})`;
      // Show controls only when not in fullscreen
      if (progress >= 0.98) {
        videoEl.setAttribute('controls', 'controls');
      } else {
        videoEl.removeAttribute('controls');
      }
    }

    // Fade in left text as left container reaches max width
    if (leftText) {
      if (moveProgress >= 0.9) {
        // Fade in over the last 10% of moveProgress
        const fadeProgress = Math.min((moveProgress - 0.9) / 0.1, 1);
        leftText.style.opacity = fadeProgress;
      } else {
        leftText.style.opacity = 0;
      }
    }
    // Fade in MH Studio title and slogan as left text fades in
    const fadeInTitle = document.querySelector('.bg-parent-title.fade-in-title');
    if (fadeInTitle) {
      if (moveProgress >= 0) {
        const fadeProgress = Math.min((moveProgress - 0) / 0.3, 1);
        fadeInTitle.style.opacity = fadeProgress;
      } else {
        fadeInTitle.style.opacity = 0;
      }
    }

    // Hide the background/title when the card animation is done
    if (backgroundTitleHero) {
      if (progress >= 1) {
        backgroundTitleHero.style.opacity = '0';
        backgroundTitleHero.style.pointerEvents = 'none';
      } else {
        backgroundTitleHero.style.opacity = '1';
        backgroundTitleHero.style.pointerEvents = 'none';
      }
    }

    // Lock/unlock scroll and switch intro-hero-fixed to absolute when animation is done
    if (introHeroFixed) {
      if (progress >= 1) {
        introHeroFixed.style.position = 'absolute';
        introHeroFixed.style.top = '0';
        introHeroFixed.style.left = '0';
        introHeroFixed.style.opacity = '0';
        introHeroFixed.style.pointerEvents = 'none';
      } else {
        introHeroFixed.style.position = 'fixed';
        introHeroFixed.style.top = '0';
        introHeroFixed.style.left = '0';
        introHeroFixed.style.opacity = '1';
        introHeroFixed.style.pointerEvents = 'none';
      }
    }

    // Remove all .page-title related logic

    // Remove scroll lock logic. Implement scroll-jacking effect for intro section if needed.

    // Animate video top position on mobile
    if (video) {
      if (window.innerWidth <= 700) {
        // Animate top from centered to 60px + 5vh as you scroll
        const endTopPx = 120 + window.innerHeight * 0.10;
        const topPx = lerp(window.innerHeight / 2 - video.offsetHeight / 2, endTopPx, progress);
        video.style.top = topPx + 'px';
        video.style.position = 'sticky';
      } else {
        // Desktop: move target position down by 10vh
        const endTopPx = window.innerHeight * 0.10;
        const topPx = lerp(window.innerHeight / 2 - video.offsetHeight / 2, endTopPx, progress);
        video.style.top = topPx + 'px';
        video.style.position = 'sticky';
      }
    }

    requestAnimationFrame(animate);
  }

  // Add mousemove and mouseleave listeners for tilt
  if (outer) {
    outer.addEventListener('mousemove', function(e) {
      const rect = outer.getBoundingClientRect();
      // Expand the area for tilt by TILT_MARGIN
      const marginX = rect.width * TILT_MARGIN;
      const marginY = rect.height * TILT_MARGIN;
      const x = Math.max(-marginX, Math.min(rect.width + marginX, e.clientX - rect.left));
      const y = Math.max(-marginY, Math.min(rect.height + marginY, e.clientY - rect.top));
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      targetTiltY = ((x - centerX) / (centerX + marginX)) * MAX_TILT;
      targetTiltX = (-(y - centerY) / (centerY + marginY)) * MAX_TILT;
    });
    outer.addEventListener('mouseleave', function() {
      targetTiltX = 0;
      targetTiltY = 0;
    });
  }

  animate();
})();

  // ===== Video Mask Color Effect =====
document.addEventListener('DOMContentLoaded', function() {
  const maskContainer = document.querySelector('.video-mask-container');
  const maskText = document.querySelector('.video-mask-text');
  const grayscaleVideo = document.querySelector('.right-video.grayscale');
  const maskCanvas = document.querySelector('.video-mask-canvas');
  const stage = document.querySelector('.video-anim-stage');
  
  // Create a hidden color video for canvas drawing
  let colorVideo = document.createElement('video');
  colorVideo.src = 'Media/videos/bio_reel_adj.mp4';
  colorVideo.autoplay = true;
  colorVideo.loop = true;
  colorVideo.muted = true;
  colorVideo.playsInline = true;
  colorVideo.preload = 'auto';
  colorVideo.style.display = 'none';
  document.body.appendChild(colorVideo);

  function drawMaskedVideo() {
    if (!maskCanvas || !colorVideo) return;
    const ctx = maskCanvas.getContext('2d');
    // Set canvas size to match the grayscale video, using devicePixelRatio for sharpness
    const rect = grayscaleVideo.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    maskCanvas.width = rect.width * dpr;
    maskCanvas.height = rect.height * dpr;
    maskCanvas.style.width = rect.width + 'px';
    maskCanvas.style.height = rect.height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    // Draw the text in white, centered
    const text = 'MORITZ\nHOCHER';
    ctx.font = `bold ${Math.floor(rect.height * 0.32)}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(rect.width / 2, rect.height / 2);
    const lines = text.split('\n');
    const lineHeight = rect.height * 0.38;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 1;
      ctx.fillText(lines[i], 0, (i - (lines.length-1)/2) * lineHeight);
    }
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(colorVideo, -rect.width / 2, -rect.height / 2, rect.width, rect.height);
    ctx.globalCompositeOperation = 'source-over'; // reset
    ctx.restore();
  }

  const maskTextContainer = document.querySelector('.video-text-mask-container');
  function handleMaskVisibility() {
    if (!maskTextContainer || !stage) return;
    const rect = stage.getBoundingClientRect();
    const scrolled = -rect.top;
    const vh = window.innerHeight;
    let opacity = 0.3;
    if (scrolled > vh * 0.3) {
      maskTextContainer.classList.add('hide');
      opacity = 0;
    } else {
      maskTextContainer.classList.remove('hide');
      opacity = 0.3 * (1 - (scrolled / (vh * 0.3)));
      opacity = Math.max(0, Math.min(0.3, opacity));
    }
    maskTextContainer.style.opacity = opacity;
    const videoBg = maskTextContainer.querySelector('.video-bg');
    const textMask = maskTextContainer.querySelector('.video-text-mask');
    if (videoBg) videoBg.style.opacity = opacity;
    if (textMask) textMask.style.opacity = opacity;
  }

  function animateMask() {
    drawMaskedVideo();
    requestAnimationFrame(animateMask);
  }

  window.addEventListener('resize', drawMaskedVideo);
  window.addEventListener('DOMContentLoaded', drawMaskedVideo);
  window.addEventListener('scroll', handleMaskVisibility);
  colorVideo.addEventListener('play', animateMask);
  handleMaskVisibility();
  if (!colorVideo.paused) animateMask();
});

// ===== Custom JS Carousel Logic =====
(function() {
  // === Constants ===
  const Z_INDEX = {
    CENTER: 100,
    HOVERED: 90,
    ADJACENT: 80,
    FAR: 70,
    HIDDEN: 0
  };
  
  const ANIMATION = {
    TILT_PER_STEP: 10,
    SCALE_PER_STEP: 0.1,
    HOVER_SCALE: 1.08,
    ZOOM_SCALE: 0.8,
    MAX_VISIBLE: 5
  };
  
  const SPACING = {
    CENTER: 10,
    EDGE: 6,
    MOBILE_CENTER: 10,
    MOBILE_EDGE: 8
  };
  
  const SIZES = {
    DESKTOP: { width: 300, height: 400 },
    MOBILE: { width: 150, height: 200 }
  };

  // === State ===
  const cards = Array.from(document.querySelectorAll('.custom-card'));
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const total = cards.length;
  let center = 0;
  let zoomed = false;
  let isAnimating = false;
  let currentParams = { ...SPACING, ...SIZES.DESKTOP };

  // Expose API for mobile controls
  window._customCarousel = {
    get center() { return center; },
    set center(val) { center = val; },
    render,
    total,
  };

  // Ultra-clean render function for dragging - no complex logic
  function renderDragClean(centerPos) {
    const maxRel = Math.floor(total / 2);
    
    for (let i = 0; i < total; i++) {
      const card = cards[i];
      
      // Calculate relative position from center
      let rel = i - centerPos;
      
      // Handle wrapping - keep it simple
      if (rel > maxRel) rel -= total;
      if (rel < -maxRel) rel += total;
      
      const absRel = Math.abs(rel);
      const isCenter = (absRel < 0.3);
      
      // Hide cards that are too far away
      if (absRel > 5) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        continue;
      }
      
      // Calculate positioning
      const spacing = currentParams.CENTER - (currentParams.CENTER - currentParams.EDGE) * (absRel / maxRel);
      const rotateY = rel * ANIMATION.TILT_PER_STEP;
      const scale = 1 - ANIMATION.SCALE_PER_STEP * absRel;
      const translateX = rel * spacing;
      
      // Simple z-index - center on top, others by distance
      const zIndex = isCenter ? 100 : Math.max(10, 100 - absRel * 10);
      
      // Apply transform
      card.style.transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.zIndex = zIndex.toString();
      card.style.opacity = '1';
      card.style.pointerEvents = '';
    }
  }

  // Optimized render function with better performance
  function render(prevCenter) {
    // Normalize center to valid range for infinite scrolling
    while (center < 0) center += total;
    while (center >= total) center -= total;
    
    const maxRel = Math.floor(total / 2);
    const isMobile = window.innerWidth <= 700;
    
    // Batch DOM updates for better performance
    const updates = [];
    
    for (let i = 0; i < total; i++) {
      const card = cards[i];
      let rel = (i - center + total) % total;
      if (rel > total / 2) rel -= total;
      
      const absRel = Math.abs(rel);
      const isCenter = (absRel < 0.5); // Consider center if within 0.5 of the center position
      const isHovered = card.classList.contains('hovered');
      
      // Skip rendering if card is too far away and not visible
      if (absRel > ANIMATION.MAX_VISIBLE && !isCenter && !zoomed) {
        updates.push({
          card,
          styles: {
            opacity: '0',
            pointerEvents: 'none',
            zIndex: Z_INDEX.HIDDEN
          },
          classes: { remove: ['zoomed', 'center-or-hovered'] }
        });
        continue;
      }
      
      // Detect wrapping to disable transitions for cards that jump to the other side
      let prevRel = undefined;
      if (typeof prevCenter === 'number') {
        prevRel = (i - prevCenter + total) % total;
        if (prevRel > total / 2) prevRel -= total;
      }
      
      // If wrapping (jumping from +maxRel to -maxRel or vice versa), disable transition
      if (typeof prevRel === 'number' && Math.abs(rel - prevRel) > 1 && Math.abs(rel) === maxRel) {
        card.style.transition = 'none';
        requestAnimationFrame(() => {
          card.style.transition = '';
        });
      } else {
        card.style.transition = '';
      }
      
      // Calculate positioning
      const spacing = currentParams.CENTER - (currentParams.CENTER - currentParams.EDGE) * (absRel / maxRel);
      const rotateY = rel * ANIMATION.TILT_PER_STEP;
      let scale = 1 - ANIMATION.SCALE_PER_STEP * absRel;
      
      // Apply hover effects
      if (isHovered) {
        scale *= ANIMATION.HOVER_SCALE;
      }
      
      const translateX = rel * spacing;
      let transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
      
      // Handle zoom state
      if (isCenter && zoomed) {
        const targetScale = Math.min(ANIMATION.ZOOM_SCALE * window.innerHeight / currentParams.height, 2);
        scale *= targetScale;
        transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
        
        updates.push({
          card,
          styles: {
            transform,
            zIndex: Z_INDEX.CENTER,
            opacity: '1',
            pointerEvents: '',
            width: 'var(--custom-card-width)',
            height: 'var(--custom-card-height)'
          },
          classes: { add: ['zoomed'], remove: ['center-or-hovered'] }
        });
      } else if (zoomed) {
        // Hide non-center cards when zoomed
        updates.push({
          card,
          styles: {
            opacity: '0',
            pointerEvents: 'none',
            transform,
            width: 'var(--custom-card-width)',
            height: 'var(--custom-card-height)'
          },
          classes: { remove: ['zoomed', 'center-or-hovered'] }
        });
      } else {
        // FIXED Z-INDEX LAYERING - Center always on top, others stack properly
        let zIndex;
        if (isCenter) {
          zIndex = Z_INDEX.CENTER; // Center always on top (100)
        } else {
          // Progressive z-index based on distance from center (works with decimals)
          if (absRel <= 1) {
            zIndex = 80; // Adjacent cards
          } else if (absRel <= 2) {
            zIndex = 70; // Second adjacent cards
          } else if (absRel <= 3) {
            zIndex = 60; // Third adjacent cards
          } else if (absRel <= 4) {
            zIndex = 50; // Fourth adjacent cards
          } else if (absRel <= 5) {
            zIndex = 40; // Fifth adjacent cards
          } else {
            zIndex = 30; // All other cards
          }
          
          // Hovered cards get small boost but stay in their layer
          if (isHovered) {
            zIndex += 5;
          }
        }
        
        updates.push({
          card,
          styles: {
            transform,
            zIndex: zIndex.toString(),
            opacity: absRel > 5 ? '0.25' : '1',
            pointerEvents: '',
            width: 'var(--custom-card-width)',
            height: 'var(--custom-card-height)'
          },
          classes: { 
            add: isHovered ? ['center-or-hovered'] : [],
            remove: ['zoomed', ...(isHovered ? [] : ['center-or-hovered'])]
          }
        });
      }
    }
    
    // Batch apply all updates
    updates.forEach(({ card, styles, classes }) => {
      Object.assign(card.style, styles);
      if (classes.add) classes.add.forEach(cls => card.classList.add(cls));
      if (classes.remove) classes.remove.forEach(cls => card.classList.remove(cls));
    });
  }

  function setGalleryParamsForScreen() {
    const isMobile = window.innerWidth <= 700;
    
    if (isMobile) {
      currentParams = {
        CENTER: SPACING.MOBILE_CENTER,
        EDGE: SPACING.MOBILE_EDGE,
        width: SIZES.MOBILE.width,
        height: SIZES.MOBILE.height
      };
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    } else {
      currentParams = {
        CENTER: SPACING.CENTER,
        EDGE: SPACING.EDGE,
        width: SIZES.DESKTOP.width,
        height: SIZES.DESKTOP.height
      };
      if (prevBtn) prevBtn.style.display = '';
      if (nextBtn) nextBtn.style.display = '';
    }
    
    document.documentElement.style.setProperty('--custom-card-width', currentParams.width + 'px');
    document.documentElement.style.setProperty('--custom-card-height', currentParams.height + 'px');
    render();
  }
  setGalleryParamsForScreen();
  window.addEventListener('resize', setGalleryParamsForScreen);

  // Optimized navigation with throttling
  let prevCenter = 0;
  let lastNavTime = 0;
  const NAV_THROTTLE = 100; // ms
  
  function navigate(direction) {
    const now = Date.now();
    if (now - lastNavTime < NAV_THROTTLE) return;
    lastNavTime = now;
    
    prevCenter = center;
    center = (center + direction + total) % total;
    render(prevCenter); // Pass prevCenter for proper wrapping detection
  }
  
  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  // Optimized animation with requestAnimationFrame
  function animateToCenter(targetIdx) {
    if (isAnimating || center === targetIdx) return;
    isAnimating = true;
    
    const getShortestStep = (from, to) => {
      let diff = (to - from + total) % total;
      if (diff > total / 2) diff -= total;
      return diff;
    };
    
    let step = getShortestStep(center, targetIdx);
    const startTime = performance.now();
    const duration = Math.abs(step) * 60; // 60ms per step
    
    function stepAnim(currentTime) {
      if (center === targetIdx) {
        isAnimating = false;
        return;
      }
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress >= 1) {
        center = targetIdx;
        render(prevCenter);
        isAnimating = false;
        return;
      }
      
      const prevCenter = center;
      if (step > 0) {
        center = (center + 1) % total;
      } else if (step < 0) {
        center = (center - 1 + total) % total;
      }
      render(prevCenter);
      
      if (center !== targetIdx) {
        requestAnimationFrame(stepAnim);
      } else {
        isAnimating = false;
      }
    }
    
    requestAnimationFrame(stepAnim);
  }
  // Hover handling without debouncing for instant response
  function handleHoverEnter(card) {
      card.classList.add('hovered');
    render(center);
  }
  
  function handleHoverLeave(card) {
      card.classList.remove('hovered');
    render(center);
  }
  
  // Add INSTANT event listeners to cards
  cards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => handleHoverEnter(card));
    card.addEventListener('mouseleave', () => handleHoverLeave(card));
    
    // Click handler for both desktop and mobile
    card.addEventListener('click', (e) => {
      // Prevent click during drag
      if (isDragging) {
        e.preventDefault();
        return;
      }
      
      if (center !== idx && !isAnimating) {
        animateToCenter(idx);
      } else if (center === idx && !isAnimating) {
        // Toggle zoom for center card (works on both desktop and mobile)
        zoomed = !zoomed;
        render(center);
        console.log('Zoom toggled:', zoomed); // Debug log
      }
    });
    
    // Add touchstart for mobile click detection
    let cardTouchStartX = 0;
    let cardTouchStartY = 0;
    let cardTouchStartTime = 0;
    
    card.addEventListener('touchstart', (e) => {
      // Only handle if not already dragging
      if (!isDragging) {
        card.dataset.touchStarted = 'true';
        cardTouchStartX = e.touches[0].clientX;
        cardTouchStartY = e.touches[0].clientY;
        cardTouchStartTime = Date.now();
      }
    });
    
    // Add touchend for mobile click detection
    card.addEventListener('touchend', (e) => {
      if (card.dataset.touchStarted === 'true' && !isDragging) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - cardTouchStartX;
        const deltaY = touchEndY - cardTouchStartY;
        const touchDuration = Date.now() - cardTouchStartTime;
        
        // Check if it was a tap (small movement, short duration) or a swipe
        const isTap = Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && touchDuration < 300;
        
        if (isTap) {
          e.preventDefault();
          
          if (center !== idx && !isAnimating) {
            animateToCenter(idx);
          } else if (center === idx && !isAnimating) {
            // Toggle zoom for center card on mobile (only on tap, not swipe)
            zoomed = !zoomed;
            render(center);
            console.log('Mobile zoom toggled:', zoomed); // Debug log
          }
        } else {
          // It's a swipe - let the main carousel handler deal with it
          // Don't prevent default, let it bubble up
        }
      }
      card.dataset.touchStarted = 'false';
    });
  });
  
  // COMPLETELY BYPASS EVERYTHING - Direct card manipulation
  let touchStartX = 0;
  let isDragging = false;
  let startCenter = 0;
  let dragOffset = 0;
  
  const carouselContainer = document.querySelector('.custom-carousel-cards');
  if (carouselContainer) {
    carouselContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        startCenter = center;
        dragOffset = 0;
        isDragging = true;
        
        // Kill transitions
        cards.forEach(card => {
          card.style.transition = 'none';
        });
      }
    });
    
    carouselContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const deltaX = e.touches[0].clientX - touchStartX;
      
      // If in fullscreen mode, don't do continuous dragging
      if (zoomed) {
        return;
      }
      
      dragOffset = -deltaX * 0.01; // Sensitivity
      
      // Calculate new center
      const newCenter = startCenter + dragOffset;
      
      // Position each card based on distance from new center
      cards.forEach((card, i) => {
        let distance = i - newCenter;
        
        // Proper wrapping - keep distance in reasonable range
        while (distance > total / 2) distance -= total;
        while (distance < -total / 2) distance += total;
        
        const absDistance = Math.abs(distance);
        
        // Use the same spacing as the normal render function
        const maxRel = Math.floor(total / 2);
        const spacing = currentParams.CENTER - (currentParams.CENTER - currentParams.EDGE) * (absDistance / maxRel);
        const translateX = distance * spacing;
        const rotateY = distance * ANIMATION.TILT_PER_STEP;
        const scale = absDistance < 0.5 ? 1 : 1 - absDistance * ANIMATION.SCALE_PER_STEP;
        
        // Proper z-index stacking like the normal render function
        let zIndex;
        if (absDistance < 0.5) {
          zIndex = 100; // Center card
        } else {
          if (absDistance <= 1) {
            zIndex = 80; // Adjacent cards
          } else if (absDistance <= 2) {
            zIndex = 70; // Second adjacent cards
          } else if (absDistance <= 3) {
            zIndex = 60; // Third adjacent cards
          } else if (absDistance <= 4) {
            zIndex = 50; // Fourth adjacent cards
          } else if (absDistance <= 5) {
            zIndex = 40; // Fifth adjacent cards
          } else {
            zIndex = 30; // All other cards
          }
        }
        
        card.style.transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.zIndex = zIndex.toString();
        card.style.opacity = '1';
      });
    });
    
    carouselContainer.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      // Restore transitions
      cards.forEach(card => {
        card.style.transition = '';
      });
      
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      
      // If in fullscreen mode, handle next/previous navigation
      if (zoomed) {
        if (Math.abs(deltaX) > 30) { // Minimum swipe distance
          if (deltaX > 0) {
            // Swipe right = previous
            center = (center - 1 + total) % total;
          } else {
            // Swipe left = next
            center = (center + 1) % total;
          }
          
          render(center);
        }
        return;
      }
      
      // Normal carousel mode - snap to nearest card
      const finalCenter = startCenter + dragOffset;
      let nearestCenter = Math.round(finalCenter);
      
      // Update center and render normally (render function handles wrapping)
      center = nearestCenter;
      console.log('Center updated to:', center, 'Total cards:', total); // Debug log
      render(center);
    });
    
    carouselContainer.addEventListener('touchcancel', () => {
      if (!isDragging) return;
      isDragging = false;
      
      // Restore transitions
      cards.forEach(card => {
        card.style.transition = '';
      });
      
      // If in fullscreen mode, don't change anything
      if (zoomed) {
        return;
      }
      
      // Normal mode - snap to nearest card
      const finalCenter = startCenter + dragOffset;
      let nearestCenter = Math.round(finalCenter);
      
      // Update center and render normally (render function handles wrapping)
      center = nearestCenter;
      console.log('Touch cancel - Center updated to:', center, 'Total cards:', total); // Debug log
      render(center);
    });
  }

  // === Assign covers to cards ===
  const COVER_IMAGES = [
    'AHM_cover_final_V4_glow_verydark_titled-min-min.jpg',
    'budding_coverpng_3_titled-min-min.jpg',
    'mowing_the_nucleotides_0_titled-min-min.jpg',
    'erasing_the_nucleotides_0_titled-min-min.jpg',
    'printer_closeup_cover_titled_0-min-min.jpg',
    'walker_cover_titled_0-min-min.jpg',
    'hand_thing_pose_cover_5_camraw_grey-min-min.jpg',
    'hand_ET_pose_cover_titled_green_0-min-min.jpg',
    'cover_V2_color_adj_titled-min-min.jpg',
    'Copy of cover_hand_tenticle_black-min.jpg'
  ];
  
  // Shuffle and assign covers
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  const shuffledCovers = shuffleArray(COVER_IMAGES);
  const cardCovers = new Array(cards.length);
  
  // Place 'budding' at start and middle, fill rest with shuffled covers
  cardCovers[0] = 'budding_coverpng_3_titled-min-min.jpg';
  cardCovers[Math.floor(cards.length / 2)] = 'budding_coverpng_3_titled-min-min.jpg';
  
  const otherCovers = shuffledCovers.filter(name => name !== 'budding_coverpng_3_titled-min-min.jpg');
  let coverIndex = 0;
  
  for (let i = 0; i < cardCovers.length; i++) {
    if (!cardCovers[i]) {
      cardCovers[i] = otherCovers[coverIndex % otherCovers.length];
      coverIndex++;
    }
  }
  
  // Assign covers to cards
  cards.forEach((card, idx) => {
    card.innerHTML = '';
    const coverName = cardCovers[idx % cardCovers.length];
    if (coverName) {
      const img = document.createElement('img');
      img.src = `Media/journal_covers/extreme_compression/${coverName}`;
      img.alt = `Journal Cover ${idx + 1}`;
      img.loading = 'lazy'; // Performance optimization
      card.appendChild(img);
    }
  });
  
  // Initial render
  render(center);
})();

// ===== Color Fade Effects =====
const colorFadeWrapper = document.querySelector('.color-fade-wrapper');
const stage = document.querySelector('.video-anim-stage');

function handleColorFade() {
  if (!colorFadeWrapper || !stage) return;
  const rect = stage.getBoundingClientRect();
  const scrolled = -rect.top;
  const vh = window.innerHeight;
  const opacity = scrolled > vh * 0.3 ? 0 : Math.max(0, 1 - (scrolled / (vh * 0.3)));
  colorFadeWrapper.style.opacity = opacity;
}

window.addEventListener('scroll', handleColorFade);
window.addEventListener('DOMContentLoaded', handleColorFade);

// ===== Utility Functions =====
document.addEventListener('DOMContentLoaded', function() {
  // Remove unused canvas if it exists
  const canvas = document.getElementById('background-dots-canvas');
  if (canvas) {
    canvas.remove();
  }
}); 

// Navbar background fade on scroll
(function() {
  const navbar = document.querySelector('.navbar');
  function onScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll);
  window.addEventListener('DOMContentLoaded', onScroll);
})(); 

// Restore rounded corners to video containers on mobile after scroll
(function() {
  function handleMobileBorderRadius() {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const outer = document.querySelector('.bg-video-outer');
    const inner = document.querySelector('.bg-video-inner');
    if (!outer || !inner) return;
    if (isMobile && window.scrollY > 40) {
      outer.style.borderRadius = '32px';
      inner.style.borderRadius = '24px';
    } else if (isMobile) {
      outer.style.borderRadius = '0';
      inner.style.borderRadius = '0';
    } else {
      outer.style.borderRadius = '';
      inner.style.borderRadius = '';
    }
  }
  window.addEventListener('scroll', handleMobileBorderRadius);
  window.addEventListener('resize', handleMobileBorderRadius);
  document.addEventListener('DOMContentLoaded', handleMobileBorderRadius);
})(); 

// Add fullscreen event listeners to right-video for border wrapper
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var rightVideo = document.querySelector('.right-video');
    var borderWrapper = rightVideo && rightVideo.closest('.video-border-wrapper');
    if (!rightVideo || !borderWrapper) return;
    function setBorderWrapperFullscreen() {
      borderWrapper.classList.add('is-fullscreen');
      rightVideo.style.transform = 'none';
      borderWrapper.style.transform = 'none';
    }
    function unsetBorderWrapperFullscreen() {
      borderWrapper.classList.remove('is-fullscreen');
      // The transform for rightVideo and borderWrapper will be set by the animation loop
    }
    rightVideo.addEventListener('fullscreenchange', function() {
      if (document.fullscreenElement === rightVideo) {
        setBorderWrapperFullscreen();
      } else {
        unsetBorderWrapperFullscreen();
      }
    });
    rightVideo.addEventListener('webkitfullscreenchange', function() {
      if (document.webkitFullscreenElement === rightVideo) {
        setBorderWrapperFullscreen();
      } else {
        unsetBorderWrapperFullscreen();
      }
    });
    // For iOS Safari
    rightVideo.addEventListener('webkitbeginfullscreen', setBorderWrapperFullscreen);
    rightVideo.addEventListener('webkitendfullscreen', unsetBorderWrapperFullscreen);
  });
})(); 

document.addEventListener('DOMContentLoaded', function() {
  var mobileMenuToggle = document.getElementById('mobileMenuToggle');
  var mobileLinks = document.getElementById('mobileLinks');
  var mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  if (mobileMenuToggle && mobileLinks) {
    mobileMenuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (mobileLinks.style.display === 'block') {
        mobileLinks.style.display = 'none';
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
      } else {
        mobileLinks.style.display = 'block';
        if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
      }
    });
    Array.from(mobileLinks.querySelectorAll('a')).forEach(function(link) {
      link.addEventListener('click', function() {
        mobileLinks.style.display = 'none';
        if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
      });
    });
    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', function() {
        mobileLinks.style.display = 'none';
        mobileMenuOverlay.classList.remove('active');
      });
    }
  }
}); 

// ===== Mobile Carousel Controls =====
document.addEventListener('DOMContentLoaded', function() {
  const mobilePrevBtn = document.getElementById('mobileCarouselPrev');
  const mobileNextBtn = document.getElementById('mobileCarouselNext');
  
  if (mobilePrevBtn) {
    mobilePrevBtn.addEventListener('click', () => {
      const carousel = window._customCarousel;
      if (carousel) {
        const prevCenter = carousel.center;
        carousel.center = (carousel.center - 1 + carousel.total) % carousel.total;
        carousel.render(prevCenter);
      }
    });
  }
  
  if (mobileNextBtn) {
    mobileNextBtn.addEventListener('click', () => {
      const carousel = window._customCarousel;
      if (carousel) {
        const prevCenter = carousel.center;
        carousel.center = (carousel.center + 1) % carousel.total;
        carousel.render(prevCenter);
      }
    });
  }
}); 

// (Coding Torque carousel logic removed) 
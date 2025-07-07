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
      if (moveProgress >= 0.05) {
        const fadeProgress = Math.min((moveProgress - 0.05) / 0.3, 1);
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

// ===== Journal Gallery Logic =====
document.addEventListener('DOMContentLoaded', function () {
  const gallery = document.querySelector('.journal-gallery');
  const covers = document.querySelectorAll('.journal-cover');

  // --- Drag to scroll ---
  let isDown = false;
  let startX, scrollLeft;

  if (gallery) {
    gallery.addEventListener('mousedown', (e) => {
      isDown = true;
      gallery.classList.add('active');
      document.body.classList.add('journal-cursor-grab');
      startX = e.pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    gallery.addEventListener('mouseleave', () => {
      isDown = false;
      gallery.classList.remove('active');
      document.body.classList.remove('journal-cursor-grab');
    });
    gallery.addEventListener('mouseup', () => {
      isDown = false;
      gallery.classList.remove('active');
      document.body.classList.remove('journal-cursor-grab');
    });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      const walk = (x - startX) * 1.2; //scroll-fast
      gallery.scrollLeft = scrollLeft - walk;
    });
    // Touch events
    gallery.addEventListener('touchstart', (e) => {
      isDown = true;
      startX = e.touches[0].pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    gallery.addEventListener('touchend', () => {
      isDown = false;
    });
    gallery.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - gallery.offsetLeft;
      const walk = (x - startX) * 1.2;
      gallery.scrollLeft = scrollLeft - walk;
    });
    // --- Mouse wheel horizontal scroll ---
    // (Removed for iTunes-style gallery)
  }

  // --- iTunes-style endless looping carousel ---
  let selectedIndex = 0;
  const visibleCount = 5; // Number of cards visible at once (center + 2 on each side)
  function mod(n, m) { return ((n % m) + m) % m; }
  function updateCovers() {
    const N = covers.length;
    covers.forEach((cover, idx) => {
      let offset = idx - selectedIndex;
      // Wrap offsets for endless effect
      if (offset > N / 2) offset -= N;
      if (offset < -N / 2) offset += N;
      if (Math.abs(offset) > Math.floor(visibleCount / 2)) {
        cover.style.opacity = 0;
        cover.style.pointerEvents = 'none';
        cover.style.transform = 'scale(0.8)';
        cover.style.zIndex = 0;
      } else if (offset === 0) {
        cover.style.opacity = 1;
        cover.style.pointerEvents = '';
        cover.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
        cover.style.zIndex = 100;
      } else {
        cover.style.opacity = 1;
        cover.style.pointerEvents = '';
        const maxTilt = 45;
        const tilt = -offset * maxTilt;
        const maxTranslate = 180;
        const translateX = offset * maxTranslate;
        const scale = Math.max(0.85, 1 - Math.abs(offset) * 0.12);
        cover.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${tilt}deg)`;
        cover.style.zIndex = 100 - Math.abs(offset);
      }
    });
  }
  function centerCover(idx) {
    const N = covers.length;
    selectedIndex = mod(idx, N);
    // Center the selected card
    const galleryRect = gallery.getBoundingClientRect();
    const coverRect = covers[selectedIndex].getBoundingClientRect();
    const galleryCenter = galleryRect.left + galleryRect.width / 2;
    const coverCenter = coverRect.left + coverRect.width / 2;
    const scrollDiff = coverCenter - galleryCenter;
    gallery.scrollBy({ left: scrollDiff, behavior: 'smooth' });
    updateCovers();
  }
  // Initial update
  if (gallery) {
    window.addEventListener('resize', updateCovers);
    setTimeout(() => {
      updateCovers();
      centerCover(selectedIndex);
    }, 100);
  }
  // --- Navigation Arrows (center next/prev card, looping) ---
  function createArrow(direction) {
    const arrow = document.createElement('button');
    arrow.className = `carousel-prev carousel-arrow`;
    if (direction === 'right') arrow.className = `carousel-next carousel-arrow`;
    // No symbol or innerHTML, just an empty button
    arrow.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
    arrow.addEventListener('click', () => {
      if (direction === 'left') {
        prevBtn.click();
      } else {
        nextBtn.click();
      }
    });
    return arrow;
  }
  if (gallery) {
    const leftArrow = createArrow('left');
    const rightArrow = createArrow('right');
    gallery.parentElement.appendChild(leftArrow);
    gallery.parentElement.appendChild(rightArrow);
  }
  // --- Keyboard navigation (left/right arrows, looping) ---
  document.addEventListener('keydown', function(e) {
    if (document.activeElement && document.activeElement.classList.contains('journal-cover')) return;
    if (e.key === 'ArrowLeft') {
      centerCover(selectedIndex - 1);
    } else if (e.key === 'ArrowRight') {
      centerCover(selectedIndex + 1);
    }
  });
  // --- Click to select and center ---
  covers.forEach((cover, idx) => {
    cover.addEventListener('click', function () {
      centerCover(idx);
    });
  });

  // --- Custom Cursor (basic) ---
  covers.forEach((cover) => {
    cover.addEventListener('mouseenter', () => {
      gallery.style.cursor = 'pointer';
    });
    cover.addEventListener('mouseleave', () => {
      gallery.style.cursor = 'grab';
    });
  });
  if (gallery) {
    gallery.addEventListener('mousedown', () => {
      gallery.style.cursor = 'grabbing';
    });
    gallery.addEventListener('mouseup', () => {
      gallery.style.cursor = 'grab';
    });
  }

  // ===== Video Mask Color Effect =====
  const maskContainer = document.querySelector('.video-mask-container');
  const maskText = document.querySelector('.video-mask-text');
  const grayscaleVideo = document.querySelector('.right-video.grayscale');
  const maskCanvas = document.querySelector('.video-mask-canvas');
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
    if (!maskTextContainer) return;
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
    console.log('Mask container opacity:', opacity);
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
  // === Tweakable parameters (spacing in vw, size in px) ===
  let CARD_SPACING_CENTER = 10; // vw between card centers (center)
  let CARD_SPACING_EDGE = 6;   // vw between card centers (edge)
  let CARD_WIDTH = 300; // px
  let CARD_HEIGHT = 400; // px
  let TILT_PER_STEP = 10; // degrees per step from center
  let SCALE_PER_STEP = 0.1; // scale reduction per step from center

  const cards = Array.from(document.querySelectorAll('.custom-card'));
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const total = cards.length;
  let center = 0;
  let zoomed = false;

  function render(prevCenter) {
    const maxRel = Math.floor(total / 2);
    for (let i = 0; i < total; i++) {
      const card = cards[i];
      let rel = (i - center + total) % total;
      if (rel > total / 2) rel -= total;
      // Detect wrapping: if previous center is defined, and this card's rel jumps from +maxRel to -maxRel or vice versa
      let prevRel = undefined;
      if (typeof prevCenter === 'number') {
        prevRel = (i - prevCenter + total) % total;
        if (prevRel > total / 2) prevRel -= total;
      }
      // If wrapping, disable transition for this card
      if (typeof prevRel === 'number' && Math.abs(rel - prevRel) > 1 && Math.abs(rel) === maxRel) {
        card.style.transition = 'none';
        requestAnimationFrame(() => {
          card.style.transition = '';
        });
      } else {
        card.style.transition = '';
      }
      let absRel = Math.abs(rel);
      const spacing = CARD_SPACING_CENTER - (CARD_SPACING_CENTER - CARD_SPACING_EDGE) * (absRel / maxRel);
      const rotateY = rel * TILT_PER_STEP;
      let scale = 1 - SCALE_PER_STEP * absRel;
      let isCenter = (rel === 0);
      let isHovered = card.classList.contains('hovered');
      // Only apply scale/border on hover or zoomed
      if (isHovered) {
        scale *= 1.08;
        card.classList.add('center-or-hovered');
      } else {
        card.classList.remove('center-or-hovered');
      }
      const translateX = rel * spacing;
      let transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
      if (isCenter && zoomed) {
        // Dynamically scale so the card reaches 80% of viewport height
        let targetScale = Math.min(0.8 * window.innerHeight / CARD_HEIGHT, 2);
        scale *= targetScale;
        card.classList.add('zoomed');
        card.style.zIndex = 100;
        card.style.opacity = 1;
        card.style.pointerEvents = '';
        card.style.height = 'var(--custom-card-height)';
        card.style.width = 'var(--custom-card-width)';
        card.style.transform = `translate(-50%, -50%) translateX(${translateX}vw) rotateY(${rotateY}deg) scale(${scale})`;
      } else if (zoomed) {
        // Hide all non-center cards when zoomed
        card.style.opacity = 0;
        card.style.pointerEvents = 'none';
        card.classList.remove('zoomed');
        card.style.height = 'var(--custom-card-height)';
        card.style.width = 'var(--custom-card-width)';
        card.style.transform = transform;
      } else {
        card.classList.remove('zoomed');
        card.style.pointerEvents = '';
        card.style.opacity = absRel > 5 ? 0.25 : 1;
        card.style.height = 'var(--custom-card-height)';
        card.style.width = 'var(--custom-card-width)';
        card.style.transform = transform;
      }
      card.style.zIndex = zoomed && !isCenter ? 0 : 10 - absRel;
      card.style.width = 'var(--custom-card-width)';
      card.style.height = 'var(--custom-card-height)';
    }
  }

  function setGalleryParamsForScreen() {
    if (window.innerWidth <= 700) {
      CARD_SPACING_CENTER = 10;
      CARD_SPACING_EDGE = 8;
      CARD_WIDTH = 150;
      CARD_HEIGHT = 200;
      TILT_PER_STEP = 10;
      SCALE_PER_STEP = 0.1;
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    } else {
      CARD_SPACING_CENTER = 10;
      CARD_SPACING_EDGE = 6;
      CARD_WIDTH = 300;
      CARD_HEIGHT = 400;
      TILT_PER_STEP = 10;
      SCALE_PER_STEP = 0.1;
      if (prevBtn) prevBtn.style.display = '';
      if (nextBtn) nextBtn.style.display = '';
    }
    document.documentElement.style.setProperty('--custom-card-width', CARD_WIDTH + 'px');
    document.documentElement.style.setProperty('--custom-card-height', CARD_HEIGHT + 'px');
    render();
  }
  setGalleryParamsForScreen();
  window.addEventListener('resize', setGalleryParamsForScreen);

  let prevCenter = 0;
  prevBtn.addEventListener('click', () => {
    prevCenter = center;
    center = (center - 1 + total) % total;
    render(prevCenter);
  });
  nextBtn.addEventListener('click', () => {
    prevCenter = center;
    center = (center + 1) % total;
    render(prevCenter);
  });

  let isAnimating = false;
  function animateToCenter(targetIdx) {
    if (isAnimating || center === targetIdx) return;
    isAnimating = true;
    const totalSteps = total;
    const getShortestStep = (from, to) => {
      let diff = (to - from + total) % total;
      if (diff > total / 2) diff -= total;
      return diff;
    };
    let step = getShortestStep(center, targetIdx);
    function stepAnim() {
      if (center === targetIdx) {
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
      step = getShortestStep(center, targetIdx);
      if (center !== targetIdx) {
        setTimeout(stepAnim, 60); // Adjust speed here (ms per step)
      } else {
        isAnimating = false;
      }
    }
    stepAnim();
  }
  // Add hover listeners to cards
  cards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('hovered');
      render(center); // re-render to apply scale
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hovered');
      render(center); // re-render to remove scale
    });
    // Add click-to-center functionality with animation
    card.addEventListener('click', () => {
      if (center !== idx && !isAnimating) {
        animateToCenter(idx);
      } else if (center === idx && !isAnimating) {
        zoomed = !zoomed;
        render(center);
      }
    });
  });

  // === Assign covers to cards ===
  let coverImages = [
    'AHM_cover_final_V4_glow_verydark_titled-min.png',
    'budding_coverpng_3_titled-min.png',
    'mowing_the_nucleotides_0_titled-min.png',
    'erasing_the_nucleotides_0_titled-min.png',
    'printer_closeup_cover_titled_0-min.png',
    'walker_cover_titled_0-min.png',
    'hand_thing_pose_cover_5_camraw_grey-min.png',
    'hand_ET_pose_cover_titled_green_0-min.png',
    'cover_V2_color_adj_titled-min.png',
    'Copy of cover_hand_tenticle_black-min.jpg'
  ];
  // Shuffle covers except for the duplicate
  function shuffle(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  let shuffled = shuffle(coverImages);
  // Place 'budding' at the start and halfway point, fill the rest with shuffled covers (no duplicate)
  let cardCovers = new Array(cards.length);
  cardCovers[0] = 'budding_coverpng_3_titled-min.png';
  cardCovers[Math.floor(cards.length / 2)] = 'budding_coverpng_3_titled-min.png';
  // Remove one 'budding' from shuffled
  let shuffledNoBudding = shuffled.filter(name => name !== 'budding_coverpng_3_titled-min.png');
  let idx = 0;
  for (let i = 0; i < cardCovers.length; i++) {
    if (!cardCovers[i]) {
      cardCovers[i] = shuffledNoBudding[idx++];
    }
  }
  cards.forEach((card, idx) => {
    card.innerHTML = '';
    const coverName = cardCovers[idx % cardCovers.length];
    if (coverName) {
      const img = document.createElement('img');
      img.src = `Media/journal_covers/compressed/${coverName}`;
      img.alt = `Journal Cover ${idx+1}`;
      card.appendChild(img);
    }
  });
})();

// (Coding Torque carousel logic removed) 
// (Coding Torque carousel logic removed) 

const colorMaskDiv = document.querySelector('.video-color-mask');
function applyTextMaskToDiv() {
  if (!colorMaskDiv) return;
  // Generate SVG mask for the text
  const text = 'MORITZ\nHOCHER';
  const fontSize = 180;
  const fontFamily = 'Orbitron, sans-serif';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='600'>
    <rect width='100%' height='100%' fill='white'/>
    <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='black' font-family='${fontFamily}' font-size='${fontSize}' font-weight='900' style='letter-spacing:0.08em;'>${text.replace(/\n/g,'<tspan x="50%" dy="1.1em">')}</text>
  </svg>`;
  const svgUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  colorMaskDiv.style.webkitMaskImage = `url('${svgUrl}')`;
  colorMaskDiv.style.maskImage = `url('${svgUrl}')`;
  colorMaskDiv.style.webkitMaskRepeat = 'no-repeat';
  colorMaskDiv.style.maskRepeat = 'no-repeat';
  colorMaskDiv.style.webkitMaskPosition = 'center';
  colorMaskDiv.style.maskPosition = 'center';
  colorMaskDiv.style.webkitMaskSize = 'contain';
  colorMaskDiv.style.maskSize = 'contain';
  // Set the color video as the background using <video> as a background
  // This is not natively supported, so we use an actual <video> element below
}
function syncVideoBackground() {
  if (!colorMaskDiv) return;
  let video = colorMaskDiv.querySelector('video');
  if (!video) {
    video = document.createElement('video');
    video.src = 'Media/videos/bio_reel_adj.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.pointerEvents = 'none';
    colorMaskDiv.appendChild(video);
  }
}
function handleColorMaskFade() {
  if (!colorMaskDiv) return;
  const rect = stage.getBoundingClientRect();
  const scrolled = -rect.top;
  const vh = window.innerHeight;
  let opacity = 1;
  if (scrolled > vh * 0.3) {
    colorMaskDiv.classList.add('hide');
    opacity = 0;
  } else {
    colorMaskDiv.classList.remove('hide');
    opacity = 1 - (scrolled / (vh * 0.3));
    opacity = Math.max(0, Math.min(1, opacity));
  }
  colorMaskDiv.style.opacity = opacity;
}
window.addEventListener('resize', applyTextMaskToDiv);
window.addEventListener('DOMContentLoaded', () => {
  applyTextMaskToDiv();
  syncVideoBackground();
  handleColorMaskFade();
});
window.addEventListener('scroll', handleColorMaskFade);

const colorFadeWrapper = document.querySelector('.color-fade-wrapper');
function handleColorFade() {
  if (!colorFadeWrapper) return;
  const rect = stage.getBoundingClientRect();
  const scrolled = -rect.top;
  const vh = window.innerHeight;
  let opacity = 1;
  if (scrolled > vh * 0.3) {
    opacity = 0;
  } else {
    opacity = 1 - (scrolled / (vh * 0.3));
    opacity = Math.max(0, Math.min(1, opacity));
  }
  colorFadeWrapper.style.opacity = opacity;
}
window.addEventListener('scroll', handleColorFade);
window.addEventListener('DOMContentLoaded', handleColorFade);
handleColorFade();

const testFadeDiv = document.querySelector('.test-fade');
function handleTestFade() {
  if (!testFadeDiv) return;
  const rect = stage.getBoundingClientRect();
  const scrolled = -rect.top;
  const vh = window.innerHeight;
  let opacity = 1;
  if (scrolled > vh * 0.3) {
    opacity = 0;
  } else {
    opacity = 1 - (scrolled / (vh * 0.3));
    opacity = Math.max(0, Math.min(1, opacity));
  }
  console.log('handleTestFade:', { scrolled, vh, opacity });
  testFadeDiv.style.opacity = opacity;
}
window.addEventListener('scroll', handleTestFade);
window.addEventListener('DOMContentLoaded', handleTestFade);
handleTestFade();

document.addEventListener('DOMContentLoaded', function() {
  var maskBtn = document.getElementById('toggle-mask-btn');
  var grayBtn = document.getElementById('toggle-grayscale-btn');
  if (maskBtn) {
    maskBtn.onclick = function() {
      const mask = document.querySelector('.video-text-mask-container');
      if (mask) mask.style.display = (mask.style.display === 'none' ? '' : 'none');
    };
  }
  if (grayBtn) {
    grayBtn.onclick = function() {
      const gray = document.querySelector('.right-video.grayscale');
      if (gray) gray.style.display = (gray.style.display === 'none' ? '' : 'none');
    };
  }
});

function fadeMaskContainerOnScroll() {
  const maskTextContainer = document.querySelector('.video-text-mask-container');
  if (!maskTextContainer) return;
  if (maskTextContainer.classList.contains('hide')) return;
  const stage = document.querySelector('.video-anim-stage');
  const rect = stage.getBoundingClientRect();
  const scrolled = -rect.top;
  const vh = window.innerHeight;
  let opacity = 1;
  if (scrolled > vh * 0.3) {
    opacity = 0;
  } else {
    opacity = 1 - (scrolled / (vh * 0.3));
    opacity = Math.max(0, Math.min(1, opacity));
  }
  maskTextContainer.style.opacity = opacity;
}
window.addEventListener('scroll', fadeMaskContainerOnScroll);
window.addEventListener('DOMContentLoaded', fadeMaskContainerOnScroll);
fadeMaskContainerOnScroll(); 

(function() {
  const canvas = document.getElementById('background-dots-canvas');
  if (canvas) {
    canvas.parentNode.removeChild(canvas);
  }
})(); 

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
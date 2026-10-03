const revolver = document.getElementById('revolver');
const chambers = Array.from(document.querySelectorAll('.chamber'));
const memoryCount = document.getElementById('active-number');
const dots = document.getElementById('carousel-dots');
const previousButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
let index = 0;
const total = chambers.length;

function updateHud() {
  const current = String(index + 1).padStart(2, '0');
  if (memoryCount) memoryCount.textContent = current;
  Array.from(dots.children).forEach((dot, dotIndex) => {
    dot.setAttribute('aria-current', String(dotIndex === index));
  });
}

function positionChambers() {
  const frame = chambers[0]?.querySelector('.frame');
  const frameWidth = frame ? frame.getBoundingClientRect().width : 350;
  const slide = Math.min(frameWidth * 0.84, revolver.clientWidth * 0.38);

  chambers.forEach((ch, i) => {
    const relative = (i - index + total) % total;
    const offset = relative > total / 2 ? relative - total : relative;
    const distance = Math.abs(offset);
    const direction = Math.sign(offset);

    const x = direction * Math.min(distance, 2.6) * slide;
    const z = -distance * 72;
    const scale = 1 - Math.min(distance * 0.13, 0.42);
    const opacity = Math.max(0.12, 0.68 - distance * 0.16);
    const tilt = -direction * Math.min(distance * 5, 12);
    const blur = Math.min(distance * 0.45, 1.6);

    ch.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${tilt}deg) scale(${scale})`;
    ch.style.opacity = String(opacity);
    ch.style.filter = `blur(${blur}px) saturate(${1 - distance * 0.1})`;
    ch.style.zIndex = String(100 - distance);
    ch.setAttribute('aria-hidden', String(offset !== 0));

    if (offset === 0) {
      ch.classList.add('active');
      ch.style.transform = 'translate(-50%, -50%) translate3d(0, 0, 70px) scale(1)';
      ch.style.opacity = '1';
      ch.style.filter = 'none';
      ch.style.zIndex = '200';
    } else {
      ch.classList.remove('active');
    }
  });

  updateHud();
}

chambers.forEach((_, dotIndex) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Show memory ${dotIndex + 1}`);
  dot.addEventListener('click', () => {
    index = dotIndex;
    positionChambers();
  });
  dots.appendChild(dot);
});

positionChambers();

nextButton.addEventListener('click', () => {
  index = (index + 1) % total;
  positionChambers();
});

previousButton.addEventListener('click', () => {
  index = (index - 1 + total) % total;
  positionChambers();
});

let pointerStart = null;
revolver.addEventListener('pointerdown', (event) => {
  pointerStart = event.clientX;
  revolver.setPointerCapture(event.pointerId);
});

revolver.addEventListener('pointerup', (event) => {
  if (pointerStart === null) return;
  const distance = event.clientX - pointerStart;
  pointerStart = null;
  if (distance < -45) nextButton.click();
  if (distance > 45) previousButton.click();
});

revolver.addEventListener('pointercancel', () => {
  pointerStart = null;
});

window.addEventListener('resize', positionChambers);
window.addEventListener('keydown', (event) => {
  if (event.target.closest('a, button')) return;
  if (event.key === 'ArrowRight') nextButton.click();
  if (event.key === 'ArrowLeft') previousButton.click();
});

let pendingArrivalTarget = null;
let scrollIdleTimer = null;
let noScrollTimer = null;
let safetyTimer = null;
let highlightTimer = null;
let arrivalScrollStarted = false;

function showArrivalHighlight() {
  if (!pendingArrivalTarget) return;

  const target = pendingArrivalTarget;
  pendingArrivalTarget = null;
  window.clearTimeout(scrollIdleTimer);
  window.clearTimeout(noScrollTimer);
  window.clearTimeout(safetyTimer);
  window.clearTimeout(highlightTimer);

  target.classList.remove('arrival-highlight');
  void target.offsetWidth;
  target.classList.add('arrival-highlight');
  highlightTimer = window.setTimeout(() => target.classList.remove('arrival-highlight'), 1250);
}

window.addEventListener('scroll', () => {
  if (!pendingArrivalTarget) return;

  arrivalScrollStarted = true;
  window.clearTimeout(noScrollTimer);
  window.clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(showArrivalHighlight, 180);
}, { passive: true });

window.addEventListener('scrollend', showArrivalHighlight);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    pendingArrivalTarget = target;
    arrivalScrollStarted = false;
    window.clearTimeout(scrollIdleTimer);
    window.clearTimeout(noScrollTimer);
    window.clearTimeout(safetyTimer);

    const startX = window.scrollX;
    const startY = window.scrollY;
    noScrollTimer = window.setTimeout(() => {
      if (!arrivalScrollStarted && window.scrollX === startX && window.scrollY === startY) {
        showArrivalHighlight();
      }
    }, 120);
    safetyTimer = window.setTimeout(showArrivalHighlight, 5000);
  });
});

/* Academic reading controls. The encoding and benchmark implementations are shared. */
'use strict';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduceMotion.matches;
const motionButton = document.querySelector('#motion-toggle');
function setMotion(next) {
  motion = next;
  document.body.classList.toggle('motion-paused', !motion);
  motionButton.textContent = motion ? 'Motion on' : 'Motion off';
  motionButton.setAttribute('aria-pressed', String(!motion));
  motionButton.setAttribute('aria-label', motion ? 'Pause demonstration autoplay' : 'Enable demonstration autoplay');
}
motionButton.addEventListener('click', () => setMotion(!motion));
reduceMotion.addEventListener('change', event => setMotion(!event.matches));
setMotion(motion);

const contentsLinks = [...document.querySelectorAll('.contents a')];
const sections = contentsLinks.map(link => document.querySelector(link.hash));
function markSection() {
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) active = section;
  }
  for (const link of contentsLinks) {
    if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { markSection(); scrollPending = false; });
}, {passive: true});
markSection();

const dialog = document.querySelector('#figure-dialog');
dialog.setAttribute('aria-labelledby', 'figure-dialog-title');
for (const link of document.querySelectorAll('[data-figure]')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const source = link.querySelector('img');
    const target = document.querySelector('#figure-dialog-image');
    target.src = link.dataset.figure;
    target.alt = source.alt;
    document.querySelector('#figure-dialog-title').textContent = link.dataset.caption;
    dialog.showModal();
  });
}
document.querySelector('#close-figure').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});

const copyButton = document.querySelector('#copy-citation');
copyButton.addEventListener('click', async () => {
  const citation = document.querySelector('#citation-text');
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(citation.textContent);
      copied = true;
    }
  } catch (_) { /* The visible citation remains available if clipboard access is denied. */ }
  if (!copied) {
    const field = document.createElement('textarea');
    field.value = citation.textContent;
    field.style.cssText = 'position:fixed;opacity:0';
    document.body.append(field); field.select();
    try { copied = document.execCommand('copy'); } catch (_) {}
    field.remove(); copyButton.focus();
  }
  if (copied) {
    copyButton.textContent = 'Copied ✓';
    document.querySelector('#copy-status').textContent = 'BibTeX copied to clipboard.';
    setTimeout(() => { copyButton.innerHTML = 'Copy BibTeX <span aria-hidden="true">⧉</span>'; }, 2200);
  } else {
    const range = document.createRange(); range.selectNodeContents(citation);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.querySelector('#copy-status').textContent = 'Citation selected. Press Control C or Command C to copy.';
    copyButton.textContent = 'Citation selected';
  }
});

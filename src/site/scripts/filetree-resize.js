(() => {
  const panel = document.querySelector(".filetree-wrapper");
  const handle = panel?.querySelector(".filetree-resize-handle");
  if (!handle) return;

  const storageKey = "dg-filetree-width";
  const defaultWidth = parseFloat(getComputedStyle(panel).getPropertyValue("--dg-filetree-width")) || 250;
  let preferredWidth = defaultWidth;
  let width;
  let drag = null;

  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0) preferredWidth = saved;
  } catch {
    // Resizing still works if browser storage is unavailable.
  }

  function bounds() {
    const max = Math.max(0, Math.floor(window.innerWidth / 5));
    return { min: Math.min(200, max), max };
  }

  function applyWidth(requested) {
    const { min, max } = bounds();
    width = Math.round(Math.max(min, Math.min(max, requested)));
    // Scope the width to the drawer so the centered article does not shift.
    panel.style.setProperty("--dg-filetree-width", `${width}px`);
    handle.setAttribute("aria-valuemin", String(min));
    handle.setAttribute("aria-valuemax", String(max));
    handle.setAttribute("aria-valuenow", String(width));
    handle.setAttribute("aria-valuetext", `${width} 像素`);
  }

  function rememberWidth() {
    preferredWidth = width;
    try { localStorage.setItem(storageKey, String(width)); } catch {}
  }

  function endDrag(event) {
    if (!drag || (event?.pointerId != null && event.pointerId !== drag.id)) return;
    const id = drag.id;
    drag = null;
    document.documentElement.classList.remove("is-resizing-filetree");
    if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
    rememberWidth();
  }

  handle.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX, width };
    handle.setPointerCapture(event.pointerId);
    document.documentElement.classList.add("is-resizing-filetree");
  });

  handle.addEventListener("pointermove", (event) => {
    if (drag && event.pointerId === drag.id) applyWidth(drag.width + event.clientX - drag.x);
  });
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("lostpointercapture", endDrag);
  window.addEventListener("blur", () => endDrag());

  handle.addEventListener("keydown", (event) => {
    const { min, max } = bounds();
    const step = event.shiftKey ? 40 : 10;
    const next = { ArrowLeft: width - step, ArrowRight: width + step, Home: min, End: max }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    applyWidth(next);
    rememberWidth();
  });

  handle.addEventListener("dblclick", () => {
    applyWidth(defaultWidth);
    rememberWidth();
  });
  window.addEventListener("resize", () => applyWidth(preferredWidth));
  applyWidth(preferredWidth);
})();

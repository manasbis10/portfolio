const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

// Content stays visible even when animation APIs or JavaScript are unavailable.
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeReveals = new Set();
let revealObserver;

function stopReveals() {
  revealObserver?.disconnect();
  activeReveals.forEach((animation) => animation.cancel());
  activeReveals.clear();
}

if (
  !motionPreference.matches &&
  "IntersectionObserver" in window &&
  typeof Element.prototype.animate === "function"
) {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      if (motionPreference.matches) return;

      const animation = entry.target.animate(
        [
          { opacity: 0, translate: "0 16px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      activeReveals.add(animation);
      animation.onfinish = () => activeReveals.delete(animation);
      animation.oncancel = () => activeReveals.delete(animation);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".job, .award").forEach((entry) => {
    revealObserver.observe(entry);
  });
}

motionPreference.addEventListener("change", (event) => {
  if (event.matches) stopReveals();
});

const permissionOptions = {
  viewer: {
    label: "Project viewer",
    resources: { docs: "Read" },
    summary: "Project viewer reaches 1 of 4 resources: read project documents. No code, deployment, or membership access.",
  },
  editor: {
    label: "Project editor",
    resources: { docs: "Edit", code: "Push code" },
    summary: "Project editor reaches 2 of 4 resources: edit project documents and push source code. No deployment or membership access.",
  },
  admin: {
    label: "Workspace admin",
    resources: { docs: "Manage", code: "Manage", deploy: "Change settings", members: "Manage roles" },
    summary: "Workspace admin reaches all 4 resources, including deployment settings and member roles. Review whether this broader access is necessary.",
  },
};

const permissionSelect = document.getElementById("permission");
if (permissionSelect) {
  document.getElementById("demo-controls").hidden = false;
  permissionSelect.addEventListener("change", () => {
    const selected = permissionOptions[permissionSelect.value];
    document.getElementById("graph-role").textContent = selected.label;
    document.querySelectorAll("[data-resource]").forEach((node) => {
      const action = selected.resources[node.dataset.resource];
      node.classList.toggle("reachable", Boolean(action));
      node.querySelector("span").textContent = action || "No access";
    });
    document.getElementById("access-summary").textContent = selected.summary;
  });
}

// Use the section nearest the sticky header, including short final sections.
const siteHeader = document.querySelector(".nav");
const sectionLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const linkedSections = sectionLinks.map((link) => document.querySelector(link.getAttribute("href")));
let navigationFramePending = false;

function updateNavigation() {
  navigationFramePending = false;
  const offset = siteHeader.getBoundingClientRect().height + 48;
  document.documentElement.style.setProperty("--header-offset", offset + "px");
  let current = -1;
  linkedSections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= offset) current = index;
  });
  if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    current = sectionLinks.length - 1;
  }
  sectionLinks.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function scheduleNavigationUpdate() {
  if (navigationFramePending) return;
  navigationFramePending = true;
  window.requestAnimationFrame(updateNavigation);
}
window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("load", scheduleNavigationUpdate);
if ("ResizeObserver" in window) {
  new ResizeObserver(scheduleNavigationUpdate).observe(siteHeader);
}
updateNavigation();

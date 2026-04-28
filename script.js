// script.js — full fixed & improved version
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------
  // Project State
  // ----------------------------------------
  let projects = [
    { id: 1, name: "Project Alpha", description: "This is the first project.", start_date: "2025-01-15", priority: "High", status: "In Progress" },
    { id: 2, name: "Project Beta", description: "This is the second project.", start_date: "2025-02-20", priority: "Medium", status: "Not Started" },
    { id: 3, name: "Project Gamma", description: "This is the third project.", start_date: "2025-03-10", priority: "Low", status: "Completed" },
    { id: 4, name: "Project Delta", description: "This is the fourth project.", start_date: "2025-04-05", priority: "High", status: "On Hold" }
  ];

  // ----------------------------------------
  // DOM References (defensive)
  // ----------------------------------------
  const dom = {
    navButtons: document.querySelectorAll(".nav-button"),
    sections: document.querySelectorAll(".page-section"),
    addProjectForm: document.getElementById("add-project-form"),

    dashboardProjectList: document.getElementById("dashboard-project-list"),
    allProjectList: document.getElementById("all-project-list"),

    listSortBy: document.getElementById("list-sort-by"),
    listSortOrder: document.getElementById("list-sort-order"),
    listSearchInput: document.getElementById("list-search-input"),

    treeSortOrderCheckbox: document.getElementById("tree-sort-order"),
    treeSortLabel: document.getElementById("tree-sort-label"),
    refreshTreeBtn: document.getElementById("refresh-tree"),
    refreshListBtn: document.getElementById("refresh-list"),

    searchTreeInput: document.getElementById("search-tree-input"),
    avlTreeDisplay: document.getElementById("avl-tree-display"),

    totalProjects: document.getElementById("total-projects"),
    completedProjects: document.getElementById("completed-projects"),
    pendingProjects: document.getElementById("pending-projects"),

    profileIcon: document.querySelector(".profile-icon"),
    profilePopup: document.querySelector(".profile-popup"),
    profileButtons: document.querySelectorAll(".profile-btn"),
  };

  // ----------------------------------------
  // Helpers
  // ----------------------------------------
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, delay = 300) {
    let tid;
    return function (...args) {
      clearTimeout(tid);
      tid = setTimeout(() => fn(...args), delay);
    };
  }

  // ----------------------------------------
  // Navigation (safe)
  // ----------------------------------------
  if (dom.navButtons && dom.navButtons.length) {
    dom.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        dom.navButtons.forEach((b) => {
          b.classList.remove("active");
          b.removeAttribute("aria-current");
        });
        button.classList.add("active");
        button.setAttribute("aria-current", "page");

        dom.sections.forEach((s) => s.classList.remove("active"));
        const targetId = button.dataset.target;
        if (targetId) {
          const targetEl = document.getElementById(targetId);
          if (targetEl) targetEl.classList.add("active");
        }

        if (button.dataset.target === "dashboard") {
          updateDashboardSummaries();
          displayDashboard();
        } else if (button.dataset.target === "sorted-list") {
          displayAllProjects();
        } else if (button.dataset.target === "view-tree") {
          buildAndRenderAVLTree(); // default uses current projects list order
        }
      });
    });
  }

  // ----------------------------------------
  // Dashboard Rendering
  // ----------------------------------------
  function updateDashboardSummaries() {
    const total = projects.length;
    const completed = projects.filter(p => p.status === "Completed").length;
    const pending = total - completed;

    if (dom.totalProjects) dom.totalProjects.textContent = total;
    if (dom.completedProjects) dom.completedProjects.textContent = completed;
    if (dom.pendingProjects) dom.pendingProjects.textContent = pending;
  }

  function displayDashboard() {
    if (!dom.dashboardProjectList) return;
    dom.dashboardProjectList.innerHTML = "";

    const fragment = document.createDocumentFragment();
    projects.slice(0, 5).forEach((project, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = createProjectRow(project, false, i + 1);
      fragment.appendChild(tr);
    });

    dom.dashboardProjectList.appendChild(fragment);
  }

  // ----------------------------------------
  // Full Project List
  // ----------------------------------------
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };

  function displayAllProjects() {
    if (!dom.allProjectList) return;
    dom.allProjectList.innerHTML = "";

    const sortBy = dom.listSortBy?.value || "start_date";
    const sortAsc = !!dom.listSortOrder?.checked;
    const term = (dom.listSearchInput?.value || "").toLowerCase().trim();

    let filtered = projects.filter(p => {
      if (!term) return true;
      const nameMatch = (p.name || "").toLowerCase().includes(term);
      const descMatch = (p.description || "").toLowerCase().includes(term);
      return nameMatch || descMatch;
    });

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === "priority") {
        valA = priorityOrder[a.priority] || 0;
        valB = priorityOrder[b.priority] || 0;
      } else if (sortBy === "start_date") {
        valA = new Date(a.start_date || 0).getTime();
        valB = new Date(b.start_date || 0).getTime();
      } else {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      }

      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortAsc ? valA - valB : valB - valA;
      }
    });

    // assign temporary serial numbers based on filtered order
    filtered.forEach((p, idx) => {
      p._serial = idx + 1;
    });

    const fragment = document.createDocumentFragment();
    filtered.forEach((project, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = createProjectRow(project, true, i + 1);
      fragment.appendChild(tr);
    });

    dom.allProjectList.appendChild(fragment);
  }

  // ----------------------------------------
  // Row Template with Serial Number
  // ----------------------------------------
  function createProjectRow(project, includeDescription = true, index = 1) {
    return `
      <td>${index}</td>
      <td>${escapeHtml(project.name)}</td>
      ${includeDescription ? `<td>${escapeHtml(project.description)}</td>` : ""}
      <td>${escapeHtml(project.start_date)}</td>
      <td>${escapeHtml(project.priority)}</td>
      <td>
        <select class="status-dropdown" data-id="${project.id}">
          ${getStatusOptions(project.status)}
        </select>
      </td>
      <td>
        <button class="btn danger delete-btn" data-id="${project.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
  }

  function getStatusOptions(current) {
    return ["Not Started", "In Progress", "Completed", "On Hold"]
      .map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${s}</option>`)
      .join("");
  }

  // ----------------------------------------
  // Delete + Status Update (delegated)
  // ----------------------------------------
  document.addEventListener("click", e => {
    const btn = e.target.closest && e.target.closest(".delete-btn");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (!Number.isFinite(id)) return;
    if (!confirm("Delete this project?")) return;
    projects = projects.filter(p => p.id !== id);

    // After delete, recalc serials and refresh views
    updateDashboardSummaries();
    displayDashboard();
    displayAllProjects();
    buildAndRenderAVLTree();
  });

  document.addEventListener("change", e => {
    const dropdown = e.target.closest && e.target.closest(".status-dropdown");
    if (!dropdown) return;
    const id = Number(dropdown.dataset.id);
    if (!Number.isFinite(id)) return;
    const status = dropdown.value;
    const project = projects.find(p => p.id === id);
    if (project) project.status = status;

    updateDashboardSummaries();
    displayDashboard();
    displayAllProjects();
  });

  // ----------------------------------------
  // Add Project (if form exists)
  // ----------------------------------------
  if (dom.addProjectForm) {
    dom.addProjectForm.addEventListener("submit", e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(dom.addProjectForm).entries());

      // Normalize fields
      data.id = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
      data.priority = data.priority || "Medium";
      data.status = data.status || "Not Started";
      data.description = data.description || "";

      projects.push(data);

      updateDashboardSummaries();
      displayDashboard();
      displayAllProjects();
      buildAndRenderAVLTree();

      dom.addProjectForm.reset();
      alert("Project added!");
    });
  }

  // ----------------------------------------
  // AVL TREE (with serials matching current list order)
  // ----------------------------------------
  class AVLNode {
    constructor(project) {
      this.project = project;
      this.left = null;
      this.right = null;
      this.height = 1;
    }
  }

  class AVLTree {
    constructor(sortBy = "start_date") {
      this.root = null;
      this.sortBy = sortBy;
    }

    value(project) {
      if (!project) return 0;
      if (this.sortBy === "priority") return priorityOrder[project.priority] || 0;
      return new Date(project.start_date || 0).getTime();
    }

    height(n) { return n ? n.height : 0; }
    balance(n) { return this.height(n.left) - this.height(n.right); }

    rotateLeft(x) {
      const y = x.right;
      x.right = y.left;
      y.left = x;
      x.height = 1 + Math.max(this.height(x.left), this.height(x.right));
      y.height = 1 + Math.max(this.height(y.left), this.height(y.right));
      return y;
    }

    rotateRight(y) {
      const x = y.left;
      y.left = x.right;
      x.right = y;
      y.height = 1 + Math.max(this.height(y.left), this.height(y.right));
      x.height = 1 + Math.max(this.height(x.left), this.height(x.right));
      return x;
    }

    insert(node, project) {
      if (!node) return new AVLNode(project);

      if (this.value(project) < this.value(node.project)) {
        node.left = this.insert(node.left, project);
      } else if (this.value(project) > this.value(node.project)) {
        node.right = this.insert(node.right, project);
      } else {
        // tie-break by name to keep deterministic structure
        const a = (project.name || "").toLowerCase();
        const b = (node.project.name || "").toLowerCase();
        if (a < b) node.left = this.insert(node.left, project);
        else node.right = this.insert(node.right, project);
      }

      node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
      const bal = this.balance(node);

      // LL
      if (bal > 1 && this.value(project) < this.value(node.left.project)) return this.rotateRight(node);
      // RR
      if (bal < -1 && this.value(project) > this.value(node.right.project)) return this.rotateLeft(node);
      // LR
      if (bal > 1 && this.value(project) > this.value(node.left.project)) {
        node.left = this.rotateLeft(node.left);
        return this.rotateRight(node);
      }
      // RL
      if (bal < -1 && this.value(project) < this.value(node.right.project)) {
        node.right = this.rotateRight(node.right);
        return this.rotateLeft(node);
      }

      return node;
    }

    add(project) {
      this.root = this.insert(this.root, project);
    }

    // produce nodes & links for rendering; node.project._serial is used when present
    visualize() {
      const nodes = [];
      const links = [];

      function walk(node, x, y, spread) {
        if (!node) return;
        // use project serial if set (from current displayed list), otherwise fallback to nodes.length + 1
        const serial = node.project && node.project._serial ? node.project._serial : nodes.length + 1;
        const id = nodes.length;
        nodes.push({
          id,
          serial,
          name: node.project?.name || "(unnamed)",
          x, y
        });

        if (node.left) {
          const nx = x - spread;
          const ny = y + 70;
          links.push({ x1: x, y1: y, x2: nx, y2: ny });
          walk(node.left, nx, ny, spread / 1.8);
        }
        if (node.right) {
          const nx = x + spread;
          const ny = y + 70;
          links.push({ x1: x, y1: y, x2: nx, y2: ny });
          walk(node.right, nx, ny, spread / 1.8);
        }
      }

      walk(this.root, 400, 50, 200);
      return { nodes, links };
    }
  }

  /**
   * buildAndRenderAVLTree(optionalFilteredList)
   * If optionalFilteredList is provided, it will be used (and serials assigned
   * according to that list order). Otherwise the current `projects` array is used.
   */
  function buildAndRenderAVLTree(optionalList) {
    const listForTree = Array.isArray(optionalList) ? optionalList : projects.slice();

    // Assign serial numbers according to current list order so they match table S.No
    listForTree.forEach((p, idx) => {
      p._serial = idx + 1;
    });

    // Update the label to show Ascending/Descending (user-facing)
    if (dom.treeSortLabel) {
      dom.treeSortLabel.textContent = dom.treeSortOrderCheckbox && dom.treeSortOrderCheckbox.checked ? "Descending" : "Ascending";
    }

    const sortBy = dom.treeSortOrderCheckbox && dom.treeSortOrderCheckbox.checked ? "priority" : "start_date";

    const tree = new AVLTree(sortBy);
    // add projects in the order of listForTree (so _serial matches)
    listForTree.forEach(p => tree.add(p));

    const viz = tree.visualize();
    renderTree(viz);
  }

  // ----------------------------------------
  // renderTree: draws circles with S.No inside and name below
  // ----------------------------------------
  function renderTree(data) {
    if (!dom.avlTreeDisplay) return;
    dom.avlTreeDisplay.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "520");

    // lines
    data.links.forEach(l => {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", l.x1);
      line.setAttribute("y1", l.y1 + 10); // slightly lower to align
      line.setAttribute("x2", l.x2);
      line.setAttribute("y2", l.y2 - 10);
      line.setAttribute("stroke", "#ccc");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    });

    // nodes
    data.nodes.forEach(n => {
      const g = document.createElementNS(svgNS, "g");
      g.setAttribute("transform", `translate(${n.x},${n.y})`);

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("r", "22");
      circle.setAttribute("fill", "#27ae60");
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "2");

      // Serial number inside circle
      const snText = document.createElementNS(svgNS, "text");
      snText.setAttribute("dy", ".35em");
      snText.setAttribute("text-anchor", "middle");
      snText.setAttribute("fill", "#fff");
      snText.setAttribute("font-weight", "700");
      snText.textContent = n.serial;

      // Project name below circle
      const nameText = document.createElementNS(svgNS, "text");
      nameText.setAttribute("y", "36"); // below the circle
      nameText.setAttribute("text-anchor", "middle");
      nameText.setAttribute("fill", "#000");
      nameText.setAttribute("font-size", "12px");
      // truncate long names to avoid overflow, but still show some text
      const safeName = String(n.name || "").length > 20 ? String(n.name).substring(0, 18) + "…" : String(n.name);
      nameText.textContent = safeName;

      g.appendChild(circle);
      g.appendChild(snText);
      g.appendChild(nameText);

      svg.appendChild(g);
    });

    dom.avlTreeDisplay.appendChild(svg);
  }

  // ----------------------------------------
  // Controls: wire up (safe guards)
  // ----------------------------------------
  if (dom.treeSortOrderCheckbox) dom.treeSortOrderCheckbox.addEventListener("change", () => buildAndRenderAVLTree());
  if (dom.refreshTreeBtn) dom.refreshTreeBtn.addEventListener("click", () => buildAndRenderAVLTree());
  if (dom.refreshListBtn) dom.refreshListBtn.addEventListener("click", () => displayAllProjects());

  if (dom.listSortBy) dom.listSortBy.addEventListener("change", () => displayAllProjects());
  if (dom.listSortOrder) dom.listSortOrder.addEventListener("change", () => displayAllProjects());
  if (dom.listSearchInput) dom.listSearchInput.addEventListener("input", debounce(() => displayAllProjects(), 200));

  // Search inside tree area (if search button exists within view-tree section)
  const viewTreeSection = document.getElementById("view-tree");
  if (viewTreeSection) {
    // try to find a search button (best-effort)
    const buttons = Array.from(viewTreeSection.querySelectorAll("button"));
    const searchBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("search")) || null;
    if (searchBtn && dom.searchTreeInput) {
      searchBtn.addEventListener("click", () => {
        const term = (dom.searchTreeInput.value || "").toLowerCase().trim();
        if (!term) {
          buildAndRenderAVLTree();
          return;
        }
        const filtered = projects.filter(p => (p.name || "").toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term));
        buildAndRenderAVLTree(filtered);
      });
    }
  }

  // ----------------------------------------
  // Profile Popup (safe)
  // ----------------------------------------
  if (dom.profileIcon && dom.profilePopup) {
    dom.profileIcon.addEventListener("click", e => {
      e.stopPropagation();
      dom.profilePopup.classList.toggle("hidden");
    });

    document.addEventListener("click", e => {
      if (!dom.profilePopup.contains(e.target) && !dom.profileIcon.contains(e.target)) {
        dom.profilePopup.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (dom.profilePopup) dom.profilePopup.classList.add("hidden");
        if (dom.profileIcon) dom.profileIcon.focus();
      }
    });

    dom.profileButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const action = (btn.textContent || "").trim();
        if (action === "Logout") {
          if (confirm("Are you sure you want to logout?")) {
            alert("Logging out...");
          }
        } else if (action === "Profile") {
          alert("Opening profile page...");
        } else if (action === "Settings") {
          alert("Opening settings...");
        }
        dom.profilePopup.classList.add("hidden");
      });
    });
  }

  // ----------------------------------------
  // Initialize page
  // ----------------------------------------
  function init() {
    updateDashboardSummaries();
    displayDashboard();
    displayAllProjects();
    buildAndRenderAVLTree();
  }

  init();
});

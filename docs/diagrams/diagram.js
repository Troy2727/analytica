// Shared builder for the README diagrams. Each function draws one diagram into a composition root
// and returns its GSAP timeline: boxes appear first, then each arrow draws with a glowing dot
// leading it, each label glows in as its arrow lands, and notes/captions come in last.
window.AnalyticaDiagram =
  window.AnalyticaDiagram ||
  (function () {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const EMERALD = "#34d399";
    const BLUE = "#60a5fa";
    const GLOW_ON = "drop-shadow(0 0 10px rgba(52, 211, 153, 0.95))";
    const GLOW_OFF = "drop-shadow(0 0 0px rgba(52, 211, 153, 0))";
    let diagramCount = 0;

    function el(tag, attrs, parent, text) {
      const node = document.createElementNS(SVG_NS, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      if (text) node.textContent = text;
      parent.appendChild(node);
      return node;
    }

    function html(parent, className, style, inner) {
      const div = document.createElement("div");
      div.className = className;
      Object.assign(div.style, style);
      div.innerHTML = inner;
      parent.appendChild(div);
      return div;
    }

    const LOGO = `<svg viewBox="0 0 200 200"><defs><linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>
      <rect x="8" y="8" width="184" height="184" rx="46" fill="#0b1426" stroke="url(#brand)" stroke-width="8"/>
      <path d="M58 150 L100 52 L142 150" fill="none" stroke="url(#brand)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="118" r="12" fill="url(#brand)"/></svg>`;

    /** Background, logo + title, optional caption, footer, and the SVG layer wires are drawn on. */
    function frame(root, title, caption) {
      // Not the root's DOM id: index.html inlines the compositions and their roots lose it,
      // but SVG mask/marker ids must stay unique across all three diagrams.
      const id = `diagram${++diagramCount}`;
      root.classList.add("scene");
      const header = html(root, "header", {}, `${LOGO}<h1>${title}</h1>`);
      const footer = html(root, "footer", {}, "analytica-phi.vercel.app");
      const svg = el("svg", { class: "wires", viewBox: "0 0 1600 1150" }, root);
      const defs = el("defs", {}, svg);
      const marker = el(
        "marker",
        { id: `${id}-head`, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "9", markerHeight: "9", orient: "auto-start-reverse" },
        defs
      );
      el("path", { d: "M0 0 L10 5 L0 10 z", fill: EMERALD }, marker);
      const glow = el("filter", { id: `${id}-glow`, x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
      el("feGaussianBlur", { stdDeviation: "5", result: "blur" }, glow);
      const merge = el("feMerge", {}, glow);
      el("feMergeNode", { in: "blur" }, merge);
      el("feMergeNode", { in: "SourceGraphic" }, merge);
      // Caption is created last so it sits above the wires.
      const cap = caption ? html(root, "caption", {}, caption) : null;
      const tl = gsap.timeline({ paused: true });
      tl.fromTo([header, footer], { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);
      return { id, root, svg, defs, cap, tl, wires: 0 };
    }

    /**
     * A wire that draws from its start to its end, revealed through a mask so dashed wires and
     * arrowheads draw the same way as solid ones, with a glowing dot riding the tip.
     */
    function wire(f, d, { color = EMERALD, dashed = false, arrow = true, ends = false }, at, duration) {
      const n = f.wires++;
      const mask = el("mask", { id: `${f.id}-m${n}`, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1600, height: 1150 }, f.defs);
      const reveal = el("path", { d, fill: "none", stroke: "#fff", "stroke-width": 34 }, mask);
      const len = reveal.getTotalLength();
      reveal.setAttribute("stroke-dasharray", `${len} ${len}`);
      el("path", {
        d, fill: "none", stroke: color, "stroke-width": 2.5, mask: `url(#${f.id}-m${n})`,
        ...(dashed ? { "stroke-dasharray": "8 7" } : {}),
        ...(arrow ? { "marker-end": `url(#${f.id}-head)` } : {}),
      }, f.svg);
      const start = reveal.getPointAtLength(0);
      const finish = reveal.getPointAtLength(len);
      const startDot = el("circle", { cx: start.x, cy: start.y, r: 5, fill: color }, f.svg);
      const endDot = ends ? el("circle", { cx: finish.x, cy: finish.y, r: 5, fill: color }, f.svg) : null;
      const halo = el("circle", { r: 15, fill: color, opacity: 0, filter: `url(#${f.id}-glow)` }, f.svg);
      const dot = el("circle", { r: 6, fill: "#d1fae5", opacity: 0, filter: `url(#${f.id}-glow)` }, f.svg);
      const ride = { p: 0 };
      const place = () => {
        const pt = reveal.getPointAtLength(ride.p * len);
        for (const c of [dot, halo]) {
          c.setAttribute("cx", pt.x);
          c.setAttribute("cy", pt.y);
        }
      };
      place();

      f.tl.fromTo(startDot, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.2 }, at);
      f.tl.fromTo(reveal, { attr: { "stroke-dashoffset": len } }, { attr: { "stroke-dashoffset": 0 }, duration, ease: "power1.inOut" }, at);
      f.tl.fromTo(ride, { p: 0 }, { p: 1, duration, ease: "power1.inOut", onUpdate: place }, at);
      f.tl.fromTo([dot, halo], { attr: { opacity: 0 } }, { attr: { opacity: (i) => (i ? 0.35 : 1) }, duration: 0.15 }, at);
      f.tl.to([dot, halo], { attr: { opacity: 0 }, duration: 0.3 }, at + duration);
      if (endDot) f.tl.fromTo(endDot, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.2 }, at + duration - 0.05);
    }

    /** Fade an element in with a glow that settles. */
    function glowIn(f, targets, at) {
      f.tl.fromTo(targets, { opacity: 0, y: 6, filter: GLOW_ON }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at);
      f.tl.to(targets, { filter: GLOW_OFF, duration: 0.7, ease: "power1.out" }, at + 0.35);
    }

    /** Pad the timeline to the composition's data-duration so the last frame holds. */
    function finish(f) {
      const total = Number(f.root.dataset.duration);
      f.tl.to({}, { duration: Math.max(0, total - f.tl.duration()) });
      return f.tl;
    }

    /** Sequence diagram: lane boxes on top, dashed lifelines, labelled arrows between lanes. */
    function sequence(root, title, { lanes, steps, groups = [], notes = [], end }) {
      const f = frame(root, title);
      const tl = f.tl;
      const LANE_TOP = 180, LANE_BOTTOM = 272;

      const groupEls = groups.map((g) => {
        const rect = el("rect", {
          x: g.x1, y: g.y1, width: g.x2 - g.x1, height: g.y2 - g.y1, rx: 16,
          fill: "rgba(59,130,246,0.05)", stroke: "#3b82f6", "stroke-opacity": 0.55,
          "stroke-dasharray": "7 7", "stroke-width": 1.5,
        }, f.svg);
        const label = html(root, "group-label", { left: `${g.x1 + 14}px`, top: `${g.y1 + 10}px` }, g.label);
        return { ...g, rect, label };
      });

      const nodes = lanes.map((lane) =>
        html(root, "node", { left: `${lane.x - 145}px`, top: `${LANE_TOP}px` },
          `<div class="title">${lane.title}</div><div class="sub">${lane.sub}</div>`)
      );
      const lifelines = lanes.map((lane) =>
        el("line", { x1: lane.x, y1: LANE_BOTTOM, x2: lane.x, y2: end, stroke: "#22306e", "stroke-width": 2, "stroke-dasharray": "4 7" }, f.svg)
      );

      tl.fromTo(nodes, { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15, ease: "power2.out" }, 0.4);
      tl.fromTo(lifelines, { attr: { y2: LANE_BOTTOM } }, { attr: { y2: end }, duration: 0.8, ease: "power1.inOut" }, 1.1);

      let t = 2.0;
      steps.forEach((s, i) => {
        for (const g of groupEls) {
          if (g.step === i) tl.fromTo([g.rect, g.label], { opacity: 0 }, { opacity: 1, duration: 0.4 }, t - 0.2);
        }
        const x1 = lanes[s.from].x, x2 = lanes[s.to].x, dir = Math.sign(x2 - x1);
        const duration = Math.min(1.1, 0.55 * (Math.abs(x2 - x1) / 400));
        wire(f, `M${x1 + dir * 6} ${s.y} L${x2 - dir * 4} ${s.y}`, { dashed: s.dashed }, t, duration);
        const mid = (x1 + x2) / 2;
        const labels = [
          el("text", { x: mid, y: s.y - 14, "text-anchor": "middle", fill: "#a9c9ff", "font-family": "JetBrains Mono", "font-size": 20 }, f.svg, s.label),
        ];
        if (s.sub) {
          labels.push(el("text", { x: mid, y: s.y + 29, "text-anchor": "middle", fill: "#8696bf", "font-family": "JetBrains Mono", "font-size": 16 }, f.svg, s.sub));
        }
        glowIn(f, labels, t + duration * 0.6);
        t += duration + 0.35;
      });

      const noteEls = notes.map((n) => html(root, "note", { left: `${n.x}px`, top: `${n.y}px` }, n.text));
      noteEls.forEach((note, i) => glowIn(f, note, t + 0.2 + i * 0.3));
      return finish(f);
    }

    /** Data model: tables at fixed coordinates so wires are placed without measuring. */
    function dataModel(root, title, caption, tables, links) {
      const f = frame(root, title, caption);
      const NAME_H = 54, ROW_H = 40;
      const cards = Object.entries(tables).map(([name, t]) => {
        const rows = t.rows
          .map(([col, type, badge, kind]) =>
            `<div class="row ${kind || ""}">${col}${badge ? ` <span class="badge">${badge}</span>` : ""}<span class="type">${type}</span></div>`)
          .join("");
        return html(root, "table", { left: `${t.x}px`, top: `${t.y}px`, width: `${t.w}px` }, `<div class="name">${name}</div>${rows}`);
      });
      f.tl.fromTo(cards, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 0.4);

      const rowY = (t, i) => t.y + NAME_H + i * ROW_H + ROW_H / 2 + 1;
      let t = 0.4 + cards.length * 0.18 + 0.6;
      for (const link of links) {
        const a = tables[link.from], b = tables[link.to];
        const x1 = a.x + a.w, y1 = rowY(a, link.fromRow), x2 = b.x, y2 = rowY(b, link.toRow);
        const c = (x2 - x1) / 2;
        wire(f, `M${x1} ${y1} C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`, { color: link.color, arrow: false, ends: true }, t, 0.8);
        if (link.label) {
          const label = el("text", { x: (x1 + x2) / 2, y: Math.min(y1, y2) - 26, "text-anchor": "middle", fill: "#a9c9ff", "font-family": "JetBrains Mono", "font-size": 18 }, f.svg, link.label);
          glowIn(f, label, t + 0.5);
        }
        t += 0.8 + 0.3;
      }
      if (f.cap) glowIn(f, f.cap, t + 0.2);
      return finish(f);
    }

    /** Boxes and arrows at fixed positions, with an optional dashed group around some of them. */
    function boxes(root, title, { groups = [], nodes, links }) {
      const f = frame(root, title);
      const groupEls = groups.map((g) => {
        const rect = el("rect", {
          x: g.x1, y: g.y1, width: g.x2 - g.x1, height: g.y2 - g.y1, rx: 24,
          fill: "none", stroke: EMERALD, "stroke-opacity": 0.45, "stroke-dasharray": "9 8", "stroke-width": 1.5,
        }, f.svg);
        const label = html(root, "group-label", { left: `${g.x1 + 22}px`, top: `${g.y1 + 20}px`, fontSize: "18px", background: "none" }, g.label);
        return [rect, label];
      });
      const nodeEls = nodes.map((n) =>
        html(root, "node", { left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px`, gap: "10px" },
          `<div class="title" style="font-size:29px">${n.title}</div><div class="sub" style="font-size:19px">${n.sub}</div>`)
      );
      f.tl.fromTo(groupEls.flat(), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.4);
      f.tl.fromTo(nodeEls, { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 0.6);

      let t = 0.6 + nodes.length * 0.18 + 0.6;
      for (const link of links) {
        wire(f, link.d, {}, t, 0.6);
        const label = el("text", { x: link.lx, y: link.ly, "text-anchor": link.anchor || "middle", fill: "#a9c9ff", "font-family": "JetBrains Mono", "font-size": 19 }, f.svg, link.label);
        glowIn(f, label, t + 0.35);
        t += 0.6 + 0.35;
      }
      return finish(f);
    }

    return { sequence, dataModel, boxes, BLUE, EMERALD };
  })();

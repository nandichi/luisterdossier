(function () {
  "use strict";
  var D = window.DOSSIER;
  if (!D) return;
  document.documentElement.classList.add("js");

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = new Intl.NumberFormat("nl-NL");

  /* ---------- loader ---------- */
  var loader = $(".loader");
  var loaderNum = $(".loader-num");
  var started = performance.now();
  (function tickLoader(t) {
    var p = Math.min(1, (t - started) / 1300);
    var v = Math.round(57533 * (1 - Math.pow(1 - p, 3)));
    if (loaderNum) loaderNum.textContent = nf.format(v);
    if (p < 1) requestAnimationFrame(tickLoader);
    else {
      setTimeout(function () {
        if (!loader) return;
        loader.style.transition = "transform .9s cubic-bezier(.76,0,.24,1)";
        loader.style.transform = "translateY(-100%)";
        setTimeout(function () { loader.remove(); }, 950);
        document.body.classList.add("ready");
      }, 220);
    }
  })(started);

  /* ---------- helpers ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pct(v, max) { return Math.max(1.5, (v / max) * 100); }

  /* ---------- clock ---------- */
  var clock = $("#clock");
  if (clock) {
    var NS = "http://www.w3.org/2000/svg";
    var cx = 260, cy = 260, r0 = 112, maxLen = 118;
    var maxH = Math.max.apply(null, D.hour);
    var g = document.createElementNS(NS, "g");
    clock.appendChild(g);

    [112, 172, 232].forEach(function (r) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "rgba(222,215,196,.10)");
      c.setAttribute("stroke-width", "1");
      g.appendChild(c);
    });

    D.hour.forEach(function (v, h) {
      var a = ((h - 12) / 24) * Math.PI * 2 - Math.PI / 2;
      var len = 8 + (v / maxH) * maxLen;
      var x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0;
      var x2 = cx + Math.cos(a) * (r0 + len), y2 = cy + Math.sin(a) * (r0 + len);
      var line = document.createElementNS(NS, "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", h === 12 ? "#FF4A17" : "rgba(222,215,196,.62)");
      line.setAttribute("stroke-width", h === 12 ? 7 : 5);
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("opacity", h === 12 ? 1 : 0.35 + (v / maxH) * 0.65);
      line.style.transformOrigin = cx + "px " + cy + "px";
      line.style.transform = "scale(.01)";
      line.style.transition = "transform .9s cubic-bezier(.22,1,.36,1) " + (h * 0.022) + "s";
      line.dataset.h = h;
      g.appendChild(line);

      if (h % 3 === 0) {
        var tx = cx + Math.cos(a) * 252, ty = cy + Math.sin(a) * 252;
        var t = document.createElementNS(NS, "text");
        t.setAttribute("x", tx); t.setAttribute("y", ty + 3);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("fill", h === 12 ? "#FF4A17" : "rgba(222,215,196,.62)");
        t.setAttribute("font-family", "IBM Plex Mono, monospace");
        t.setAttribute("font-size", "10");
        t.setAttribute("letter-spacing", "1");
        t.textContent = (h < 10 ? "0" : "") + h;
        g.appendChild(t);
      }
    });

    var clockObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          $$("line", clock).forEach(function (l) { l.style.transform = "scale(1)"; });
          clockObs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    clockObs.observe(clock);
  }

  /* ---------- weekday ---------- */
  var wdEl = $("#weekday");
  if (wdEl) {
    var names = ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"];
    var maxWd = Math.max.apply(null, D.weekday);
    D.weekday.forEach(function (v, i) {
      var d = el("div", "wd");
      d.innerHTML = '<b>' + nf.format(v) + "</b><i style=\"--h:" + pct(v, maxWd) + '\"></i><span>' + names[i] + "</span>";
      wdEl.appendChild(d);
    });
  }

  /* ---------- years ---------- */
  var yb = $("#yearbars");
  if (yb) {
    var maxY = Math.max.apply(null, D.years.map(function (y) { return y.streams; }));
    D.years.forEach(function (y) {
      var b = el("div", "yearbar" + (y.streams === maxY ? " peak" : ""));
      b.innerHTML = '<b class="mono">' + nf.format(y.streams) + '</b><i style="--h:' + pct(y.streams, maxY) + '"></i><span>' + String(y.hours).replace(".", ",") + "u</span>";
      yb.appendChild(b);
    });
  }

  /* ---------- reign ---------- */
  var reignEl = $("#reign");
  if (reignEl) {
    var palette = ["#FF4A17", "#7C97A3", "#C1121F", "#8A8B5C", "#C9A227", "#5E6B57", "#A9A395", "#8E6C4F", "#B85C7A", "#4F6B8A", "#B9B3A2", "#6E8B74"];
    var counts = {};
    D.reign.forEach(function (r) { counts[r.name] = (counts[r.name] || 0) + 1; });
    var ranked = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var top = ranked.slice(0, 12);
    var color = {};
    top.forEach(function (nm, i) { color[nm] = palette[i % palette.length]; });

    function hexA(hex, a) {
      if (hex.charAt(0) !== "#") return "rgba(222,215,196," + a + ")";
      var n = parseInt(hex.slice(1), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }

    function shortName(nm) {
      var w = nm.replace(/[^A-Za-z0-9$ ]/g, "").split(" ")[0];
      return w.length > 7 ? w.slice(0, 7) : w;
    }

    var byYear = {};
    D.reign.forEach(function (r) {
      var y = r.m.slice(0, 4), mo = parseInt(r.m.slice(5, 7), 10) - 1;
      byYear[y] = byYear[y] || {};
      byYear[y][mo] = r;
    });

    var grid = el("div", "reign-grid");
    grid.appendChild(el("span", "rlabel", ""));
    ["JAN", "FEB", "MRT", "APR", "MEI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"].forEach(function (m) {
      grid.appendChild(el("span", "rmonth mono", m));
    });
    Object.keys(byYear).sort().forEach(function (y) {
      grid.appendChild(el("span", "ryear mono", y));
      for (var mo = 0; mo < 12; mo++) {
        var cell = el("i", "rcell");
        var r = byYear[y][mo];
        if (r) {
          var c0 = color[r.name] || "rgba(222,215,196,.55)";
          cell.style.background = hexA(c0, 0.16);
          cell.style.borderLeftColor = c0;
          cell.innerHTML = "<u>" + shortName(r.name) + "</u>";
          cell.dataset.info = r.m + " / " + r.name + " / " + nf.format(r.n) + " streams";
        } else {
          cell.style.background = "transparent";
          cell.dataset.info = y + " / " + (mo + 1) + " / geen data";
        }
        grid.appendChild(cell);
      }
    });
    reignEl.appendChild(grid);
    var readout = el("p", "reign-readout mono", "TIK OF BEWEEG OVER EEN MAAND");
    reignEl.appendChild(readout);
    function showCell(e) {
      var t = e.target.closest(".rcell");
      if (t && t.dataset.info) readout.textContent = t.dataset.info;
    }
    grid.addEventListener("mouseover", showCell);
    grid.addEventListener("click", showCell);
    grid.addEventListener("touchstart", showCell, { passive: true });

    var legend = $("#reignlegend");
    if (legend) {
      top.forEach(function (nm) {
        var s = el("span");
        s.innerHTML = '<i style="background:' + color[nm] + '"></i>' + nm + " (" + counts[nm] + " mnd)";
        legend.appendChild(s);
      });
      var rest = ranked.slice(12).reduce(function (a, nm) { return a + counts[nm]; }, 0);
      if (rest) {
        var s2 = el("span");
        s2.innerHTML = '<i style="background:rgba(222,215,196,.22)"></i>overig (' + rest + " mnd)";
        legend.appendChild(s2);
      }
    }
    var ry = $("#reignyears");
    if (ry) {
      D.years.forEach(function (y) {
        var row = el("div", "ry-row");
        row.innerHTML = '<span class="yr">' + y.y + '</span><span class="nm">' + (y.top_artist || "onbekend") +
          '</span><span class="st">' + nf.format(y.top_artist_n) + '</span><span class="tr">' + nf.format(y.streams) + "</span>";
        ry.appendChild(row);
      });
    }
  }

  /* ---------- artists ---------- */
  var al = $("#artistlist");
  if (al) {
    var maxA = Math.max.apply(null, D.official_artists.map(function (a) { return a.hours; }));
    D.official_artists.slice(0, 20).forEach(function (a) {
      var li = el("li", "artist");
      li.innerHTML =
        '<span class="pos">' + (a.pos < 10 ? "0" + a.pos : a.pos) + "</span>" +
        '<span class="ph"><img loading="lazy" src="' + (a.img || "") + '" alt="' + a.name + '"></span>' +
        '<span><span class="nm">' + a.name + '</span><span class="gn">' + (a.genres || []).join(" / ") + "</span></span>" +
        '<span class="bar"><i style="--w:' + pct(a.hours, maxA) + '"></i></span>' +
        '<span class="num"><b>' + String(a.hours).replace(".", ",") + "</b><span>" + nf.format(a.n) + " streams</span></span>";
      al.appendChild(li);
    });
  }

  /* ---------- tracks ---------- */
  var player = $("#player");
  var currentBtn = null;
  var nowbar = $("#nowbar"), nowimg = $("#nowimg"), nowtitle = $("#nowtitle"),
      nowartist = $("#nowartist"), nowtime = $("#nowtime"), nowfill = $("#nowfill"),
      nowtoggle = $("#nowtoggle");
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function showNow(t) {
    if (!nowbar) return;
    nowimg.src = t.img || "";
    nowtitle.textContent = t.name;
    nowartist.textContent = (t.artists || "") + " · fragment 0:30";
    nowbar.classList.add("on");
    document.body.classList.add("has-now");
    nowbar.setAttribute("aria-hidden", "false");
  }
  function hideNow() {
    if (!nowbar) return;
    nowbar.classList.remove("on");
    document.body.classList.remove("has-now");
    nowbar.setAttribute("aria-hidden", "true");
  }
  var tl = $("#tracklist");
  if (tl) {
    D.tracks.forEach(function (t, i) {
      var li = el("li", "track");
      li.innerHTML =
        '<span class="pos">' + (i + 1 < 10 ? "0" + (i + 1) : i + 1) + "</span>" +
        '<span class="tcover"><img loading="lazy" src="' + (t.img || "") + '" alt="' + t.name + '"></span>' +
        '<span><span class="tt">' + t.name + '</span><span class="ta">' + (t.artists || "") + "</span></span>" +
        '<span class="tn"><b>' + nf.format(t.n) + "</b> keer</span>" +
        '<button class="play" type="button" aria-label="Speel fragment van ' + t.name + '" title="30 seconden uit het nummer">' +
        '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg></button>' +
        '<span class="tprog" aria-hidden="true"><i></i></span>';
      tl.appendChild(li);

      var btn = $(".play", li);
      if (!t.audio) return;
      btn.addEventListener("click", function () {
        if (currentBtn === btn && !player.paused) {
          player.pause();
          li.classList.remove("playing");
          btn.innerHTML = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>';
          var pb = $(".tprog i", li); if (pb) pb.style.width = "0%";
          currentBtn = null;
          return;
        }
        $$(".track.playing").forEach(function (x) { x.classList.remove("playing"); });
        $$(".play").forEach(function (b) { b.innerHTML = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>'; });
        $$(".tprog i").forEach(function (b) { b.style.width = "0%"; });
        player.src = t.audio;
        player.play();
        showNow(t);
        li.classList.add("playing");
        btn.innerHTML = '<svg viewBox="0 0 8 10" aria-hidden="true"><path d="M0 0h3v10H0zM5 0h3v10H5z"/></svg>';
        currentBtn = btn;
      });
    });
    player.addEventListener("timeupdate", function () {
      var row = $(".track.playing");
      if (!row) return;
      var bar = $(".tprog i", row);
      var pctv = Math.min(100, (player.currentTime / (player.duration || 30)) * 100);
      if (bar) bar.style.width = pctv + "%";
      if (nowfill) nowfill.style.width = pctv + "%";
      if (nowtime) nowtime.textContent = fmt(player.currentTime) + " / " + fmt(Math.round(player.duration || 30));
    });
    player.addEventListener("ended", function () {
      $$(".track.playing").forEach(function (x) { x.classList.remove("playing"); });
      $$(".play").forEach(function (b) { b.innerHTML = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>'; });
      $$(".tprog i").forEach(function (b) { b.style.width = "0%"; });
      currentBtn = null;
      hideNow();
    });
    var nowprog = $(".nowprog");
    if (nowprog) {
      nowprog.addEventListener("click", function (e) {
        var r = nowprog.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        if (player.duration) player.currentTime = p * player.duration;
      });
    }
    if (nowtoggle) {
      nowtoggle.addEventListener("click", function () {
        if (player.paused) {
          player.play();
          nowtoggle.innerHTML = '<svg viewBox="0 0 8 10" aria-hidden="true"><path d="M0 0h3v10H0zM5 0h3v10H5z"/></svg>';
        } else {
          player.pause();
          nowtoggle.innerHTML = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>';
        }
      });
    }
  }

  /* ---------- albums ---------- */
  var ag = $("#albumgrid");
  if (ag) {
    D.albums.slice(0, 9).forEach(function (a) {
      var name = a.name;
      var art = el("article", "album");
      art.innerHTML =
        '<div class="art"><img loading="lazy" src="' + (a.img || "") + '" alt="' + name + '"><span class="n">' + nf.format(a.n) + "</span></div>" +
                  '<div class="an">' + name + '</div><div class="aa">' + (a.artist || "onbekend") + (a.year ? " / " + a.year : "") + "</div>";
      ag.appendChild(art);
    });
  }

  /* ---------- genres ---------- */
  var gb = $("#genrebars");
  if (gb) {
    var maxG = D.genres.lifetime[0].n;
    D.genres.lifetime.slice(0, 15).forEach(function (g) {
      var row = el("div", "gbar");
      row.innerHTML = '<span class="tag">' + g.tag + '</span><span class="gbar-track"><i style="--w:' + pct(g.n, maxG) + '"></i></span><span class="val">' + nf.format(g.n) + "</span>";
      gb.appendChild(row);
    });
  }

  /* ---------- rap chart ---------- */
  var rc = $("#rapchart");
  if (rc) {
    var years = Object.keys(D.rap_share).sort();
    var W = 420, H = 200, pad = 18;
    var min = 70, max = 100;
    var pts = years.map(function (y, i) {
      var x = pad + (i / (years.length - 1)) * (W - pad * 2);
      var v = D.rap_share[y];
      var yy = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
      return [x, yy, v, y];
    });
    var NS = "http://www.w3.org/2000/svg";
    [80, 90, 100].forEach(function (gv) {
      var yy = H - pad - ((gv - min) / (max - min)) * (H - pad * 2);
      var l = document.createElementNS(NS, "line");
      l.setAttribute("x1", pad); l.setAttribute("x2", W - pad); l.setAttribute("y1", yy); l.setAttribute("y2", yy);
      l.setAttribute("stroke", "rgba(222,215,196,.12)"); l.setAttribute("stroke-width", "1");
      rc.appendChild(l);
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", pad); t.setAttribute("y", yy - 5);
      t.setAttribute("fill", "rgba(222,215,196,.35)"); t.setAttribute("font-size", "8");
      t.setAttribute("font-family", "IBM Plex Mono, monospace");
      t.textContent = gv + "%";
      rc.appendChild(t);
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = d + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - pad) + " L" + pts[0][0].toFixed(1) + " " + (H - pad) + " Z";
    var fill = document.createElementNS(NS, "path");
    fill.setAttribute("d", area);
    fill.setAttribute("fill", "rgba(255,74,23,.14)");
    rc.appendChild(fill);
    var line = document.createElementNS(NS, "path");
    line.setAttribute("d", d);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#FF4A17");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linejoin", "round");
    rc.appendChild(line);
    pts.forEach(function (p) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", "3");
      c.setAttribute("fill", "#0B0B09"); c.setAttribute("stroke", "#FF4A17"); c.setAttribute("stroke-width", "2");
      rc.appendChild(c);
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", p[0]); t.setAttribute("y", p[1] - 9);
      t.setAttribute("text-anchor", "middle"); t.setAttribute("fill", "#DED7C4");
      t.setAttribute("font-size", "8"); t.setAttribute("font-family", "IBM Plex Mono, monospace");
      t.textContent = Math.round(p[2]) + "%";
      rc.appendChild(t);
    });
  }

  /* ---------- recent ---------- */
  var lifetimeNames = {};
  (D.official_artists || []).forEach(function (a) { lifetimeNames[a.name] = true; });
  function renderRecent(target, list) {
    if (!target) return;
    var sorted = list.slice().sort(function (a, b) { return b.n - a.n; });
    sorted.forEach(function (a) {
      var row = el("div", "rar");
      var isNew = !lifetimeNames[a.name];
      row.innerHTML = '<img loading="lazy" src="' + (a.img || "") + '" alt="' + a.name + '"><span class="nm">' + a.name +
        (isNew ? '<em class="new">nieuw</em>' : "") + '</span><span class="nv">' + nf.format(a.n) + "</span>";
      target.appendChild(row);
    });
  }
  renderRecent($("#recentartists"), D.recent.artists);
  renderRecent($("#weekartists"), D.recent.weeks_artists);

  var wg = $("#weekgenres");
  if (wg) {
    var wgList = D.recent.weeks_genres.slice().sort(function (a, b) { return b.n - a.n; });
    var maxWg = wgList[0].n;
    wgList.forEach(function (g) {
      var row = el("div", "wg");
      row.innerHTML = "<span>" + g.tag + '</span><span style="text-align:right">' + nf.format(g.n) + "</span><i style=\"--w:" + pct(g.n, maxWg) + '"></i>';
      wg.appendChild(row);
    });
  }

  /* ---------- sparkline ---------- */
  var spark = $("#spark");
  if (spark && D.month && D.month.length) {
    var SW = 560, SH = 58, maxM = Math.max.apply(null, D.month.map(function (m) { return m.n; }));
    var pts = D.month.map(function (m, i) {
      var x = (i / (D.month.length - 1)) * SW;
      var y = SH - (m.n / maxM) * (SH - 4) - 2;
      return [x, y];
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = d + " L" + SW + " " + SH + " L0 " + SH + " Z";
    spark.innerHTML = '<svg viewBox="0 0 ' + SW + " " + SH + '" preserveAspectRatio="none">' +
      '<path d="' + area + '" fill="rgba(255,74,23,.16)"/>' +
      '<path d="' + d + '" fill="none" stroke="#FF4A17" stroke-width="1.4"/>' +
      '<line x1="0" y1="' + (SH - 1) + '" x2="' + SW + '" y2="' + (SH - 1) + '" stroke="rgba(222,215,196,.18)"/>' +
      "</svg>";
  }

  /* ---------- counters ---------- */
  var counters = $$(".count");
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var node = en.target;
      cObs.unobserve(node);
      var to = parseFloat(node.dataset.to);
      var dec = parseInt(node.dataset.dec || "0", 10);
      var t0 = performance.now();
      function step(t) {
        var p = Math.min(1, (t - t0) / 1400);
        var v = to * (1 - Math.pow(1 - p, 4));
        if (dec) {
          var parts = v.toFixed(dec).split(".");
          node.textContent = nf.format(parseInt(parts[0], 10)) + "," + parts[1];
        } else {
          node.textContent = nf.format(Math.round(v));
        }
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  counters.forEach(function (c) { cObs.observe(c); });

  /* ---------- reveals ---------- */
  var rObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var n = en.target;
      n.classList.add("in");
      rObs.unobserve(n);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal]").forEach(function (n, i) {
    n.style.transitionDelay = ((i % 4) * 0.07) + "s";
    rObs.observe(n);
  });
  $$(".fact").forEach(function (n) { n.classList.add("in"); });

  /* ---------- progress + rail ---------- */
  var bar = $(".progress i");
  function onScroll() {
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (bar) bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = $$(".rail a");
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  var nObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  secs.forEach(function (s) { nObs.observe(s); });

  /* ---------- share ---------- */
  var share = $("#share");
  if (share) {
    share.addEventListener("click", function () {
      var url = location.href;
      var done = function () {
        share.textContent = "Gekopieerd";
        setTimeout(function () { share.textContent = "Kopieer de link"; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
      else done();
    });
  }

  /* ---------- gsap extras ---------- */
  if (window.gsap) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(".cover-title", {
        yPercent: -12, ease: "none",
        scrollTrigger: { trigger: ".cover", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to(".cover-photos .cp", {
        yPercent: function (i) { return -18 - i * 10; }, ease: "none",
        scrollTrigger: { trigger: ".cover", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.utils.toArray(".yearbar i").forEach(function (b) {
        gsap.from(b, {
          scaleY: 0, duration: 1.1, ease: "power3.out", immediateRender: false,
          scrollTrigger: { trigger: "#yearbars", start: "top 80%" }
        });
      });
      gsap.utils.toArray(".gbar .gbar-track i").forEach(function (b, i) {
        gsap.from(b, {
          scaleX: 0, transformOrigin: "0 50%", duration: 1, delay: i * 0.03, ease: "power2.out", immediateRender: false,
          scrollTrigger: { trigger: "#genrebars", start: "top 82%" }
        });
      });
      gsap.from(".verdict-stamp-big", {
        scale: 1.6, opacity: 0, rotate: -12, duration: 0.8, ease: "power4.out", immediateRender: false,
        scrollTrigger: { trigger: ".verdict-stamp-big", start: "top 85%" }
      });
    }
  }
})();

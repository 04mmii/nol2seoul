/*
 * Kakao Maps SDK test double — served instead of https://dapi.kakao.com/v2/maps/sdk.js in map tests.
 * It is NOT the real SDK: no tiles, a simple equirectangular projection, only the API surface the app uses
 * (maps.load, LatLng, Point, Size, Map, Marker, MarkerImage, CustomOverlay, MarkerClusterer, event).
 * MarkerClusterer here is a simple pixel-grid grouping (not Kakao's algorithm); clusters are
 * <div data-kakao-stub="cluster"> with the count as text.
 * Markers are <img title="…"> elements, so tests can find and click pins by place name.
 * The real map can only be checked on a domain registered in the Kakao developer console.
 */
(function () {
  function LatLng(lat, lng) { this.lat = lat; this.lng = lng; }
  LatLng.prototype.getLat = function () { return this.lat; };
  LatLng.prototype.getLng = function () { return this.lng; };
  function Point(x, y) { this.x = x; this.y = y; }
  function Size(width, height) { this.width = width; this.height = height; }
  function MarkerImage(src, size, options) { this.src = src; this.size = size; this.offset = (options && options.offset) || new Point(size.width / 2, size.height); }

  function Map(container, opts) {
    this.container = container;
    this.center = opts.center;
    this.level = opts.level;
    this.items = [];
    this.listeners = {};
    this.clusterers = [];
    this.pane = document.createElement('div');
    this.pane.setAttribute('data-kakao-stub', 'map');
    this.pane.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#e9e6df;' +
      'background-image:linear-gradient(#d9d4c8 1px,transparent 1px),linear-gradient(90deg,#d9d4c8 1px,transparent 1px);background-size:64px 64px;';
    var tag = document.createElement('div');
    tag.textContent = 'TEST MAP (Kakao SDK stub)';
    tag.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:600 12px monospace;color:#b9b2a3;letter-spacing:.1em;pointer-events:none;';
    this.pane.appendChild(tag);
    container.appendChild(this.pane);
    container.setAttribute('data-level', String(this.level));
    var self = this;
    if (window.ResizeObserver) new ResizeObserver(function () { self.layout(); }).observe(container);
  }
  Map.prototype.project = function (latlng) {
    var w = this.container.clientWidth, h = this.container.clientHeight;
    var ppd = 2200 * Math.pow(2, 8 - this.level);
    return { x: w / 2 + (latlng.lng - this.center.lng) * ppd * 0.79, y: h / 2 - (latlng.lat - this.center.lat) * ppd };
  };
  Map.prototype.layout = function () {
    for (var i = 0; i < this.items.length; i++) this.items[i].layout();
    for (var j = 0; j < this.clusterers.length; j++) this.clusterers[j].redraw();
  };
  Map.prototype.fire = function (type) { (this.listeners[type] || []).slice().forEach(function (fn) { fn(); }); };
  Map.prototype.setCenter = function (c) { this.center = c; this.layout(); };
  Map.prototype.panTo = function (c) { this.center = c; this.container.setAttribute('data-center', c.lat.toFixed(4) + ',' + c.lng.toFixed(4)); this.layout(); };
  Map.prototype.getCenter = function () { return this.center; };
  Map.prototype.panBy = function (dx, dy) {
    var ppd = 2200 * Math.pow(2, 8 - this.level);
    this.center = new LatLng(this.center.lat - dy / ppd, this.center.lng + dx / (ppd * 0.79));
    this.container.setAttribute('data-panby', dx + ',' + dy);
    this.layout();
  };
  Map.prototype.setLevel = function (l, opts) {
    var next = Math.max(1, Math.min(14, l));
    if (opts && opts.anchor) { // keep the anchor's screen position: offsets scale by 2^(next - level)
      var k = Math.pow(2, next - this.level), a = opts.anchor;
      this.center = new LatLng(a.lat + (this.center.lat - a.lat) * k, a.lng + (this.center.lng - a.lng) * k);
      this.container.setAttribute('data-zoom-anchor', a.lat.toFixed(4) + ',' + a.lng.toFixed(4));
    }
    this.level = next; this.container.setAttribute('data-level', String(this.level)); this.layout(); this.fire('zoom_changed');
  };
  Map.prototype.getLevel = function () { return this.level; };
  Map.prototype.add = function (item) { this.items.push(item); this.pane.appendChild(item.el); item.layout(); };
  Map.prototype.remove = function (item) { var i = this.items.indexOf(item); if (i >= 0) this.items.splice(i, 1); if (item.el.parentNode) item.el.parentNode.removeChild(item.el); };

  function Marker(opts) {
    this.position = opts.position;
    this.el = document.createElement('img');
    this.el.setAttribute('data-kakao-stub', 'marker');
    if (opts.title) { this.el.title = opts.title; this.el.alt = opts.title; }
    this.el.style.position = 'absolute';
    this.el.style.cursor = 'pointer';
    this.setZIndex(opts.zIndex || 0);
    this.setImage(opts.image || new MarkerImage('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/%3E', new Size(10, 10)));
    this.map = null;
    if (opts.map) this.setMap(opts.map);
  }
  Marker.prototype.setImage = function (img) { this.image = img; this.el.src = img.src; this.el.width = img.size.width; this.el.height = img.size.height; this.layout(); };
  Marker.prototype.setZIndex = function (z) { this.el.style.zIndex = String(z); };
  Marker.prototype.getPosition = function () { return this.position; };
  Marker.prototype.setMap = function (m) { if (this.map) this.map.remove(this); this.map = m; if (m) m.add(this); };
  Marker.prototype.layout = function () {
    if (!this.map || !this.image) return;
    var p = this.map.project(this.position);
    this.el.style.left = (p.x - this.image.offset.x) + 'px';
    this.el.style.top = (p.y - this.image.offset.y) + 'px';
  };

  function CustomOverlay(opts) {
    this.position = opts.position;
    this.yAnchor = opts.yAnchor == null ? 0.5 : opts.yAnchor;
    this.el = document.createElement('div');
    this.el.setAttribute('data-kakao-stub', 'overlay');
    this.el.style.cssText = 'position:absolute;z-index:' + (opts.zIndex || 0) + ';';
    if (typeof opts.content === 'string') this.el.innerHTML = opts.content; else this.el.appendChild(opts.content);
    this.map = null;
    if (opts.map) this.setMap(opts.map);
  }
  CustomOverlay.prototype.setMap = function (m) { if (this.map) this.map.remove(this); this.map = m; if (m) m.add(this); };
  CustomOverlay.prototype.layout = function () {
    if (!this.map) return;
    var p = this.map.project(this.position);
    this.el.style.left = p.x + 'px';
    this.el.style.top = p.y + 'px';
    this.el.style.transform = 'translate(-50%,' + (-this.yAnchor * 100) + '%)';
  };

  function MarkerClusterer(opts) {
    this.map = opts.map; this.markers = []; this.divs = [];
    this.minLevel = opts.minLevel || 0; this.grid = opts.gridSize || 60; this.minSize = opts.minClusterSize || 2;
    this.calc = opts.calculator || [10, 100]; this.styles = opts.styles || [];
    this.map.clusterers.push(this);
  }
  MarkerClusterer.prototype.addMarkers = function (ms) { for (var i = 0; i < ms.length; i++) this.markers.push(ms[i]); this.redraw(); };
  MarkerClusterer.prototype.addMarker = function (m) { this.markers.push(m); this.redraw(); };
  MarkerClusterer.prototype.removeMarker = function (m) { var i = this.markers.indexOf(m); if (i >= 0) { this.markers.splice(i, 1); m.setMap(null); } this.redraw(); };
  MarkerClusterer.prototype.clear = function () { for (var i = 0; i < this.markers.length; i++) this.markers[i].setMap(null); this.markers = []; this.redraw(); };
  MarkerClusterer.prototype.redraw = function () {
    var map = this.map, self = this;
    this.divs.forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); }); this.divs = [];
    if (map.level < this.minLevel) { this.markers.forEach(function (m) { if (m.map !== map) { m.map = map; map.items.push(m); map.pane.appendChild(m.el); } m.layout(); }); return; }
    var cells = {};
    this.markers.forEach(function (m) { var p = map.project(m.position); var k = Math.floor(p.x / self.grid) + ':' + Math.floor(p.y / self.grid); (cells[k] = cells[k] || []).push({ m: m, p: p }); });
    Object.keys(cells).forEach(function (k) {
      var g = cells[k];
      if (g.length < self.minSize) { g.forEach(function (o) { if (o.m.map !== map) { o.m.map = map; map.items.push(o.m); map.pane.appendChild(o.m.el); } o.m.layout(); }); return; }
      g.forEach(function (o) { if (o.m.map === map) { var i = map.items.indexOf(o.m); if (i >= 0) map.items.splice(i, 1); if (o.m.el.parentNode) o.m.el.parentNode.removeChild(o.m.el); o.m.map = null; } });
      var idx = 0; while (idx < self.calc.length && g.length >= self.calc[idx]) idx++;
      var d = document.createElement('div'); d.setAttribute('data-kakao-stub', 'cluster'); d.textContent = String(g.length);
      var st = self.styles[Math.min(idx, self.styles.length - 1)] || {}; for (var key in st) d.style[key] = st[key];
      var x = 0, y = 0; g.forEach(function (o) { x += o.p.x; y += o.p.y; }); x /= g.length; y /= g.length;
      d.style.position = 'absolute'; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.transform = 'translate(-50%,-50%)'; d.style.cursor = 'pointer'; d.style.zIndex = '5';
      d.addEventListener('click', function () { map.setLevel(map.level - 1); });
      map.pane.appendChild(d); self.divs.push(d);
    });
  };

  window.kakao = {
    maps: {
      load: function (cb) { cb(); },
      LatLng: LatLng, Point: Point, Size: Size, Map: Map, Marker: Marker, MarkerImage: MarkerImage, CustomOverlay: CustomOverlay, MarkerClusterer: MarkerClusterer,
      event: {
        addListener: function (target, type, fn) { if (target instanceof Map) (target.listeners[type] = target.listeners[type] || []).push(fn); else target.el.addEventListener(type, fn); },
        removeListener: function (target, type, fn) { if (target instanceof Map) { var l = target.listeners[type] || []; var i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } else target.el.removeEventListener(type, fn); },
      },
    },
  };
})();

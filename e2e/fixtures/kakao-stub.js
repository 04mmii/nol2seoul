/*
 * Kakao Maps SDK test double — served instead of https://dapi.kakao.com/v2/maps/sdk.js in map tests.
 * It is NOT the real SDK: no tiles, a simple equirectangular projection, only the API surface the app uses
 * (maps.load, LatLng, Point, Size, Map, Marker, MarkerImage, CustomOverlay, event.addListener).
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
  Map.prototype.layout = function () { for (var i = 0; i < this.items.length; i++) this.items[i].layout(); };
  Map.prototype.setCenter = function (c) { this.center = c; this.layout(); };
  Map.prototype.panTo = function (c) { this.center = c; this.container.setAttribute('data-center', c.lat.toFixed(4) + ',' + c.lng.toFixed(4)); this.layout(); };
  Map.prototype.getCenter = function () { return this.center; };
  Map.prototype.panBy = function (dx, dy) {
    var ppd = 2200 * Math.pow(2, 8 - this.level);
    this.center = new LatLng(this.center.lat - dy / ppd, this.center.lng + dx / (ppd * 0.79));
    this.container.setAttribute('data-panby', dx + ',' + dy);
    this.layout();
  };
  Map.prototype.setLevel = function (l) { this.level = Math.max(1, Math.min(14, l)); this.container.setAttribute('data-level', String(this.level)); this.layout(); };
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

  window.kakao = {
    maps: {
      load: function (cb) { cb(); },
      LatLng: LatLng, Point: Point, Size: Size, Map: Map, Marker: Marker, MarkerImage: MarkerImage, CustomOverlay: CustomOverlay,
      event: { addListener: function (target, type, fn) { target.el.addEventListener(type, fn); } },
    },
  };
})();

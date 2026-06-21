(function() {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function bindMenu() {
    var button = document.querySelector(".menu-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!button || !menu) return;
    button.addEventListener("click", function() {
      var open = menu.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function bindHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function() {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function() {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function() {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        var value = Number(dot.getAttribute("data-hero-dot") || "0");
        show(value);
        restart();
      });
    });

    show(0);
    restart();
  }

  function bindFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
    panels.forEach(function(panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector(".movie-search-input");
      var region = panel.querySelector(".movie-region-select");
      var type = panel.querySelector(".movie-type-select");
      var year = panel.querySelector(".movie-year-select");
      var reset = panel.querySelector(".filter-reset");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-list .movie-card"));

      function valueOf(element) {
        return element ? element.value.trim().toLowerCase() : "";
      }

      function apply() {
        var q = valueOf(input);
        var r = valueOf(region);
        var t = valueOf(type);
        var y = valueOf(year);
        cards.forEach(function(card) {
          var text = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-type") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-genre") || ""
          ].join(" ").toLowerCase();
          var show = true;
          if (q && text.indexOf(q) === -1) show = false;
          if (r && (card.getAttribute("data-region") || "").toLowerCase().indexOf(r) === -1) show = false;
          if (t && (card.getAttribute("data-type") || "").toLowerCase().indexOf(t) === -1 && (card.getAttribute("data-genre") || "").toLowerCase().indexOf(t) === -1) show = false;
          if (y && (card.getAttribute("data-year") || "").toLowerCase().indexOf(y) === -1) show = false;
          card.style.display = show ? "" : "none";
        });
      }

      [input, region, type, year].forEach(function(element) {
        if (!element) return;
        element.addEventListener("input", apply);
        element.addEventListener("change", apply);
      });

      if (reset) {
        reset.addEventListener("click", function() {
          if (input) input.value = "";
          if (region) region.value = "";
          if (type) type.value = "";
          if (year) year.value = "";
          apply();
        });
      }

      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q && input) {
        input.value = q;
        apply();
      }
    });
  }

  window.initializePlayer = function(streamUrl, videoId, overlayId) {
    ready(function() {
      var video = document.getElementById(videoId);
      var overlay = document.getElementById(overlayId);
      if (!video || !streamUrl) return;
      var loaded = false;
      var hlsInstance = null;

      function start() {
        if (overlay) overlay.classList.add("is-hidden");
        if (!loaded) {
          loaded = true;
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.load();
            video.play().catch(function() {});
          } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function() {
              video.play().catch(function() {});
            });
          } else {
            video.src = streamUrl;
            video.load();
            video.play().catch(function() {});
          }
        } else {
          video.play().catch(function() {});
        }
      }

      if (overlay) {
        overlay.addEventListener("click", start);
      }

      video.addEventListener("click", function() {
        if (video.paused) start();
      });

      window.addEventListener("beforeunload", function() {
        if (hlsInstance) hlsInstance.destroy();
      });
    });
  };

  ready(function() {
    bindMenu();
    bindHero();
    bindFilters();
  });
})();

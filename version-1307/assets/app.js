(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var prev = document.querySelector(".hero-prev");
    var next = document.querySelector(".hero-next");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    restart();
  }

  function setupFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".filterable-grid .movie-card"));
    var search = document.getElementById("movie-search");
    var region = document.getElementById("region-filter");
    var type = document.getElementById("type-filter");
    var genre = document.getElementById("genre-filter");
    if (!cards.length || !search) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (initial) {
      search.value = initial;
    }

    function matches(card) {
      var query = search.value.trim().toLowerCase();
      var regionValue = region ? region.value : "";
      var typeValue = type ? type.value : "";
      var genreValue = genre ? genre.value : "";
      var haystack = (card.getAttribute("data-search") || "").toLowerCase();
      var cardGenre = card.getAttribute("data-genre") || "";
      return (!query || haystack.indexOf(query) !== -1)
        && (!regionValue || card.getAttribute("data-region") === regionValue)
        && (!typeValue || card.getAttribute("data-type") === typeValue)
        && (!genreValue || cardGenre.indexOf(genreValue) !== -1);
    }

    function apply() {
      cards.forEach(function (card) {
        card.classList.toggle("is-hidden", !matches(card));
      });
    }

    [search, region, type, genre].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    apply();
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });

  window.initMoviePlayer = function (url) {
    var video = document.querySelector(".movie-video");
    var veil = document.querySelector(".player-veil");
    if (!video || !veil || !url) {
      return;
    }
    var prepared = false;
    var hls = null;

    function attach() {
      if (prepared) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }
      prepared = true;
    }

    function start() {
      attach();
      veil.classList.add("is-hidden");
      video.controls = true;
      var play = video.play();
      if (play && typeof play.catch === "function") {
        play.catch(function () {});
      }
    }

    veil.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!prepared) {
        start();
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();

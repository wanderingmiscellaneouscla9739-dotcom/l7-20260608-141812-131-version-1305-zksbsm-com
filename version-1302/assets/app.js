var MovieSite = (function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function mobileMenu() {
    var button = document.getElementById("mobileMenuButton");
    var nav = document.getElementById("mobileNav");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function heroSlider() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var prev = document.querySelector(".hero-prev");
    var next = document.querySelector(".hero-next");
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer;

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
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

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

    restart();
  }

  function localFilters() {
    var search = document.querySelector(".category-search");
    var year = document.querySelector(".category-year");
    var type = document.querySelector(".category-type");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card-item"));
    if (!cards.length || (!search && !year && !type)) {
      return;
    }

    function apply() {
      var query = search ? search.value.trim().toLowerCase() : "";
      var selectedYear = year ? year.value : "";
      var selectedType = type ? type.value : "";
      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase() + " " + (card.dataset.title || "").toLowerCase() + " " + (card.dataset.region || "").toLowerCase();
        var matchQuery = !query || text.indexOf(query) !== -1;
        var matchYear = !selectedYear || card.dataset.year === selectedYear;
        var matchType = !selectedType || card.dataset.type === selectedType;
        card.classList.toggle("is-filtered-out", !(matchQuery && matchYear && matchType));
      });
    }

    [search, year, type].forEach(function (el) {
      if (el) {
        el.addEventListener("input", apply);
        el.addEventListener("change", apply);
      }
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cardHtml(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\">" +
      "<a class=\"poster-wrap\" href=\"" + escapeHtml(movie.url) + "\" aria-label=\"观看" + escapeHtml(movie.title) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"poster-play\">▶</span><span class=\"poster-year\">" + escapeHtml(movie.year) + "</span></a>" +
      "<div class=\"movie-card-body\"><div class=\"movie-card-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<h2><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h2>" +
      "<p>" + escapeHtml(movie.oneLine) + "</p><div class=\"card-tags\">" + tags + "</div></div></article>";
  }

  function renderSearchPage() {
    var target = document.getElementById("searchResults");
    var input = document.getElementById("searchPageInput");
    var title = document.getElementById("searchResultTitle");
    if (!target || !window.MovieSearchIndex) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (input) {
      input.value = query;
    }
    var normalized = query.trim().toLowerCase();
    var results = window.MovieSearchIndex.filter(function (movie) {
      if (!normalized) {
        return true;
      }
      var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.category, movie.oneLine, (movie.tags || []).join(" ")].join(" ").toLowerCase();
      return text.indexOf(normalized) !== -1;
    }).slice(0, 160);
    if (title) {
      title.textContent = normalized ? "与“" + query + "”相关的片库结果" : "推荐片库结果";
    }
    if (!results.length) {
      target.innerHTML = "<div class=\"empty-results\">没有找到完全匹配的影片，可以尝试更换片名、地区、年份或类型关键词。</div>";
      return;
    }
    target.innerHTML = results.map(cardHtml).join("");
  }

  function setupPlayer(streamUrl) {
    function bind() {
      var video = document.getElementById("movieVideo");
      var button = document.getElementById("playerStart");
      if (!video || !button || !streamUrl) {
        return;
      }
      var attached = false;
      var hlsInstance = null;

      function attach() {
        if (attached) {
          return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          return;
        }
        video.src = streamUrl;
      }

      function start() {
        attach();
        button.classList.add("is-hidden");
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            button.classList.remove("is-hidden");
          });
        }
      }

      button.addEventListener("click", start);
      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }
    ready(bind);
  }

  ready(function () {
    mobileMenu();
    heroSlider();
    localFilters();
    renderSearchPage();
  });

  return {
    setupPlayer: setupPlayer,
    renderSearchPage: renderSearchPage
  };
})();

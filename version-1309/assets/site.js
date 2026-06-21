(function () {
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initMobileMenu() {
    var toggle = $('[data-mobile-toggle]');
    var panel = $('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initHero() {
    var carousel = $('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = $$('[data-hero-slide]', carousel);
    var dots = $$('[data-hero-dot]', carousel);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    $$('[data-filter-panel]').forEach(function (panel) {
      var targetId = panel.getAttribute('data-target');
      var container = document.getElementById(targetId);
      if (!container) {
        return;
      }
      var cards = $$('[data-movie-card]', container);
      var search = $('[data-movie-search]', panel);
      var year = $('[data-year-filter]', panel);
      var type = $('[data-type-filter]', panel);
      var years = Array.from(new Set(cards.map(function (card) {
        return card.getAttribute('data-year');
      }).filter(Boolean))).sort(function (a, b) {
        return Number(b) - Number(a);
      });
      var types = Array.from(new Set(cards.map(function (card) {
        return card.getAttribute('data-type');
      }).filter(Boolean))).sort();

      years.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        year.appendChild(option);
      });

      types.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        type.appendChild(option);
      });

      function apply() {
        var q = normalize(search.value);
        var y = year.value;
        var t = type.value;
        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-search'));
          var matchQuery = !q || haystack.indexOf(q) !== -1;
          var matchYear = !y || card.getAttribute('data-year') === y;
          var matchType = !t || card.getAttribute('data-type') === t;
          card.style.display = matchQuery && matchYear && matchType ? '' : 'none';
        });
      }

      [search, year, type].forEach(function (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      });
    });
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<article class="movie-card">' +
      '<a class="poster-link" href="' + escapeHtml(movie.url) + '">' +
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="play-chip">立即播放</span>' +
      '</a>' +
      '<div class="movie-card-body">' +
      '<div class="movie-meta-line"><span>' + movie.year + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.region) + '</span></div>' +
      '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '<p>' + escapeHtml(movie.oneLine) + '</p>' +
      '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
      '</article>';
  }

  function initSearchPage() {
    var results = $('#search-results');
    if (!results || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = normalize(params.get('q'));
    var input = $('#search-page-input');
    var title = $('#search-title');
    if (input && query) {
      input.value = params.get('q');
    }
    var matched = window.MOVIES.filter(function (movie) {
      if (!query) {
        return true;
      }
      return normalize([
        movie.title,
        movie.year,
        movie.type,
        movie.region,
        movie.genre,
        (movie.tags || []).join(' '),
        movie.oneLine
      ].join(' ')).indexOf(query) !== -1;
    });
    var visible = matched.slice(0, query ? 240 : 80);
    if (title) {
      title.textContent = query ? '搜索：' + params.get('q') : '热门影片检索';
    }
    if (!visible.length) {
      results.innerHTML = '<div class="empty-state">没有找到匹配影片，可尝试更换关键词。</div>';
      return;
    }
    results.innerHTML = visible.map(movieCard).join('');
  }

  function initPlayer() {
    $$('.movie-player').forEach(function (player) {
      var video = $('.player-video', player);
      var overlay = $('.player-overlay', player);
      var stream = player.getAttribute('data-stream');
      var loaded = false;
      if (!video || !overlay || !stream) {
        return;
      }

      function attach() {
        if (loaded) {
          return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else {
          video.src = stream;
        }
      }

      function play() {
        attach();
        overlay.classList.add('hidden');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            overlay.classList.remove('hidden');
          });
        }
      }

      overlay.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        overlay.classList.add('hidden');
      });
    });

    $$('[data-play-jump]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var player = $('.movie-player');
        var overlay = $('.player-overlay', player);
        if (player) {
          player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (overlay) {
          window.setTimeout(function () {
            overlay.click();
          }, 260);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initFilters();
    initSearchPage();
    initPlayer();
  });
})();

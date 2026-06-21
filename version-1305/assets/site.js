(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function bindMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
      });
    });
  }

  function bindHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var activeIndex = 0;
    var timer = null;

    function activate(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === activeIndex);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate(activeIndex + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        activate(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);

    activate(0);
    start();
  }

  function bindFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll('[data-filter-root]'));

    forms.forEach(function (root) {
      var searchInput = root.querySelector('[data-filter-search]');
      var categorySelect = root.querySelector('[data-filter-category]');
      var yearSelect = root.querySelector('[data-filter-year]');
      var regionSelect = root.querySelector('[data-filter-region]');
      var scopeSelector = root.getAttribute('data-filter-root') || '[data-card]';
      var cards = Array.prototype.slice.call(document.querySelectorAll(scopeSelector));
      var emptyState = document.querySelector('[data-empty-state]');

      function includesText(value, query) {
        return String(value || '').toLowerCase().indexOf(query) !== -1;
      }

      function applyFilters() {
        var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var category = categorySelect ? categorySelect.value : '';
        var year = yearSelect ? yearSelect.value : '';
        var region = regionSelect ? regionSelect.value : '';
        var visibleCount = 0;

        cards.forEach(function (card) {
          var title = card.getAttribute('data-title') || '';
          var cardCategory = card.getAttribute('data-category') || '';
          var cardYear = card.getAttribute('data-year') || '';
          var cardRegion = card.getAttribute('data-region') || '';
          var cardGenre = card.getAttribute('data-genre') || '';
          var textMatch = !query || includesText(title + ' ' + cardGenre + ' ' + cardRegion, query);
          var categoryMatch = !category || cardCategory === category;
          var yearMatch = !year || cardYear === year;
          var regionMatch = !region || cardRegion.indexOf(region) !== -1;
          var visible = textMatch && categoryMatch && yearMatch && regionMatch;

          card.style.display = visible ? '' : 'none';

          if (visible) {
            visibleCount += 1;
          }
        });

        if (emptyState) {
          emptyState.style.display = visibleCount ? 'none' : 'block';
        }
      }

      [searchInput, categorySelect, yearSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilters);
          control.addEventListener('change', applyFilters);
        }
      });

      applyFilters();
    });
  }

  function bindMoviePlayer(options) {
    var video = document.getElementById(options.videoId);
    var button = document.getElementById(options.buttonId);
    var status = document.getElementById(options.statusId);
    var stream = options.stream;
    var attached = false;

    if (!video || !button || !stream) {
      return;
    }

    function setStatus(message) {
      if (status) {
        status.textContent = message || '';
      }
    }

    function attachStream() {
      if (attached) {
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve, reject) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            attached = true;
            resolve();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              reject(data);
            }
          });
          video._streamController = hls;
        });
      }

      video.src = stream;
      attached = true;
      return Promise.resolve();
    }

    function playVideo() {
      setStatus('正在加载播放内容');
      attachStream()
        .then(function () {
          return video.play();
        })
        .then(function () {
          button.classList.add('is-hidden');
          setStatus('');
        })
        .catch(function () {
          setStatus('播放失败，请稍后重试');
        });
    }

    button.addEventListener('click', playVideo);

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        button.classList.remove('is-hidden');
      }
    });

    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });

    video.addEventListener('ended', function () {
      button.classList.remove('is-hidden');
    });
  }

  ready(function () {
    bindMenu();
    bindHero();
    bindFilters();
  });

  window.App = {
    bindMoviePlayer: bindMoviePlayer
  };
})();

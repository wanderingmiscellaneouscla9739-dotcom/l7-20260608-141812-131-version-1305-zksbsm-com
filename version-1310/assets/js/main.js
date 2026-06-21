(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.style.opacity = '0';
    });
  });

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }
  }

  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var input = form.querySelector('input[name="q"]');
      if (!input) {
        return;
      }
      var query = input.value.trim();
      if (!query) {
        event.preventDefault();
        input.focus();
        return;
      }
      event.preventDefault();
      var action = form.getAttribute('action') || 'search.html';
      window.location.href = action + '?q=' + encodeURIComponent(query);
    });
  });

  if (document.body && document.body.hasAttribute('data-search-page')) {
    var params = new URLSearchParams(window.location.search);
    var queryText = (params.get('q') || '').trim();
    var searchInput = document.querySelector('[data-search-input]');
    var searchTitle = document.querySelector('[data-search-title]');
    var searchStatus = document.querySelector('[data-search-status]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));

    if (searchInput) {
      searchInput.value = queryText;
    }

    function normalize(value) {
      return String(value || '').toLowerCase();
    }

    function applySearch(value) {
      var keyword = normalize(value).trim();
      var shown = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.textContent
        ].join(' '));
        var visible = !keyword || haystack.indexOf(keyword) !== -1;
        card.classList.toggle('is-hidden', !visible);
        if (visible) {
          shown += 1;
        }
      });

      if (searchTitle) {
        searchTitle.textContent = keyword ? '搜索结果' : '全部影片';
      }
      if (searchStatus) {
        searchStatus.textContent = keyword ? '已找到 ' + shown + ' 部匹配影片。' : '输入关键词后可快速筛选。';
      }
    }

    applySearch(queryText);

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        applySearch(searchInput.value);
      });
    }
  }
})();

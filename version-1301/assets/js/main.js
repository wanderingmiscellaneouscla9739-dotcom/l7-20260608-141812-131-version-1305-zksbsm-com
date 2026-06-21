(function () {
  var menu = document.querySelector(".menu-toggle");
  var panel = document.querySelector(".mobile-panel");

  if (menu && panel) {
    menu.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  document.querySelectorAll("img").forEach(function (image) {
    image.addEventListener("error", function () {
      image.classList.add("is-missing");
    });
  });

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var index = 0;

    var show = function (nextIndex) {
      index = nextIndex % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
  }

  var searchPage = document.querySelector("[data-search-page]");

  if (searchPage && Array.isArray(window.MOVIES || MOVIES)) {
    var input = document.getElementById("search-input");
    var result = document.getElementById("search-result");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var query = new URLSearchParams(window.location.search).get("q") || "";
    var activeFilter = "all";

    if (input) {
      input.value = query;
    }

    var render = function () {
      var words = (input && input.value ? input.value : "").trim().toLowerCase();
      var items = MOVIES.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.category,
          movie.type,
          movie.year,
          movie.region,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(" ")
        ].join(" ").toLowerCase();
        var filterMatched = activeFilter === "all" || haystack.indexOf(activeFilter.toLowerCase()) !== -1;
        var queryMatched = !words || haystack.indexOf(words) !== -1;
        return filterMatched && queryMatched;
      }).slice(0, 96);

      result.innerHTML = items.map(function (movie) {
        return [
          '<article class="movie-card">',
          '<a class="movie-cover" href="' + movie.url + '">',
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '<span class="card-badge">' + escapeHtml(movie.category) + '</span>',
          '<span class="play-dot">▶</span>',
          '</a>',
          '<div class="movie-card-body">',
          '<h2><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h2>',
          '<p>' + escapeHtml(movie.oneLine) + '</p>',
          '<div class="card-meta">',
          '<span>' + escapeHtml(movie.year) + '</span>',
          '<span>' + escapeHtml(movie.region) + '</span>',
          '<span>' + escapeHtml(movie.genre) + '</span>',
          '</div>',
          '</div>',
          '</article>'
        ].join("");
      }).join("");

      result.querySelectorAll("img").forEach(function (image) {
        image.addEventListener("error", function () {
          image.classList.add("is-missing");
        });
      });
    };

    var escapeHtml = function (value) {
      return String(value).replace(/[&<>"]/g, function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;"
        }[char];
      });
    };

    if (input) {
      input.addEventListener("input", render);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("is-active");
        });

        button.classList.add("is-active");
        activeFilter = button.getAttribute("data-filter") || "all";
        render();
      });
    });

    render();
  }
})();

(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var toggle = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-target]"));
        var minis = Array.prototype.slice.call(document.querySelectorAll("[data-hero-mini]"));
        if (!slides.length) {
            return;
        }
        var index = 0;
        function activate(next) {
            index = next;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                activate(Number(dot.getAttribute("data-hero-target")) || 0);
            });
        });
        minis.forEach(function (mini) {
            mini.addEventListener("mouseenter", function () {
                activate(Number(mini.getAttribute("data-hero-mini")) || 0);
            });
        });
        window.setInterval(function () {
            activate((index + 1) % slides.length);
        }, 5200);
    }

    function setupLocalFilters() {
        var forms = Array.prototype.slice.call(document.querySelectorAll(".local-filter"));
        forms.forEach(function (form) {
            var scope = form.closest("main") || document;
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".searchable-card"));
            var keywordInput = form.querySelector("input[name='keyword']");
            var yearSelect = form.querySelector("select[name='year']");
            var typeSelect = form.querySelector("select[name='type']");
            function apply() {
                var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
                var year = yearSelect ? yearSelect.value : "";
                var type = typeSelect ? typeSelect.value : "";
                cards.forEach(function (card) {
                    var haystack = [
                        card.getAttribute("data-title") || "",
                        card.getAttribute("data-region") || "",
                        card.getAttribute("data-genre") || "",
                        card.getAttribute("data-type") || "",
                        card.getAttribute("data-year") || ""
                    ].join(" ").toLowerCase();
                    var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var okYear = !year || card.getAttribute("data-year") === year;
                    var okType = !type || card.getAttribute("data-type") === type;
                    card.classList.toggle("is-hidden", !(okKeyword && okYear && okType));
                });
            }
            form.addEventListener("input", apply);
            form.addEventListener("change", apply);
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                apply();
            });
        });
    }

    function setupSearchPage() {
        var form = document.getElementById("search-page-form");
        var target = document.getElementById("search-results");
        if (!form || !target || !window.MOVIE_INDEX) {
            return;
        }
        var keywordInput = document.getElementById("search-keyword");
        var yearSelect = document.getElementById("search-year");
        var typeSelect = document.getElementById("search-type");
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        keywordInput.value = initial;
        function cardTemplate(item) {
            var tags = item.tags.slice(0, 3).map(function (tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            }).join("");
            return "<article class=\"movie-card\">" +
                "<a class=\"poster-link\" href=\"" + item.url + "\" aria-label=\"" + escapeHtml(item.title) + "\">" +
                "<img src=\"" + item.cover + "\" alt=\"" + escapeHtml(item.title) + "\">" +
                "<span class=\"poster-year\">" + item.year + "</span>" +
                "<span class=\"poster-type\">" + escapeHtml(item.type) + "</span>" +
                "</a>" +
                "<div class=\"movie-card-body\">" +
                "<div class=\"movie-meta-line\"><span>" + escapeHtml(item.region) + "</span><span>" + escapeHtml(item.category) + "</span></div>" +
                "<h3><a href=\"" + item.url + "\">" + escapeHtml(item.title) + "</a></h3>" +
                "<p>" + escapeHtml(item.description) + "</p>" +
                "<div class=\"tag-row\">" + tags + "</div>" +
                "</div>" +
                "</article>";
        }
        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, function (char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;",
                    "'": "&#39;"
                }[char];
            });
        }
        function render() {
            var keyword = keywordInput.value.trim().toLowerCase();
            var year = yearSelect.value;
            var type = typeSelect.value;
            var results = window.MOVIE_INDEX.filter(function (item) {
                var haystack = [
                    item.title,
                    item.region,
                    item.type,
                    item.genre,
                    item.category,
                    item.description,
                    item.tags.join(" ")
                ].join(" ").toLowerCase();
                var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var okYear = !year || String(item.year) === year;
                var okType = !type || item.type === type;
                return okKeyword && okYear && okType;
            }).slice(0, 120);
            target.innerHTML = results.map(cardTemplate).join("");
        }
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            render();
        });
        form.addEventListener("input", render);
        form.addEventListener("change", render);
        render();
    }

    window.initMoviePlayer = function (videoId, buttonId, shellId, url) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        var shell = document.getElementById(shellId);
        if (!video || !button || !shell || !url) {
            return;
        }
        var attached = false;
        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        }
        function play() {
            attach();
            shell.classList.add("is-playing");
            video.controls = true;
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }
        button.addEventListener("click", play);
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener("play", function () {
            shell.classList.add("is-playing");
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupLocalFilters();
        setupSearchPage();
    });
})();

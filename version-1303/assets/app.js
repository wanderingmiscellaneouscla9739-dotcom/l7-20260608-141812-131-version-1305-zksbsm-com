(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function getCardText(card) {
        return normalize([
            card.dataset.title,
            card.dataset.year,
            card.dataset.region,
            card.dataset.type,
            card.dataset.genre,
            card.dataset.tags,
            card.textContent
        ].join(" "));
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
            document.body.classList.toggle("is-menu-open", panel.classList.contains("is-open"));
        });
    }

    function setupHero() {
        var root = document.querySelector("[data-hero-carousel]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, pos) {
                slide.classList.toggle("is-active", pos === index);
            });
            dots.forEach(function (dot, pos) {
                dot.classList.toggle("is-active", pos === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.dataset.heroDot));
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

        root.addEventListener("mouseenter", function () {
            if (timer) {
                window.clearInterval(timer);
            }
        });

        root.addEventListener("mouseleave", restart);
        restart();
    }

    function renderSearchResults(input, panel, matches) {
        panel.innerHTML = "";
        if (!input.value.trim()) {
            panel.classList.remove("is-open");
            return;
        }
        matches.slice(0, 9).forEach(function (item) {
            var link = document.createElement("a");
            link.className = "search-result-item";
            link.href = item.url;

            var image = document.createElement("img");
            image.src = item.image;
            image.alt = item.title;
            image.loading = "lazy";

            var info = document.createElement("div");
            var title = document.createElement("strong");
            title.textContent = item.title;
            var meta = document.createElement("span");
            meta.textContent = [item.year, item.region, item.type, item.genre].filter(Boolean).join(" · ");
            var summary = document.createElement("span");
            summary.textContent = item.summary;

            info.appendChild(title);
            info.appendChild(meta);
            info.appendChild(document.createElement("br"));
            info.appendChild(summary);
            link.appendChild(image);
            link.appendChild(info);
            panel.appendChild(link);
        });
        panel.classList.toggle("is-open", matches.length > 0);
    }

    function setupSiteSearch() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-site-search]"));
        var index = window.SiteSearchIndex || [];
        inputs.forEach(function (input) {
            var holder = input.parentElement;
            var panel = holder ? holder.querySelector("[data-search-results]") : null;
            if (!panel) {
                return;
            }
            input.addEventListener("input", function () {
                var query = normalize(input.value);
                if (!query) {
                    renderSearchResults(input, panel, []);
                    return;
                }
                var terms = query.split(/\s+/).filter(Boolean);
                var matches = index.filter(function (item) {
                    var text = normalize([
                        item.title,
                        item.year,
                        item.region,
                        item.type,
                        item.genre,
                        item.summary
                    ].join(" "));
                    return terms.every(function (term) {
                        return text.indexOf(term) !== -1;
                    });
                });
                renderSearchResults(input, panel, matches);
            });
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    var first = panel.querySelector("a");
                    if (first) {
                        window.location.href = first.href;
                    }
                }
            });
            document.addEventListener("click", function (event) {
                if (!holder.contains(event.target)) {
                    panel.classList.remove("is-open");
                }
            });
        });
    }

    function setupCardFilters() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
        var state = {};

        function apply(scope) {
            var container = document.querySelector('[data-filter-container="' + scope + '"]');
            if (!container) {
                return;
            }
            var query = normalize(state[scope] && state[scope].query);
            var type = state[scope] && state[scope].type ? state[scope].type : "all";
            var cards = Array.prototype.slice.call(container.querySelectorAll(".movie-card, .compact-card"));
            cards.forEach(function (card) {
                var text = getCardText(card);
                var matchQuery = !query || query.split(/\s+/).every(function (term) {
                    return text.indexOf(term) !== -1;
                });
                var matchType = type === "all" || normalize(card.dataset.type).indexOf(normalize(type)) !== -1;
                card.classList.toggle("is-hidden", !(matchQuery && matchType));
            });
        }

        inputs.forEach(function (input) {
            var scope = input.dataset.filterScope;
            if (!scope) {
                return;
            }
            state[scope] = state[scope] || { query: "", type: "all" };
            input.addEventListener("input", function () {
                state[scope].query = input.value;
                apply(scope);
            });
        });

        Array.prototype.slice.call(document.querySelectorAll("[data-filter-chips]")).forEach(function (group) {
            var scope = group.dataset.filterChips;
            state[scope] = state[scope] || { query: "", type: "all" };
            group.addEventListener("click", function (event) {
                var button = event.target.closest("[data-card-filter]");
                if (!button) {
                    return;
                }
                state[scope].type = button.dataset.cardFilter;
                Array.prototype.slice.call(group.querySelectorAll("[data-card-filter]")).forEach(function (chip) {
                    chip.classList.toggle("is-active", chip === button);
                });
                apply(scope);
            });
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupSiteSearch();
        setupCardFilters();
    });
}());

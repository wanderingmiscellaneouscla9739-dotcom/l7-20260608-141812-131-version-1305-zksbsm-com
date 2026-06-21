(() => {
    const header = document.querySelector('[data-site-header]');
    const toggle = document.querySelector('[data-menu-toggle]');
    const panel = document.querySelector('[data-mobile-panel]');
    const backTop = document.querySelector('[data-back-top]');

    const refreshHeader = () => {
        if (header) {
            header.classList.toggle('is-scrolled', window.scrollY > 20);
        }
        if (backTop) {
            backTop.classList.toggle('is-visible', window.scrollY > 360);
        }
    };

    window.addEventListener('scroll', refreshHeader, { passive: true });
    refreshHeader();

    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            panel.classList.toggle('is-open');
        });
    }

    if (backTop) {
        backTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const hero = document.querySelector('[data-hero]');
    if (hero) {
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        let current = 0;
        let timer = null;

        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        };

        const start = () => {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(() => show(current + 1), 5200);
        };

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                show(index);
                start();
            });
        });

        if (slides.length) {
            show(0);
            start();
        }
    }

    document.querySelectorAll('[data-list-controls]').forEach((controls) => {
        const section = controls.parentElement;
        const list = section ? section.querySelector('[data-movie-list]') : null;
        if (!list) {
            return;
        }

        const cards = Array.from(list.querySelectorAll('[data-movie-card]'));
        const input = controls.querySelector('[data-search-input]');
        const chips = Array.from(controls.querySelectorAll('[data-filter]'));
        let activeFilter = 'all';
        let noResult = null;

        const getText = (card) => [
            card.dataset.title || '',
            card.dataset.tags || '',
            card.dataset.year || '',
            card.dataset.region || '',
            card.dataset.type || '',
            card.textContent || ''
        ].join(' ').toLowerCase();

        const refresh = () => {
            const keyword = input ? input.value.trim().toLowerCase() : '';
            let visible = 0;

            cards.forEach((card) => {
                const text = getText(card);
                const matchedKeyword = !keyword || text.includes(keyword);
                const matchedFilter = activeFilter === 'all' || text.includes(activeFilter.toLowerCase());
                const matched = matchedKeyword && matchedFilter;
                card.classList.toggle('is-filtered-out', !matched);
                if (matched) {
                    visible += 1;
                }
            });

            if (!noResult) {
                noResult = document.createElement('div');
                noResult.className = 'no-result';
                noResult.textContent = '没有找到匹配影片';
                list.appendChild(noResult);
            }
            noResult.style.display = visible ? 'none' : 'block';
        };

        if (input) {
            input.addEventListener('input', refresh);
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            if (query) {
                input.value = query;
            }
        }

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                activeFilter = chip.dataset.filter || 'all';
                chips.forEach((item) => item.classList.toggle('active', item === chip));
                refresh();
            });
        });

        refresh();
    });
})();

function initMoviePlayer(sourceUrl) {
    const video = document.getElementById('movie-video');
    const button = document.querySelector('[data-play-button]');
    if (!video || !button || !sourceUrl) {
        return;
    }

    let ready = false;
    let hls = null;

    const play = () => {
        button.classList.add('is-hidden');
        if (!ready) {
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = sourceUrl;
                ready = true;
                video.play().catch(() => {});
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(sourceUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    ready = true;
                    video.play().catch(() => {});
                });
                hls.on(window.Hls.Events.ERROR, (event, data) => {
                    if (data && data.fatal && hls) {
                        hls.destroy();
                        hls = null;
                        ready = false;
                    }
                });
            } else {
                video.src = sourceUrl;
                ready = true;
                video.play().catch(() => {});
            }
        } else {
            video.play().catch(() => {});
        }
    };

    button.addEventListener('click', play);
    video.addEventListener('click', () => {
        if (video.paused) {
            play();
        }
    });
}

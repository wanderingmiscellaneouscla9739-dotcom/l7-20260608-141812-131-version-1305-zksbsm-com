(function () {
  window.setupPlayer = function (videoId, url) {
    var video = document.getElementById(videoId);
    var button = document.querySelector('[data-player-button="' + videoId + '"]');
    var loaded = false;
    var hls = null;

    if (!video) {
      return;
    }

    var load = function () {
      if (loaded) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 60,
          enableWorker: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }

      loaded = true;
    };

    var play = function () {
      load();
      video.controls = true;

      if (button) {
        button.classList.add("is-hidden");
      }

      var promise = video.play();

      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    };

    if (button) {
      button.addEventListener("click", play);
    }

    video.addEventListener("click", function () {
      if (!loaded || video.paused) {
        play();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  };
})();

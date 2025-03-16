import "./style.css";
import Experience from "./Experience/Experience.js";

const experience = new Experience(document.querySelector(".experience-canvas"));

document.addEventListener("DOMContentLoaded", function () {
  const muteButton = document.getElementById("mute-button");
  const muteIcon = muteButton.querySelector("i");
  const tooltip = muteButton.querySelector(".tooltip");
  const volumeSlider = document.getElementById("volume-slider");
  const skipButton = document.getElementById("skip-button");
  const skipTooltip = document.querySelector(".skip-tooltip");
  let player;
  let songsArray = []; // To store the playlist
  let currentSongLine = ""; // Current song line
  let nextSongLine = ""; // Pre-calculated next song line

  // Cache the volume in percentage (default 100%)
  let cachedVolume = localStorage.getItem("cachedVolume")
    ? parseInt(localStorage.getItem("cachedVolume"), 10)
    : 100;
  volumeSlider.value = cachedVolume / 100;

  // Fetch the playlist file (each line: VIDEO_ID | Song Title)
  fetch("assets/playlist.txt")
    .then(response => response.text())
    .then(text => {
      songsArray = text.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);
      if (songsArray.length === 0) {
        console.error("Playlist is empty or could not be loaded.");
        return;
      }
      // Pre-calculate an initial next song
      nextSongLine = getRandomSongLine("");
      // Load an initial random song
      loadRandomSong();
    })
    .catch(error => console.error("Error loading playlist:", error));

  // Helper: choose a random song line (excluding a given line)
  function getRandomSongLine(excludeLine = "") {
    if (songsArray.length === 0) return "";
    let line;
    if (songsArray.length === 1) return songsArray[0];
    do {
      line = songsArray[Math.floor(Math.random() * songsArray.length)];
    } while (line === excludeLine);
    return line;
  }

  // Helper: extract song title from a line
  function extractSongTitle(line) {
    const parts = line.split("|");
    return parts[1] ? parts[1].trim() : line;
  }

  // Load a new song. If useNext is true, use the pre-calculated next song.
  function loadRandomSong(useNext = false) {
    let newLine;
    if (useNext && nextSongLine) {
      newLine = nextSongLine;
    } else {
      newLine = getRandomSongLine(currentSongLine);
    }
    currentSongLine = newLine;
    const parts = newLine.split("|");
    const videoId = parts[0].trim();
    const songTitle = extractSongTitle(newLine);

    // Update current song tooltip and document title
    tooltip.textContent = `Playing: ${songTitle}`;
    document.title = `Francisco Freitas - 🎵 ${songTitle}`;

    // Pre-calculate the next song (exclude the current)
    nextSongLine = getRandomSongLine(currentSongLine);
    const nextSongTitle = extractSongTitle(nextSongLine);
    skipTooltip.textContent = `Next: ${nextSongTitle}`;

    // Load the video into the YouTube player
    if (player && player.loadVideoById) {
      player.loadVideoById(videoId);
      setTimeout(() => {
        if (player && typeof player.setVolume === "function") {
          player.setVolume(cachedVolume);
        }
      }, 500);
    } else {
      loadYouTubePlayer(videoId);
    }
  }

  // Load YouTube IFrame API (if not loaded)
  function loadYouTubeAPI(callback) {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = callback;
  }

  // Create the YouTube player using the provided videoId
  function loadYouTubePlayer(videoId) {
    loadYouTubeAPI(function () {
      player = new YT.Player("youtube-player", {
        height: "0", // hidden player
        width: "0",
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          mute: 0
          // Loop removed to allow detecting video end.
        },
        events: {
          onReady: function (event) {
            event.target.playVideo();
            event.target.setVolume(cachedVolume);
          },
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.ENDED) {
              loadRandomSong();
            }
          }
        }
      });
    });
  }

  // Mute/Unmute functionality
  muteButton.addEventListener("click", function () {
    if (player) {
      if (player.isMuted()) {
        player.unMute();
        muteIcon.classList.replace("fa-volume-mute", "fa-volume-up");
      } else {
        player.mute();
        muteIcon.classList.replace("fa-volume-up", "fa-volume-mute");
      }
    }
  });

  // Volume slider control: update volume and save to localStorage
  volumeSlider.addEventListener("input", (e) => {
    if (player) {
      cachedVolume = e.target.value * 100;
      localStorage.setItem("cachedVolume", cachedVolume);
      player.setVolume(cachedVolume);
      if (cachedVolume === 0) {
        muteIcon.classList.replace("fa-volume-up", "fa-volume-mute");
      } else {
        muteIcon.classList.replace("fa-volume-mute", "fa-volume-up");
      }
    }
  });

  // Skip button: when clicked, load the pre-calculated next song.
  skipButton.addEventListener("click", function () {
    if (songsArray.length > 0) {
      loadRandomSong(true);
    }
  });
});

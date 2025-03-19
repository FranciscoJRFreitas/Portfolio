import "./style.css";
import Experience from "./Experience/Experience.js";

const experience = new Experience(document.querySelector(".experience-canvas"));

let isPaused = false;

// DOMContentLoaded event

const muteButton = document.getElementById("mute-button");
const muteIcon = muteButton.querySelector("i");
const tooltip = muteButton.querySelector(".tooltip");
const volumeSlider = document.getElementById("volume-slider");
const skipButton = document.getElementById("skip-button");
const skipTooltip = document.querySelector(".skip-tooltip");
let player;
let songsArray = [];
let currentSongLine = "";
let nextSongLine = "";

let cachedVolume = localStorage.getItem("cachedVolume")
  ? parseInt(localStorage.getItem("cachedVolume"), 10)
  : 100;
volumeSlider.value = cachedVolume / 100;

fetch("assets/playlist.txt")
  .then(response => response.text())
  .then(text => {
    songsArray = text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    nextSongLine = getRandomSongLine("");
    loadRandomSong();
  })
  .catch(error => console.error("Error loading playlist:", error));

function getRandomSongLine(excludeLine = "") {
  if (songsArray.length === 0) return "";
  let line;
  if (songsArray.length === 1) return songsArray[0];
  do {
    line = songsArray[Math.floor(Math.random() * songsArray.length)];
  } while (line === excludeLine);
  return line;
}

function extractSongTitle(line) {
  const parts = line.split("|");
  return parts[1] ? parts[1].trim() : line;
}

function loadRandomSong(useNext = false) {
  let newLine = useNext && nextSongLine ? nextSongLine : getRandomSongLine(currentSongLine);
  currentSongLine = newLine;
  const [videoId, songTitle] = newLine.split("|").map(s => s.trim());

  tooltip.textContent = `Playing: ${songTitle}`;
  document.title = `Francisco Freitas - 🎵 ${songTitle}`;

  nextSongLine = getRandomSongLine(currentSongLine);
  const nextSongTitle = extractSongTitle(nextSongLine);
  skipTooltip.textContent = `Next: ${nextSongTitle}`;

  if (player && player.loadVideoById) {
    player.loadVideoById(videoId);
    setTimeout(() => player.setVolume(cachedVolume), 500);
  } else {
    loadYouTubePlayer(videoId);
  }
}

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

function loadYouTubePlayer(videoId) {
  loadYouTubeAPI(function () {
    player = new YT.Player("youtube-player", {
      height: "0",
      width: "0",
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        mute: 0
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
          event.target.setVolume(cachedVolume);
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.ENDED) {
            loadRandomSong();
          }
        }
      }
    });
  });
}

muteButton.addEventListener("click", function () {
  if (player) {
    if (!isPaused) {
      player.pauseVideo();
      muteIcon.classList.replace("fa-volume-up", "fa-pause");
      tooltip.textContent = "Paused";
      isPaused = true;
    } else {
      player.playVideo();
      muteIcon.classList.replace("fa-pause", "fa-volume-up");
      tooltip.textContent = `Playing: ${extractSongTitle(currentSongLine)}`;
      isPaused = false;
    }
  }
});

volumeSlider.addEventListener("input", (e) => {
  if (player) {
    cachedVolume = e.target.value * 100;
    localStorage.setItem("cachedVolume", cachedVolume);
    player.setVolume(cachedVolume);
  }
});

skipButton.addEventListener("click", () => songsArray.length > 0 && loadRandomSong(true));

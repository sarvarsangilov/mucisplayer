// моё компонент в VUE

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 1</ion-title>
      </ion-toolbar>
    </ion-header>
    <IonContent class="ion-padding">
      <div class="player">
        <h2>{{ currentTrack.title }}</h2>
        <p>{{ currentTrack.artist }} — {{ currentTrack.album }}</p>
        <img v-if="currentTrack.cover" :src="currentTrack.cover" class="cover" />

        <!-- Управление -->
        <div class="controls">
          <IonButton @click="prevTrack">⏮</IonButton>
          <IonButton @click="togglePlay">
            <IonIcon :icon="playerState.isPlaying ? pauseIcon : playIcon" />
          </IonButton>
          <IonButton @click="nextTrack">⏭</IonButton>
        </div>

        <!-- Прогресс -->
        <IonRange
          min="0"
          :max="currentTrack.duration || 0"
          step="1"
          v-model="playerState.position"
          @ionChange="(e) => seek(e.detail.value)"
        >
          <IonLabel slot="start">{{ formatTime(playerState.position || 0) }}</IonLabel>
          <IonLabel slot="end">{{ formatTime(currentTrack.duration || 0) }}</IonLabel>
        </IonRange>

        <!-- Громкость -->
        <IonRange min="0" max="1" step="0.1" v-model="volume" @ionChange="setVolume">
          <IonLabel slot="start">🔈</IonLabel>
          <IonLabel slot="end">🔊</IonLabel>
        </IonRange>

        <!-- Плейлист -->
        <div class="playlist">
          <h3>📃 Плейлист</h3>
          <ul>
            <li
              v-for="(track, index) in playlist"
              :key="track.src"
              :class="{ active: index === currentIndex }"
              @click="playTrack(index)"
            >
              {{ track.title }} — {{ track.artist }}
            </li>
          </ul>
        </div>
      </div>
    </IonContent>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonRange,
  IonLabel,
} from "@ionic/vue";
import { MediaSessionControl } from "capacitor-media-session-control";
import { play, pause } from "ionicons/icons";

export default {
  name: "MusicPlayer",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonRange,
    IonLabel,
  },
  data() {
    return {
      playlist: [
        {
          title: "Deep Abstract Ambient_Snowcap",
          artist: "ummbrella",
          album: "Album Name",
          cover: "https://cdn.pixabay.com/audio/2025/09/08/17-14-54-371_200x200.jpeg",
          src:
            "https://cdn.pixabay.com/audio/2025/09/08/audio_3e2526c41c.mp3",
          duration: 0,
        },
        {
          title: "Retro Lounge",
          artist: "Bransboynd",
          album: "Album Name",
          cover: "https://cdn.pixabay.com/audio/2025/08/14/09-34-26-441_200x200.jpg",
          src:
            "https://cdn.pixabay.com/audio/2025/08/14/audio_c91b0e7d23.mp3",
          duration: 0,
        },
        {
          title: "Experimental Cinematic Hip-Hop",
          artist: "Rockot",
          album: "Album Name",
          cover: "https://cdn.pixabay.com/audio/2025/03/20/08-24-22-588_200x200.jpg",
          src:
            "https://cdn.pixabay.com/audio/2025/03/19/audio_91b4c0a3b6.mp3",
          duration: 0,
        },
        {
          title: "Jungle Waves (Drum&Bass Electronic Inspiring Promo)",
          artist: "DIMMYSAD",
          album: "Album Name",
          cover: "https://cdn.pixabay.com/audio/2025/05/21/12-47-01-748_200x200.jpg",
          src:
            "https://cdn.pixabay.com/audio/2025/05/21/audio_fa20813ea6.mp3",
          duration: 0,
        },
      ],
      currentIndex: 0,
      playerState: {
        position: 0,
        isPlaying: false,
      },
      volume: 1,
      audio: null,
      MediaSessionControlInit: false, // boolean вместо null
      positionUpdateInterval: null,
      playIcon: play,
      pauseIcon: pause,
    };
  },
  computed: {
    currentTrack() {
      return this.playlist[this.currentIndex];
    },
  },
  mounted() {
    this.loadTrack(this.currentIndex);

    this.setupMediaSessionListener();
  },
  beforeUnmount() {
    if (this.audio) {
      this.audio.pause();
    }
  },
  methods: {
    // Настройка listener'а MediaSession - вызывается только один раз
    setupMediaSessionListener() {
      MediaSessionControl.addListener("mediaSessionEvent", (event) => {
        console.log("mediaSessionEvent", JSON.stringify(event));

        switch (event.event) {
          case "play":
            this.handleExternalPlay();
            break;
          case "pause":
            this.handleExternalPause();
            break;
          case "stop":
            this.handleExternalStop();
            break;
          case "next":
            this.nextTrack();
            break;
          case "previous":
            this.prevTrack();
            break;
          case "seekTo":
            this.handleExternalSeek(event.position / 1000);
            break;
          case "notificationDismissed":
            console.log("Notification dismissed");
            break;
          case "appClosed":
            console.log("App closed");
            this.cleanup();
            break;
        }
      });
    },

    // Внешние события от MediaSession (не вызывают циклы)
    handleExternalPlay() {
      if (!this.playerState.isPlaying && this.audio) {
        this.audio.play();
        this.playerState.isPlaying = true;
        this.startPositionUpdates();
      }
    },

    handleExternalPause() {
      if (this.playerState.isPlaying && this.audio) {
        this.audio.pause();
        this.playerState.isPlaying = false;
        this.stopPositionUpdates();
      }
    },

    handleExternalStop() {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.playerState.isPlaying = false;
        this.playerState.position = 0;
        this.stopPositionUpdates();
      }
    },

    handleExternalSeek(position) {
      if (this.audio) {
        this.audio.currentTime = position;
        this.playerState.position = Math.floor(position);
      }
    },

    // Обычные методы плеера (внутренние вызовы)
    play() {
      if (!this.audio || this.playerState.isPlaying) return;

      console.log("Internal play");

      // Сначала инициализируем MediaSession если нужно
      if (!this.MediaSessionControlInit) {
        this.initMediaSession().then(() => {
          this.executePlay();
        });
      } else {
        this.executePlay();
      }
    },

    executePlay() {
      this.audio.play();
      this.playerState.isPlaying = true;
      this.startPositionUpdates();

      // Обновляем MediaSession без вызова команды play (избегаем цикла)
      this.updateMediaSessionState();
    },

    pause() {
      if (!this.audio || !this.playerState.isPlaying) return;

      console.log("Internal pause");
      this.audio.pause();
      this.playerState.isPlaying = false;
      this.stopPositionUpdates();

      // Обновляем MediaSession без вызова команды pause
      this.updateMediaSessionState();
    },

    // Инициализация MediaSession
    async initMediaSession() {
      try {
        await MediaSessionControl.init({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist,
          album: this.currentTrack.album,
          cover: this.currentTrack.cover,
          duration: this.currentTrack.duration * 1000,
          position: this.playerState.position * 1000,
          isPlaying: false, // всегда false при инициализации
          targetPage: "Tab1Page",
        });

        this.MediaSessionControlInit = true;
        console.log("MediaSession initialized");
      } catch (error) {
        console.error("Failed to init MediaSession:", error);
      }
    },

    // Обновление состояния MediaSession
    async updateMediaSessionState() {
      if (!this.MediaSessionControlInit) return;

      try {
        // Обновляем метаданные
        await MediaSessionControl.updateMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist,
          album: this.currentTrack.album,
          cover: this.currentTrack.cover,
          duration: this.currentTrack.duration * 1000,
        });

        // Обновляем состояние воспроизведения
        await MediaSessionControl.updatePlaybackState({
          state: this.playerState.isPlaying ? "playing" : "paused",
          position: this.playerState.position * 1000,
          playbackSpeed: this.playerState.isPlaying ? 1.0 : 0.0,
        });
      } catch (error) {
        console.error("Failed to update MediaSession:", error);
      }
    },

    // Управление обновлением позиции
    startPositionUpdates() {
      this.stopPositionUpdates(); // очищаем предыдущий таймер

      this.positionUpdateInterval = setInterval(() => {
        if (this.audio && this.playerState.isPlaying) {
          this.playerState.position = Math.floor(this.audio.currentTime);

          // Обновляем MediaSession каждые 5 секунд
          if (this.playerState.position % 5 === 0) {
            this.updateMediaSessionPosition();
          }
        }
      }, 1000);
    },

    stopPositionUpdates() {
      if (this.positionUpdateInterval) {
        clearInterval(this.positionUpdateInterval);
        this.positionUpdateInterval = null;
      }
    },

    async updateMediaSessionPosition() {
      if (!this.MediaSessionControlInit) return;

      try {
        await MediaSessionControl.updatePlaybackState({
          state: this.playerState.isPlaying ? "playing" : "paused",
          position: this.playerState.position * 1000,
          playbackSpeed: this.playerState.isPlaying ? 1.0 : 0.0,
        });
      } catch (error) {
        console.error("Failed to update position:", error);
      }
    },

    // Загрузка трека
    loadTrack(index) {
      const wasPlaying = this.playerState.isPlaying;

      if (this.audio) {
        this.audio.pause();
        this.stopPositionUpdates();
      }

      this.audio = new Audio(this.playlist[index].src);
      this.audio.volume = this.volume;
      this.playerState.position = 0;
      this.playerState.isPlaying = false;

      this.audio.addEventListener("loadedmetadata", () => {
        this.playlist[index].duration = Math.floor(this.audio.duration);
        this.updateMediaSessionState();
      });

      this.audio.addEventListener("timeupdate", () => {
        this.playerState.position = Math.floor(this.audio.currentTime);
      });

      this.audio.addEventListener("ended", () => {
        this.nextTrack();
      });

      this.audio.addEventListener("play", () => {
        this.startPositionUpdates();
      });

      this.audio.addEventListener("pause", () => {
        this.stopPositionUpdates();
      });

      // Если играло до этого, продолжаем играть новый трек
      if (wasPlaying) {
        this.$nextTick(() => {
          this.play();
        });
      } else {
        this.updateMediaSessionState();
      }
    },

    // Переключение воспроизведения
    togglePlay() {
      console.log("togglePlay");
      if (this.playerState.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    // Воспроизведение трека из плейлиста
    playTrack(index) {
      this.currentIndex = index;
      this.loadTrack(index);
      this.$nextTick(() => {
        this.play();
      });
    },

    // Предыдущий трек
    prevTrack() {
      console.log("prevTrack");
      this.currentIndex =
        (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadTrack(this.currentIndex);
      this.$nextTick(() => {
        this.play();
      });
    },

    // Следующий трек
    nextTrack() {
      console.log("nextTrack");
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.loadTrack(this.currentIndex);
      this.$nextTick(() => {
        this.play();
      });
    },

    // Перемотка (от slider'а)
    seek(position) {
      console.log("seek to:", position);
      if (this.audio) {
        this.audio.currentTime = position;
        this.playerState.position = Math.floor(position);
        this.updateMediaSessionPosition();
      }
    },

    // Установка громкости
    setVolume(event) {
      this.volume = event.detail.value;
      if (this.audio) {
        this.audio.volume = this.volume;
      }
    },

    // Очистка ресурсов
    cleanup() {
      this.stopPositionUpdates();
      if (this.audio) {
        this.audio.pause();
      }
      this.MediaSessionControlInit = false;
    },

    // Форматирование времени
    formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? "0" + s : s}`;
    },
  },

  // В beforeUnmount добавьте очистку
  beforeUnmount() {
    this.cleanup();
  },
};
</script>

<style scoped>
.player {
  text-align: center;
}
.controls {
  margin: 20px 0;
}
.cover {
  max-width: 200px;
  border-radius: 12px;
  margin: 10px 0;
}
.playlist {
  margin-top: 30px;
  text-align: left;
}
.playlist li {
  padding: 8px;
  cursor: pointer;
}
.playlist li.active {
  background: #3880ff;
  color: white;
  border-radius: 6px;
}
</style>

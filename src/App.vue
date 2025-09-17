<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { MediaSessionControl } from "capacitor-media-session-control";

export default {
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
  },
  mounted() {
    MediaSessionControl.addListener("mediaSessionEvent", (event) => {
      console.log("mediaSessionEvent", JSON.stringify(event));
      if (event.event === "openApp") {
        if (event.data?.targetPage) {
          this.$router.push({name: event.data.targetPage});
        }
        console.log("App opened from notification");
      } else if (event.event === "appClosed") {
        console.log("App closed");
      }
    });
  },
};
</script>

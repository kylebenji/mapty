"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const menu = document.querySelector(".menu");
const modalConfirm = document.querySelector("#modal-confirm");
const overlay = document.querySelector("#overlay");

class WorkoutStat {
  constructor(emoji, unit) {
    this.emoji = emoji;
    this.unit = unit;
  }

  calcDividedStat(numerat, denom) {
    return (numerat / denom).toFixed(2);
  }
}
const distance = new WorkoutStat("", "miles");
const duration = new WorkoutStat("⏱", "min");
const pace = new WorkoutStat("⚡️", "min/mile");
const cadence = new WorkoutStat("🦶🏼", "spm");
const speed = new WorkoutStat("⚡️", "mph");
const elevation = new WorkoutStat("🌄", "feet");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  description;
  // prettier-ignore
  static months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Oct","Nov","Dec",];

  constructor(coords, distanceIn, durationIn) {
    this.stats = new Map();
    this.coords = coords; //[lat,lng]
    this.stats.set(distance, distanceIn);
    this.stats.set(duration, durationIn);
  }

  getFormattedDate() {
    return `${Workout.months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  getHTML() {
    let innerHTML = "";

    this.stats.forEach(function (value, key) {
      innerHTML += `<div class="workout__details">
            <span class="workout__icon">${key.emoji}</span>
            <span class="workout__value">${value}</span>
            <span class="workout__unit">${key.unit}</span>
          </div>`;
    });

    return `<li class="workout workout--${this.type}" data-id="${this.id}">
          <h2 class="workout__title">${this.description}</h2>
          ${innerHTML}
          <button class="workout__delete">X</button>
        </li>`;
  }
}

class RunningWorkout extends Workout {
  type = "running";
  constructor(coords, distanceIn, durationIn, cadenceIn) {
    super(coords, distanceIn, durationIn);
    this.stats.set(pace, pace.calcDividedStat(durationIn, distanceIn));
    this.stats.set(cadence, cadenceIn);
    this.description = `Run on ${this.getFormattedDate()}`;
  }

  getPopupString() {
    return `🏃‍♂️${this.description}`;
  }
}

class CyclingWorkout extends Workout {
  type = "cycling";
  constructor(coords, distanceIn, durationIn, elevationIn) {
    super(coords, distanceIn, durationIn);
    this.stats.set(speed, speed.calcDividedStat(distanceIn, durationIn / 60));
    this.stats.set(elevation, elevationIn);
    this.description = `Cycle on ${this.getFormattedDate()}`;
  }

  getPopupString() {
    return `🚴‍♀️${this.description}`;
  }
}

class HikingWorkout extends Workout {
  type = "hiking";
  constructor(coords, distanceIn, durationIn, elevationIn) {
    super(coords, distanceIn, durationIn);
    this.stats.set(pace, pace.calcDividedStat(durationIn, distanceIn));
    this.stats.set(elevation, elevationIn);
    this.description = `Hike on ${this.getFormattedDate()}`;
  }

  getPopupString() {
    return `🚶‍♂️${this.description}`;
  }
}

class Mapty {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];

  constructor() {
    //get user position
    this.#getPosition();

    //get workouts from localStorage
    this.#getLocalStorage();

    //event listeners
    inputType.addEventListener("change", this.#toggleElevationField.bind(this));
    form.addEventListener("submit", this.#newWorkout.bind(this));
    containerWorkouts.addEventListener(
      "click",
      this.#panToOrDeleteWorkout.bind(this)
    );

    //modal event handlers
    menu.addEventListener("click", this.#menuHandler.bind(this));
    [
      overlay,
      modalConfirm.querySelector("#btn-modal-close"),
      modalConfirm.querySelector("#btn-modal-cancel"),
    ].forEach((el) => el.addEventListener("click", this.#toggleModal));
    modalConfirm
      .querySelector("#btn-modal-confirm")
      .addEventListener("click", this.#reset);
  }

  #getPosition() {
    //geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert("Could not find your position");
        }
      );
    }
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    //displaying map with leaflet
    this.#map = L.map("map").setView(coords, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#workouts.forEach((workout) => {
      this.#renderWorkoutMarker(workout);
    });

    this.#map.on("click", this.#showForm.bind(this));
  }

  #showForm(mapE) {
    //render workout form
    form.classList.remove("hidden");
    inputDistance.focus();
    this.#mapEvent = mapE;
  }

  #toggleElevationField(e) {
    const type = e.target.value;
    if (type === "hiking" || type === "cycling") {
      inputElevation
        .closest(".form__row")
        .classList.remove("form__row--hidden");
      inputCadence.closest(".form__row").classList.add("form__row--hidden");
    }
    if (type === "running") {
      inputElevation.closest(".form__row").classList.add("form__row--hidden");
      inputCadence.closest(".form__row").classList.remove("form__row--hidden");
    }
  }

  #centerMap() {
    const initCoords = [this.#workouts[0].coords, this.#workouts[1].coords];
    const coords = this.#workouts.map((workout) => workout.coords);
    let bounds = L.latLngBounds(coords);
    this.#map.flyToBounds(bounds);
  }

  #toggleModal() {
    //display confirmation window
    modalConfirm.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
    //actual reset is handled by event handlers added in constructor
  }

  #menuHandler(e) {
    if (e.target.classList.contains("center-map")) this.#centerMap();
    if (e.target.classList.contains("reset-workouts")) this.#toggleModal();
  }

  #newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp) || inp > 0);

    e.preventDefault();

    //get form information
    const type = inputType.value;
    const distanceIn = +inputDistance.value;
    const durationIn = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;

    //create workout object based on type of activity
    if (type === "running") {
      const cadenceIn = inputCadence.value;
      //validate data
      if (!validInputs(distanceIn, durationIn, cadenceIn))
        return alert("inputs have to be positive numbers");
      workout = new RunningWorkout(coords, distanceIn, durationIn, cadenceIn);
    }
    if (type === "cycling" || type === "hiking") {
      const elevationIn = inputElevation.value;
      //validate data
      if (!validInputs(distanceIn, durationIn, elevationIn))
        return alert("inputs have to be positive numbers");
      if (type === "cycling") {
        workout = new CyclingWorkout(
          coords,
          distanceIn,
          durationIn,
          elevationIn
        );
      }
      if (type === "hiking") {
        workout = new HikingWorkout(
          coords,
          distanceIn,
          durationIn,
          elevationIn
        );
      }
    }

    //add object to workout array
    this.#workouts.push(workout);

    //render workout to map as a marker
    this.#renderWorkoutMarker(workout);

    //render workout on the list
    this.#renderWorkoutSidebar(workout);

    //hide form and clear inputs
    this.#hideForm();

    //load local storage
    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    const markerOptions = {}; //add options for marker if wanted
    const popupOptions = {
      //settings for popup on map
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
      content: workout.getPopupString(),
    };
    const marker = L.marker(workout.coords, markerOptions)
      .addTo(this.#map)
      .bindPopup(L.popup(popupOptions))
      .openPopup();
    this.#markers.push(marker);
  }

  #renderWorkoutSidebar(workout) {
    const element = workout.getHTML();
    form.insertAdjacentHTML("afterend", element);
  }

  #hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  #panToOrDeleteWorkout(e) {
    //get the workout from the target
    const workoutLi = e.target.closest(".workout");
    if (!workoutLi) return;
    if (e.target.classList.contains(`workout__delete`)) {
      this.#deleteWorkout(workoutLi);
      return;
    }
    const id = workoutLi.dataset.id;
    let workout = this.#workouts.find((wo) => wo.id === id);
    //get the coordinates from the workout
    //use map.panTo to pan to the coordinates
    this.#map.panTo(workout.coords);
  }

  #deleteWorkout(workoutLi) {
    //get workout and HTML element
    const id = workoutLi.dataset.id;
    let workoutInd = this.#workouts.findIndex((wo) => wo.id === id);
    //remove workout from workouts object
    this.#workouts.splice(workoutInd, 1);
    //remove workout from sidebar
    workoutLi.remove();
    //remove pointer from map
    this.#markers[workoutInd].remove();
    this.#markers.splice(workoutInd, 1);
    //update local storage so it doesn't come back on reload
    this.#setLocalStorage();
  }

  #setLocalStorage() {
    localStorage.setItem(
      "workoutsMapty",
      JSON.stringify(this.#workouts, this.#replacer)
    );
  }

  #getLocalStorage() {
    const data = JSON.parse(
      localStorage.getItem("workoutsMapty"),
      this.#reviver
    );

    if (!data) return;
    //make the data back into the correct kinds of objects
    data.forEach((workout) => {
      if (workout.type === "running")
        this.#workouts.push(Object.assign(new RunningWorkout(), workout));
      if (workout.type === "cycling")
        this.#workouts.push(Object.assign(new CyclingWorkout(), workout));
      if (workout.type === "hiking")
        this.#workouts.push(Object.assign(new HikingWorkout(), workout));
    });

    this.#workouts.forEach((workout) => {
      this.#renderWorkoutSidebar(workout);
    });
  }

  #replacer(key, value) {
    if (value instanceof Map) {
      return {
        dataType: "Map",
        value: Array.from(value.entries()),
      };
    }
    return value;
  }

  #reviver(key, value) {
    if (typeof value === "object" && value !== null) {
      if (value.dataType === "Map") {
        return new Map(value.value);
      }
    }
    return value;
  }

  #reset() {
    localStorage.removeItem("workoutsMapty");
    location.reload();
  }
}

const mapty = new Mapty();

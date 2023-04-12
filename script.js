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

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance;
    this.duration = duration;
  }
}

class RunningWorkout extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = duration / distance; //min/mile
    this.description = `Run on ${this.date.toDateString()}`;
  }

  getPopupString() {
    return `🏃‍♂️${this.description}`;
  }

  getHTML() {
    return `<li class="workout workout--${this.type}" data-id="${this.id}">
          <h2 class="workout__title">${this.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${this.distance}</span>
            <span class="workout__unit">miles</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${this.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${this.pace.toFixed(1)}</span>
            <span class="workout__unit">min/mile</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${this.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
  }
}

class CyclingWorkout extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.speed = distance / (duration / 60); //mph
    this.description = `Cycle on ${this.date.toDateString()}`;
  }

  getPopupString() {
    return `🚴‍♀️${this.description}`;
  }

  getHTML() {
    return `<li class="workout workout--${this.type}" data-id="${this.id}">
          <h2 class="workout__title">${this.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🚴‍♀️</span>
            <span class="workout__value">${this.distance}</span>
            <span class="workout__unit">miles</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${this.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${this.speed.toFixed(1)}</span>
            <span class="workout__unit">mph</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🚵‍♀️</span>
            <span class="workout__value">${this.elevation}</span>
            <span class="workout__unit">feet</span>
          </div>
        </li>`;
  }
}

class Mapty {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //get user position
    this.#getPosition();

    //get workouts from localStorage
    this.#getLocalStorage();

    //event listeners
    inputType.addEventListener("change", this.#toggleElevationField.bind(this));
    form.addEventListener("submit", this.#newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this.#panToWorkout.bind(this));
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
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  #newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp) || inp > 0);

    e.preventDefault();

    //get form information
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;

    //create workout object based on type of activity
    if (type === "running") {
      const cadence = inputCadence.value;
      //validate data
      if (!validInputs(distance, duration, cadence))
        return alert("inputs have to be positive numbers");
      workout = new RunningWorkout(coords, distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = inputElevation.value;
      //validate data
      if (!validInputs(distance, duration, elevation))
        return alert("inputs have to be positive numbers");
      workout = new CyclingWorkout(coords, distance, duration, elevation);
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
    L.marker(workout.coords, markerOptions)
      .addTo(this.#map)
      .bindPopup(L.popup(popupOptions))
      .openPopup();
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

  #panToWorkout(e) {
    //get the workout from the target
    const workoutLi = e.target.closest(".workout");
    if (!workoutLi) return;
    const id = workoutLi.dataset.id;
    let workout = this.#workouts.find((wo) => wo.id === id);
    //get the coordinates from the workout
    //use map.panTo to pan to the coordinates
    this.#map.panTo(workout.coords);
  }

  #setLocalStorage() {
    localStorage.setItem("workoutsMapty", JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workoutsMapty"));

    if (!data) return;
    //make the data back into the correct kinds of objects
    data.forEach((workout) => {
      if (workout.type === "running")
        this.#workouts.push(Object.assign(new RunningWorkout(), workout));
      if (workout.type === "cycling")
        this.#workouts.push(Object.assign(new CyclingWorkout(), workout));
    });

    this.#workouts.forEach((workout) => {
      this.#renderWorkoutSidebar(workout);
    });
  }

  reset() {
    localStorage.removeItem("workoutsMapty");
    location.reload();
  }
}

const mapty = new Mapty();

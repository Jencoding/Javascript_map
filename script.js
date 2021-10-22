'use strict'

const form = document.querySelector('.form');
const containerExercises = document.querySelector('.exercises');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputRestTime = document.querySelector('.form__input--resttime');
const resetbutton = document.querySelector('.reset');

class Exercise {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    };

    _setDescription() {
        // prettier-ignore
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

        this.description = `${this.type.toUpperCase()} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;   
    };

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    };
    // Sometimes might be good to return this data in case someplace in our code need this.

    click() {
        this.clicks++
    };
}

class Running extends Exercise {
    type = "running";
    
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this._setDescription();
        this.calcSpeed();
    }
};

class Swimming extends Exercise {
    type = "swimming";

    constructor(coords, distance, duration, resttime) {
        super(coords, distance, duration);
        this.resttime = resttime;
        this._setDescription();
        this.calcSpeed();
    }
};

class App {
    #map;
    #mapEvent;
    #exercises = [];
    #mapZoomLevel = 12;


    constructor() {
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newExercise.bind(this));
        inputType.addEventListener('change', this._switchExerciseType);
        containerExercises.addEventListener('click', this._moveToPopup.bind(this));
        resetbutton.addEventListener('click', this.reset)
    };

    _getPosition() {
        if (navigator.geolocation) 
        // Make sure don't get errors in an old browser
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => alert('Cannot access to your location!'));
    };

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        

        this.#map.on('click', this._showForm.bind(this));

        this.#exercises.forEach(exercise => this._renderExerciseMarker(exercise));
        // _rederExerciseMarker has to be put after the map has been loaded, so put that logic in the method of _loadMap
    };

    _showForm(mapE) {
        // console.log(mapE);
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
        // It's inside of this event handler that gets access to the mapEvent, which will contain the coordinates. But don't need it here. So have to define the mapEvent as a global variable, and copy it to the event(mapE) in this handler function.
    };

    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputRestTime.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    };

    _switchExerciseType() {
        inputRestTime.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };


    _setLocalStorage() {
        localStorage.setItem('exercises', JSON.stringify(this.#exercises));
    };


    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('exercises'));
        if(!data) return;
        this.#exercises = data;
        this.#exercises.forEach(exercise => this._renderExercises(exercise));
        resetbutton.classList.remove('hidden');
    };

    _newExercise(e) {
        e.preventDefault();

        // Small helper functions
        const validInput = (...inputs) => inputs.every(input => Number.isFinite(input));
        const allPositive = (...inputs) => inputs.every(input => input > 0);

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let exercise;

        // If exercise is running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Check if data is valid
            if (!validInput(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
                return alert('Check your inputs again! Inputs have to be positive numbers.');
            };

            exercise = new Running([lat, lng], distance, duration, cadence);
            console.log(exercise.id);
        };

        // If exercise is swimming, create swimming object
        if (type === 'swimming') {
            const resttime = +inputRestTime.value;

            // Check if data is valid
            if (!validInput(distance, duration, resttime) || !allPositive(distance, duration)) {
                return alert('Check your inputs again! Inputs have to be positive numbers.')
            };

            exercise = new Swimming([lat, lng], distance, duration, resttime);
        };

        // Add new object to exercises array
        this.#exercises.push(exercise);
        console.log(exercise);

        // Render exercise on list
        this._renderExercises(exercise);

        // Render exercise on map as marker
        this._renderExerciseMarker(exercise);

        // Hide form + clear inputs
        this._hideForm();

        // Set local storage to all exercises
        this._setLocalStorage();

        resetbutton.classList.remove('hidden');

    };

    _renderExercises(exercise) {
        let html = `<li class="exercise exercise--${exercise.type}" data-id=${exercise.id}>
        <h2 class="exercise__title">${exercise.description}</h2>
        <div class="exercise__data>
        <h3 class="exercise__details>Distance</h3>
        <h4 class="exercise__value">${exercise.distance} KM</h4>
        </div>
        <div class="exercise__data>
        <h3 class="exercise__details>Duration</h3>
        <h4 class="exercise__value">${exercise.duration} MIN</h4>
        </div>`;

        if (exercise.type === "running") {
            html += `<div class="exercise__data>
            <h3 class="exercise__details>Speed</h3>
            <h4 class="exercise__value">${exercise.speed.toFixed(1)} km/hr</h4>
            </div>
            <div class="exercise__data>
            <h3 class="exercise__details>Cadence</h3>
            <h4 class="exercise__value">${exercise.cadence} min/km</h4>
            </div>
            </li>`
        };

        if (exercise.type === "swimming") {
            html += `<div class="exercise__data>
            <h3 class="exercise__details>Speed</h3>
            <h4 class="exercise__value">${exercise.speed.toFixed(1)} km/hr</h4>
            </div>
            <div class="exercise__data>
            <h3 class="exercise__details>Rest time</h3>
            <h4 class="exercise__value">${exercise.resttime} min</h4>
            </div>
            </li>`
        };

        form.insertAdjacentHTML("afterend", html);
    };

    _renderExerciseMarker(exercise) {
        L.marker(exercise.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${exercise.type}--popup`
            })).setPopupContent(`${exercise.description}`)
            .openPopup();

    };

    _moveToPopup(e) {
        const exerciseEl = e.target.closest('.exercise');
        console.log(exerciseEl); // The click is on the form, not on map

        if (!exerciseEl) return;

        // Find the element in the exercises array
        const exercise = this.#exercises.find(exer => exer.id === exerciseEl.dataset.id);
        console.log(this.#exercises);
        console.log(exercise);

        this.#map.setView(exercise.coords, this.#mapZoomLevel, {
            animation: true,
            pan: { duration: 1 }
        });

        // Using the public interface
        exercise.click();
    };

    reset() {
        localStorage.removeItem('exercises');
        location.reload(); // Reload the page programmatically
        resetbutton.style.display = 'none';
        resetbutton.classList.add('hidden');
    }
}

const app = new App();

# Functionality

- Can place pins on the map and record specific workout information on them
- can choose between a running and cycling workout
- scrolls to workouts from sidebar when clicking on specific workout
- saves workouts to localStorage so they are kept across reloads
- uses geolocation to determine approximate location of user so that the map can focus on them on start
- calculates speed or pace for the Run/Bike ride

## Tips

- If you want to reset the page you can use the mapty.reset() function in the console (hoping to move to UI in the future)

### Ideas for further functionality additions

- Add a delete workout button so a workout that was previously recorded can be removed
- add an edit workout button so workouts with already stored data can be updated
- add a public interface to delete all workouts and clear information
- add more types of workouts like hikes
- add sorting to workouts based on duration or distance
- make error messages and confirmations more built in rather than just an alert
- add ability to position the map to show all workouts
- add ability to draw lines and shapes and the like that are stored with individual workouts
- add ability to hide points on map with a button so you can declutter it
- Geocode location of run using 3rd party API and display that as part of the info
- display weather for run using 3rd party API

## Disclosure

- Mapty app created as part of Udemy Javascript course.
- HTML and CSS starter files provided by Jonas Schmedtmann, Javascript by me

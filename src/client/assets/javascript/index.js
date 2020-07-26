// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE
// The store will hold all information needed globally

const SERVER = 'http://localhost:8000';
var store = {
	track_id: undefined,
	track_name:undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

function updateStore(updates, cb) {
	store = {
		...store,
		...updates,
	}
	console.log("store updated", store)

	if (cb) {
		return cb(store)
	}

	return store
}

async function onPageLoad() {
	const page = window.location.href.split('/').pop()

	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCards(racers)
				renderAt('#racers', html)
			})
	}	
	catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			race()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("Something went wrong while delay", error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race
async function race() {

	try {
		// TODO - Get player_id and track_id from the store
		const player_id = store.player_id
		const track_id = store.track_id

		// check of we have a valid track_id and player_id
		if(!track_id || !player_id) {
			alert(`Please select track and racer to start the race!`);
			return;
		}

		// render starting UI
		renderAt('#race', renderRaceStartView())

		console.log('creating race')
		let race = await createRace(player_id, track_id);// TODO - invoke the API call to create the race, then save the result
		console.log('race created', race)

		// TODO - update the store with the race id
		
		console.log('starting countdown')
		// The race has been created, now start the countdown
		// TODO - call the async function runCountdown
		await runCountdown()
		console.log('countdown ended')

		console.log('starting race')
		// TODO - call the async function startRace
		await startRace(store.race_id)
		console.log('race started')

		console.log('run race')
		// TODO - call the async function runRace
		await runRace(store.race_id)
		console.log('race complete')
	} catch (error) {
		console.log("Error while starting the race flow",error); //not necessary
	}
}

async function runCountdown() {
	// wait for the DOM to load then run the countdown for 3 seconds
	try {
		await delay(1000)
		let timer = 3
		return new Promise(resolve => {
			// TODO - use Javascript's built in setInterval method to count down once per second
			let  counter = setInterval(() => {
				document.getElementById('big-numbers').innerHTML = --timer
				if (timer <= 0) {
					clearInterval(counter);
					resolve(); //it is resolved when the count finishes
					return;
				}
			}, 1000);
		})
	} catch (error) {
		console.log("Error while countdown",error);
	}
}

async function runRace(raceID) {
	try {
		return new Promise((resolve) => {
			const counter = setInterval(async () => {
				let raceInfo = await getRace(raceID)
				if (raceInfo.status === "in-progress") {
					renderAt('#leaderBoard', raceProgress(raceInfo.positions));
				}
				if (raceInfo.status === "finished") {
					clearInterval(counter);
					renderAt("#race", resultsView(raceInfo.positions));
					resolve(raceInfo);
				}
				/* 
				Previous code, Now all API calls at aggregated at the bottom
				await fetch(`${SERVER}/api/races/${raceID}`, {
					method: "GET",
					mode: "cors",
					})
					.then((res) => res.json())
					.then((res) => {
						if (res.status === "in-progress") {
							renderAt('#leaderBoard', raceProgress(res.positions));
						}
						if (res.status === "finished") {
							clearInterval(counter);
							renderAt("#race", resultsView(res.positions));
							resolve();
						}
					});
				}, 500);
				*/
			},500);
		})
	}
	catch (error) {
		console.log("ERROR: On getting races", error)
	}	
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track to the store
	updateStore({player_id : parseInt(target.id)});
}

function handleSelectTrack(target) {
	let track_name = target.innerHTML.substring(8,target.innerHTML.length-8);
	console.log("selected a track", target.id, target, track_name);
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	updateStore({track_id : target.id,track_name:track_name});
	
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// TODO - Invoke the API call to accelerate
	accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCards(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView() {
	return `
		<header>
			<h1>Race: ${store.track_name} </h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}
``
function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	console.log("positions", positions, store.player_id)
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3> ${p.final_position!=undefined?p.final_position:''} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	let node = null

	if (element.match(/^\./) != null) {
		node = document.getElementsByClassName(element.substring(1))
	}

	if (element.match(/^#/) != null) {
		node = document.getElementById(element.substring(1))
	}
	
	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------


function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call to each of the following API endpoints

async function getTracks() {
	return await fetch(`${SERVER}/api/tracks`, {
		...defaultFetchOpts()
	})
	.then((res) => res.json())
	.catch(err => console.log("Problem with getTracks request::", err));
}

async function getRacers() {
	return await fetch(`${SERVER}/api/cars`, {
		...defaultFetchOpts()
	})
	.then((res) => res.json())
	.catch(err => console.log("Problem with getRacers request::", err));
}

async function createRace(player_id, track_id) {
	// Request Body
	const body = {
		player_id: parseInt(player_id),
		track_id: parseInt(track_id)
	}

	return await fetch(`${SERVER}/api/races`, {
		...defaultFetchOpts(),
		method: 'POST',
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.then((res) => {
		updateStore({race_id : res.ID-1});
	})
	.catch(err => console.log("Problem with fetch races request::", err));
}

async function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return await fetch(`${SERVER}/api/races/${id}`, {
		...defaultFetchOpts()
	})
	.then((res) => res.json())
	.catch(err => console.log("Problem with getRaces request::", err));
}

async function startRace(id) {
	try {
		console.log("id is", id)
		return await fetch(`${SERVER}/api/races/${id}/start`, {
			...defaultFetchOpts(),
			method: 'POST',
		})		
	} catch (error) {
		console.log("Something went wrong to start the race", error)
	}	
}

async function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body, datatype, or cors needed for this request
	try {
		return await fetch(`${SERVER}/api/races/${id}/accelerate`, {
			...defaultFetchOpts(),
			method: "POST",
		})
	} catch (error) {
		console.log("Something went wrong on accelerate", error)
	}
}


window.DoggyDash = (function() {

	// initialize firebase
	function _initFirebase() {
		const config = {
		  apiKey: "AIzaSyCa33tJlLm6Ett6mnSR_WB6EUQ8XnrcARE",
		  authDomain: "dogdash-fd9ab.firebaseapp.com",
		  databaseURL: "https://dogdash-fd9ab.firebaseio.com",
		  storageBucket: "dogdash-fd9ab.appspot.com",
		  messagingSenderId: "65389533694"
		};
		firebase.initializeApp(config);	
	}
	_initFirebase();
	const DB = firebase.database();

	function getDogIdFromUser(user) {
		return DB.ref('/users/' + user.uid).once('value')
			.then(function(snapshot) {
				return snapshot.val();
			})
			.then(function(data){
				const dogId = data.dog;

				return dogId;
			});
	}

	function getDog(dogId) {
		return DB.ref('/dogs/' + dogId).once('value')
			.then((snapshot) => {
				return {
					data: snapshot.val(),
					dogId,
				};
			});
	}

	function addActivity(dogId, activityData, setCurrentActivity = true) {
		const dogRef = DB.ref().child('dogs').child(dogId);
		const activitiesRef = dogRef.child('activities');
		const activityId = activitiesRef.push().key;

		let promise;

		if (setCurrentActivity) {
			promise = dogRef.child('currentActivity').set(activityId);
		}
		else {
			promise = Promise.resolve();
		}
		
		return promise.then(() => {
				return activitiesRef.child(activityId).set(activityData);
			})
			.then(() => {
				return getDog(dogId);
			})
	}

	function updateActivity(dogId, activityData, activityId) {
		if (typeof activityId === "undefined") return;
		console.log('here')

		const dogRef = DB.ref().child('dogs').child(dogId);

		return dogRef.child('currentActivity').set(null)
			.then(() => {
				return dogRef.child('activities')
					.child(activityId)
					.child('properties')
					.update(activityData);
			})
			.then(() => {
				return getDog(dogId);
			})
	}

	function addNewUser(user, dogId) {
		// console.log(user.photoUrl)
		return DB.ref().child('/users/' + user.uid).set({
			dog: dogId,
			photo: user.photoURL,
			name: user.displayName,
			email: user.email
		});
	}

	function getUser(uid) {
		return DB.ref().child('/users'+uid).once('value')
			.then((snapshot) => {
				return snapshot.val();
			});
	}

	function getAllUsers() {
		return DB.ref().child('/users').once('value')
			.then((snapshot) => snapshot.val())
	}

	function addUserToDog(uid, dogId) {
		const dogRef = DB.ref().child('dogs').child(dogId);

		return dogRef.child('authorized_users').push(uid);
	}

	return {
		getDogIdFromUser,
		getDog,
		addActivity,
		updateActivity,
		addNewUser,
		addUserToDog,
		getUser,
		getAllUsers,
	};
})();
console.log(DoggyDash)
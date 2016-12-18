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

	function addActivity(dogId, activityData) {
		const dogRef = DB.ref().child('dogs').child(dogId);
		const activitiesRef = dogRef.child('activities');
		const activityId = activitiesRef.push().key;

		return dogRef.child('currentActivity').set(activityId)
			.then(() => {
				return activitiesRef.child(activityId).set(activityData);
			});
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
			});
	}

	return {
		getDogIdFromUser,
		getDog,
		addActivity,
		updateActivity,
	};
})();
console.log(DoggyDash)
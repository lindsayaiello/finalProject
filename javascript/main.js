// CALL FUNCTIONS

sideBar();
initFirebase();
authenticateFirebase()
	.then(function() {
		getUserInfo();
		buildAccountData();
	});


// DEFINE FUNCTIONS FOR THIS SITE

// sidebar functionality
function sideBar(whatToDo) {
	$(".button-collapse").sideNav(whatToDo);
}

// initialize firebase
function initFirebase() {
	const config = {
	  apiKey: "AIzaSyCa33tJlLm6Ett6mnSR_WB6EUQ8XnrcARE",
	  authDomain: "dogdash-fd9ab.firebaseapp.com",
	  databaseURL: "https://dogdash-fd9ab.firebaseio.com",
	  storageBucket: "dogdash-fd9ab.appspot.com",
	  messagingSenderId: "65389533694"
	};
	firebase.initializeApp(config);	
}


// log user in
function authenticateFirebase() {
	return firebase.auth().getRedirectResult()
		.then(function(result) {
			console.log(result)
		 	var user = result.user;
		 	// if user doesnt exist, let's log user in
		  	if (user === null) {
		  		logInUser();
		  	}

		  	return true;
		})
		.catch(function(error){
			// console.log('IN ERROR')
			// this means no user is logged in - let's log someone in
			// logInUser();
		});
} // firebaseAuth

// actually log in user
function logInUser() {
	var provider = new firebase.auth.FacebookAuthProvider();
	provider.addScope('user_birthday');
	firebase.auth().signInWithRedirect(provider);	
}

// pull in user data
function getUserInfo() {
	var user = firebase.auth().currentUser;
	var name, email, photoUrl, uid;
	console.log('###### USER')
	console.log(user, user.id)
	if (user != null) {
	  name = user.displayName;
	  email = user.email;
	  photoUrl = user.photoURL;
	  uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
	                   // this value to authenticate with your backend server, if
	                   // you have one. Use User.getToken() instead.
	  console.log(name, email, photoUrl)
	  

	  const userImgEl = $('.js-user-img');
	  userImgEl.attr('src', photoUrl);

	  const userNameEl = $('.js-user-name');
	  userNameEl.text(name);

	  const userEmailEl = $('.js-user-email');
	  userEmailEl.text(email);

	  sideBar('show')
	  
	}
}

function buildAccountData() {
	var user = firebase.auth().currentUser;

	firebase.database().ref('/users/' + user.uid).once('value')
		.then(function(snapshot) {
			return snapshot.val();
		})
		.then(function(data){
			// if nothing in there, user is logging in for first time
			if (data === null) {

			}
			// user has logged in before, load the activity feed
			else {

			}
		});
}









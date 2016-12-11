/* CURRENTLY IN: javascript/main.js */

// run UI functions
$(".button-collapse").sideNav();

const config = {
  apiKey: "AIzaSyCa33tJlLm6Ett6mnSR_WB6EUQ8XnrcARE",
  authDomain: "dogdash-fd9ab.firebaseapp.com",
  databaseURL: "https://dogdash-fd9ab.firebaseio.com",
  storageBucket: "dogdash-fd9ab.appspot.com",
  messagingSenderId: "65389533694"
};
firebase.initializeApp(config);

// Sign in using a redirect.
firebase.auth().getRedirectResult()
	.then(function(result) {
		console.log(result)
	 	var user = result.user;
	 	// if user doesnt exist, let's log user in
	  	if (user === null) {
	  		logInUser();
	  	}
	  	else {
	  		// user IS logged in, let's do other things...
	  		getUserInfo();
	  	}
	})
	.catch(function(error){
		// this means no user is logged in - let's log someone in
		logInUser();
		
	})

function logInUser() {
	var provider = new firebase.auth.FacebookAuthProvider();
	provider.addScope('user_birthday');
	firebase.auth().signInWithRedirect(provider);	
}

function getUserInfo() {
	var user = firebase.auth().currentUser;
	var name, email, photoUrl, uid;

	if (user != null) {
	  name = user.displayName;
	  email = user.email;
	  photoUrl = user.photoURL;
	  uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
	                   // this value to authenticate with your backend server, if
	                   // you have one. Use User.getToken() instead.
	  console.log(name, email, photoUrl)
	  $('.button-collapse').sideNav('show');

	  const userImgEl = $('.js-user-img');
	  userImgEl.attr('src', photoUrl);
	  
	}
}









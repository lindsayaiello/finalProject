// CALL FUNCTIONS

sideBar();
initFirebase();
authenticateFirebase()
	.then(function() {
		getUserInfo();
		buildAccountData();
	});


const views = {
	accountData: '.js-dog-info-form',
	feed: '.js-feed',
	spinner: '.js-spinner',
	startWalkCard: '.js-start-walk',
	startWalkBtn: '.js-start-walk-btn',
	endWalkBtn: '.js-end-walk-btn',
	reportCard: '.js-report-card'
};

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
	const user = firebase.auth().currentUser;
	let name, email, photoUrl, uid;
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

	  // sideBar('show')
	  
	}
}

function buildAccountData() {
	const user = firebase.auth().currentUser;

	firebase.database().ref('/users/' + user.uid).once('value')
		.then(function(snapshot) {
			return snapshot.val();
		})
		.then(function(data){
			$(views.spinner).addClass('section-hide')
			// if nothing in there, user is logging in for first time
			if (data === null) {
				// views.accountData is *actually* .js-dog-info-form
				$('.js-fixed-action-btn').hide();
				$(views.accountData).removeClass('section-hide');

			}
			// user has logged in before, load the activity feed
			else {
				populateFeed(user.uid);
			}
		});
}

function populateFeed(uid) {
	$(views.spinner).addClass('section-hide');
	$(views.feed).removeClass('section-hide');

	
	firebase.database().ref('/users/' + uid).once('value')
		.then(function(snapshot) {
			return snapshot.val();
		})
		.then(function(data){
			console.log(data)
			const dogId = data.dog;

			return dogId;
		})
		.then(function(dogId){
			return firebase.database().ref('/dogs/' + dogId).once('value')
		})
		.then(function(snapshot) {
			console.log(snapshot.val())
			const dog = snapshot.val()
			$('.js-dog-image').attr('src', dog.properties.dogImage)
		})

}

/*
	START THE UI EVENTS AND STUFF
*/


const accountSubmitButton = $('.js-account-submit');
accountSubmitButton.click(collectData);

function collectData(event) {
	console.log('click')

	const dogName = $('.js-dog-name').val();
	console.log(dogName)

	if (dogName === "") {
		$('.js-dog-name').addClass('invalid')
	}

	const dogBreed = $('.js-dog-breed').val();
	console.log(dogBreed)

	if (dogBreed === "") {
		$('.js-dog-breed').addClass('invalid')
	}

	const dogAge = $('.js-dog-age').val();
	console.log(dogAge)

	if (dogAge === "") {
		$('.js-dog-age').addClass('invalid')
	}

	const vetName = $('.js-vet-name').val() || "";
	console.log(vetName)

	const vetPhone = $('.js-vet-phone').val() || "";
	console.log(vetPhone)

	const microChip = $('.js-microchip').val() || "";
	console.log(microChip)

	const microChipHotLine = $('.js-microchip-hotline').val() || "";
	console.log(microChipHotLine)

	const dogImage = $('.js-file-image-preview').attr('src');

	$(views.accountData).addClass('section-hide');
	$(views.spinner).removeClass('section-hide');

	const user = firebase.auth().currentUser;

	const accountInfo = {
		owner: user.uid,
		properties: {
			dogName,
			dogBreed,
			dogAge,
			vetName,
			vetPhone,
			microChip,
			microChipHotLine,
			dogImage,
		}
		
	};

	const dogId = firebase.database().ref().child('dogs').push().key;
	firebase.database().ref('dogs/' + dogId).set(accountInfo)
		.then(function() {
			return firebase.database().ref('users/' + user.uid).set({
				dog: dogId
			})
		})
		.then(function() {
			$('.js-fixed-action-btn').show();
			populateFeed(user.uid)
		});
}
// question - do we need to link this object to MY account? 
// question - how can I allow for more than one authorized user?
// question - how do I attach the user uploaded image to object?
// question - can I use facebook API 'getFriends' to invite auth users?
// question - do I need to associate .keypress with my submits?
// question - use import datetime for your event timestamp?


const fileImageUpload = $('.js-file-image');
fileImageUpload.change(onFileAdded);
function onFileAdded(e) {
	console.log(e, e.currentTarget.files[0])
	const myFile = e.currentTarget.files[0];
	const reader = new FileReader();
	reader.onload = function (e) {
        console.log(e.target.result);
        $(".js-file-image-preview").attr('src', e.target.result)
    }
	const url = reader.readAsDataURL(myFile);  
	console.log(url)
}


const walkButton = $('.js-walk-btn');
walkButton.click(onWalkBtn);

function onWalkBtn(e) {
	$(views.feed).addClass('section-hide');
	$(views.startWalkCard).removeClass('section-hide');
	$(views.startWalkBtn).removeClass('section-hide');
	const user = firebase.auth().currentUser;
	
	firebase.database().ref('/users/' + user.uid).once('value')
		.then(function(snapshot) {
			return snapshot.val();
		})
		.then(function(data){
			console.log(data)
			const dogId = data.dog;

			return dogId;
		})
		.then(function(dogId){
			return firebase.database().ref('/dogs/' + dogId).once('value')
		})
		.then(function(snapshot) {
			console.log(snapshot.val())
			const dog = snapshot.val()
			$('.js-dog-name').text(dog.properties.dogName)
		})
}

const startBtnPress = $('.js-start-walk-btn');
startBtnPress.click(onBtnPress);

function onBtnPress(e) {
	$(views.startWalkBtn).addClass('section-hide');
	$(views.endWalkBtn).removeClass('section-hide');
}

const endBtnPress = $('.js-end-walk-btn');
endBtnPress.click(onEndBtnPress);

function onEndBtnPress(e) {
	$(views.startWalkCard).addClass('section-hide');
	$(views.reportCard).removeClass('section-hide');
}


	

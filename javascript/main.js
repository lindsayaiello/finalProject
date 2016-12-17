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

			// if nothing in there, user is logging in for first time
			if (data === null) {
				// views.accountData is *actually* .js-dog-info-form
				$(views.accountData).removeClass('section-hide');

			}
			// user has logged in before, load the activity feed
			else {

			}
		});
}

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

	const authUser1 = $('.js-auth-user-1').val();
	console.log(authUser1)

	if (authUser1 === "") {
		$('.js-auth-user-1').addClass('invalid')
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

	const accountInfo = {
		dogName,
		dogBreed,
		dogAge,
		authUser1,
		vetName,
		vetPhone,
		microChip,
		microChipHotLine,
		dogImage,
	};

	console.log(accountInfo)

	const user = firebase.auth().currentUser;

	firebase.database().ref('users/' + user.uid).set(accountInfo)
		.then(function() {
			console.log('data set!')
		})
}
// question - do we need to link this object to MY account? 
// question - how can I allow for more than one authorized user?
// question - how do I attach the user uploaded image to object?


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




// CALL FUNCTIONS

sideBar();
monitorUserAuthentication(function() {
	getUserInfo();
	buildAccountData();
    
       
});



// list of the views
const views = {
	accountData: '.js-dog-info-form',
	feed: '.js-feed',
	spinner: '.js-spinner',
	startWalkCard: '.js-start-walk',
	startWalkBtn: '.js-start-walk-btn',
	endWalkBtn: '.js-end-walk-btn',
	reportCard: '.js-report-card',
	submitWalkBtn: '.js-submit-walk',
	logMealCard: '.js-log-meal-card',
	logCommentCard: ".js-log-comment-card",
	closeStartWalkBtn:'.js-close-start-walk'
};

// DEFINE FUNCTIONS FOR THIS SITE

// sidebar functionality
function sideBar(whatToDo) {
	$(".button-collapse").sideNav(whatToDo);
}


// log user in
function authenticateFirebase() {
	return firebase.auth().getRedirectResult()
		.then(function(result) {
			console.log(result)
		 	var user = result.user;
		 	// if user doesnt exist, let's log user in
		  	if (user === null) {
		  		// console.log('user is NOT loggedin')
		  		logInUser();
		  	}

		  	return true;
		})
		.catch(function(error){
			// console.log('IN ERROR')
			// this means no user is logged in - let's log someone in
			logInUser();
		});
} // firebaseAuth

function monitorUserAuthentication(whatToDoIfUserSignedIn) {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			whatToDoIfUserSignedIn();
		}
		else {
			authenticateFirebase()
				.then(function() {
					whatToDoIfUserSignedIn();
				});
		}
	});	
}

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
	console.log(user, user.uid)
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
			if (window.location.search && data === null) {
				console.log( window.location.search )
				const paramsOnly = window.location.search.split('?').pop();
				const paramsObj = paramsOnly.split('&').reduce((hash, curr) => {
					const bits = curr.split('=');
					hash[bits[0]] = bits[1];

					return hash;
				}, {});

				const dogId = paramsObj.dogId;
				// firebase.database().ref('users/')
				DoggyDash.getDog(dogId)
					.then((obj) => {
						const {dogId, data} = obj;
						console.log(dogId, data, firebase.auth().currentUser)
						return DoggyDash.addNewUser(firebase.auth().currentUser, dogId)
							.then(() => {
								return {dogId, data, user: firebase.auth().currentUser};
							});
					})
					.then((obj) => {
						const {dogId, data, user} = obj;

						return DoggyDash.addUserToDog(user.uid, dogId);
					})
					.then(() => {
						populateFeed(user.uid);
						addToHomescreen();
					})
				
			}
			else if (data === null) {
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
	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			$(views.spinner).addClass('section-hide');

			const currentActivity = data.activities && data.activities[data.currentActivity];

			if (typeof currentActivity === "undefined" || currentActivity.actor !== uid) {
				displayInviteLink(dogId);

				buildFeed(data);
				if (data && data.properties && data.properties.dogImage) {
					$('.js-dog-image').attr('src', data.properties.dogImage);
				}

				setDogName(data.properties.dogName);
				$(views.feed).removeClass('section-hide');
			}
			else {
				$(views.startWalkBtn).addClass('section-hide');
				$(views.endWalkBtn).removeClass('section-hide');

				setDogName(data.properties.dogName);
				$('.js-walk-greeting').text('Going for a walk with');
				
				$(views.startWalkCard).removeClass('section-hide');
			}
		});
} // populateFeed

function setDogName(name) {
	// 
	$('.js-dog-name').text(name);
	// grab last character in name
	const lastCharacter = name.slice(-1);
	console.log("#########", lastCharacter)
	// if it has an 's', use '
	// otherwise, use 's
	if (lastCharacter === 's'){
		$('.js-dog-name-check-plural').text(name+"'")

	}
	else{
		$('.js-dog-name-check-plural').text(name+"'s")
	}

	// set .js-dog-name-check-plural to plural name
	
}

function buildFeed(data) {
	console.log(data, firebase.auth().currentUser)
	const dataAsArr = Object.keys(data.activities || {}).reduce((arr, curr) => {
		arr.push(data.activities[curr]);
		return arr;
	}, []).reverse();


	console.log('BUILDFEED', data)
	if (dataAsArr.length === 0) return;

	const feed = $(views.feed).find('.collection');
	feed.html('');
	DoggyDash.getAllUsers()
		.then((allUsers) => {

			const userIds = Object.keys(data.authorized_users || {})
				.reduce((arr, user) => {
					arr.push(data.authorized_users[user]);
					return arr;
				}, [data.owner])
				.reduce((hash, current) => {
					hash[ current ] = allUsers[ current ];
					return hash;
				}, {});

			console.log(userIds);

			const authenticatedUser = firebase.auth().currentUser;

			dataAsArr.forEach(drawFeedItem);

			function drawFeedItem(currentFeedItem) {
				console.log(currentFeedItem)

				const currentUser = userIds[currentFeedItem.actor];
				let userName;
				if (currentUser.email === authenticatedUser.email) {
					userName = 'You'
				}
				else {
					userName = currentUser.name;
				}

				const startTime = moment(currentFeedItem.properties.start_time)
					.format('MMMM Do, h:mm a');

				const timeDiff = moment.duration(currentFeedItem.properties.end_time - currentFeedItem.properties.start_time).humanize();;

				const walkComments = currentFeedItem.properties.comment;

				let icons;
				let feedHTML;

				if (currentFeedItem.type === 'walk') {
					const peeIcon = (currentFeedItem.properties.hasPeed) ? '<img class="small-img" src="assets/pee emoji.png">' : '';

					const poopIcon = (currentFeedItem.properties.hasPooped) ? '<img class="small-img" src="assets/poop emoji.png">' : '';


					feedHTML = `
<li class="collection-item avatar">
	<img src="${currentUser.photo}" alt="#!user" class="js-user-img circle">
	<h5>
		<span class="black-text name">${userName}</span> took 
		<span>${data.properties.dogName}</span> 
		for a 
		<span>${currentFeedItem.type}</span>
	</h5>
	<p>${startTime} for ${timeDiff}</p>
	<br>
	<h6>${walkComments}</h6>
	<a href="#!" class="secondary-content">
		${peeIcon} ${poopIcon}
	</a>
</li>
					`;
				}
				else if (currentFeedItem.type === 'meal') {
					const waterIcon = (currentFeedItem.properties.hasWater) ? '<img class="small-img" src="assets/water emoji.png">' : '';

					const mealIcon = (currentFeedItem.properties.hasMeal) ? '<img class="small-img" src="assets/food emoji.png">' : '';
					
					feedHTML = `
<li class="collection-item avatar">
	<img src="${currentUser.photo}" alt="#!user" class="js-user-img circle">
	<h5>
		<span class="black-text name">${userName}</span> fed 
		<span>${data.properties.dogName}</span> 
		a 
		<span>${currentFeedItem.type}</span>
	</h5>
	<p>at ${startTime}</p>
	<br>
	<h6>${walkComments}</h6>
	<a href="#!" class="secondary-content">
		${waterIcon} ${mealIcon}
	</a>
</li>
					`;
				}

				else if (currentFeedItem.type === 'notes') {
					const pencilIcon = (currentFeedItem.properties.comment) ? '<img class="small-img" src="assets/pencil emoji.png">' : '';
					
					feedHTML = `
<li class="collection-item avatar">
	<img src="${currentUser.photo}" alt="#!user" class="js-user-img circle">
	<h5>
		<span class="black-text name">${userName}</span> left some 
		<span>${currentFeedItem.type}</span>
		about 
		<span>${data.properties.dogName}</span> 
	</h5>
	<p>at ${startTime}</p>
	<br>
	<h6>${walkComments}</h6>
	<a href="#!" class="secondary-content">
		${pencilIcon} 
	</a>
</li>
					`;
				}

				feed.append(feedHTML)
			}


		});

}



/*
	START THE UI EVENTS AND STUFF
*/

// BUILDING THE ACCOUNT DATA

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
	displayInviteLink(dogId);

	firebase.database().ref('dogs/' + dogId).set(accountInfo)
		.then(function() {
			return DoggyDash.addNewUser(user, dogId);
		})
		.then(function() {
			$('.js-fixed-action-btn').show();
			populateFeed(user.uid)
		});
}

function displayInviteLink(dogId) {
	$('.js-invite-users').val(window.location.origin + window.location.pathname + '?dogId=' + dogId);
	$('.js-invite-users').next().addClass('active')
	$('.js-copy-link').val(window.location.origin + window.location.pathname + '?dogId=' + dogId)
}
	

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


// INVITE OTHERS TO YOUR DOG DASH

$('.js-copy-link').click(function() {
	$(this).select();
});

$('#modal1').modal();

// SHARE DOG DASH WITH OTHERS

$('#modal2').modal();

// MY ACCOUNT DATA

$('#modal3').modal();


// LOGGING A WALK
const walkButton = $('.js-walk-btn');
walkButton.click(onWalkBtn);

;

function onWalkBtn(e) {
	$(views.feed).addClass('section-hide');
	$(views.endWalkBtn).addClass('section-hide');
	$(views.startWalkCard).removeClass('section-hide');
	$(views.startWalkBtn).removeClass('section-hide');
	$(views.closeStartWalkBtn).removeClass('section-hide');
	const user = firebase.auth().currentUser;
	
	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			setDogName(data.properties.dogName);
		})


const closeStartWalkBtn = $('.js-close-start-walk');
closeStartWalkBtn.click(onStartWalkX);
	
	function onStartWalkX(e) {
		$(views.startWalkCard).addClass('section-hide');
		$(views.feed).removeClass('section-hide');

	}

}



const startBtnPress = $('.js-start-walk-btn');
startBtnPress.click(onStartWalkBtnPress);

function onStartWalkBtnPress(e) {
	const currentElement = $(this);
	currentElement.attr('disabled', 'disabled');
	$(views.closeStartWalkBtn).addClass('section-hide');
	$(views.endWalkBtn).removeClass('section-hide');


	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			const activity = {
				type: 'walk',
				properties: {
					start_time: Date.now(),
				},
				actor: firebase.auth().currentUser.uid,
			};

			return DoggyDash.addActivity(dogId, activity);
		})
		.then(function() {
			$(views.startWalkBtn).addClass('section-hide');
			$(views.endWalkBtn).removeClass('section-hide');

			$('.js-walk-greeting').text('Going for a walk with');
			currentElement.removeAttr('disabled');
		})

}

const endBtnPress = $('.js-end-walk-btn');
endBtnPress.click(onEndBtnPress);

function onEndBtnPress(e) {
	$(views.startWalkCard).addClass('section-hide');
	$(views.reportCard).removeClass('section-hide');

}

// COLLECTING WALK DATA
const submitBtnPress = $('.js-submit-walk');
submitBtnPress.click(collectWalkData);

function collectWalkData(e) {

	const isPee = $('.js-walk-pee').is(':checked');
	const isPoop = $('.js-walk-poop').is(':checked');
	const comment = $('.js-walk-comment').val() || "";
	const endTime = Date.now();

	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			console.log(dogId, data)

			const currentActivity = data.currentActivity;
			const activity = data.activities[currentActivity];
			const activityObj = {
				hasPeed: isPee,
				hasPooped: isPoop,
				comment: comment,
				end_time: endTime,
			};

			if (typeof activity === "undefined") {
				$(views.feed).removeClass('section-hide');
				$(views.startWalkCard).addClass('section-hide');
			}

			$('.js-walk-pee').attr('checked', false);
			$('.js-walk-poop').attr('checked', false);
			$('.js-walk-comment').val('');

			if (!comment) {
				alert('How did it go?');
				return;
			}

			$('.js-dog-image').attr('src', data.properties.dogImage);

			console.log(dogId, activityObj, currentActivity)
			return DoggyDash.updateActivity(dogId, activityObj, currentActivity);
		})
		.then((object) => {
			const {dogId, data} = object;
			buildFeed(data)
			$(views.reportCard).addClass('section-hide');
			$(views.feed).removeClass('section-hide');
		});
}

// LOGGING A MEAL
const mealButton = $('.js-meal-btn');
mealButton.click(onMealBtn);

function onMealBtn(e) {
	$(views.feed).addClass('section-hide');
	$(views.logCommentCard).addClass('section-hide');
	$(views.logMealCard).removeClass('section-hide');

const closeLogMealBtn = $('.js-close-log-meal');
closeLogMealBtn.click(onLogMealX);
	
	function onLogMealX(e) {
		$(views.logMealCard).addClass('section-hide');
		$(views.feed).removeClass('section-hide');
	}	
}

const submitMealBtnPress = $('.js-submit-meal');
submitMealBtnPress.click(collectMealData);

function collectMealData(e) {

	const isWater = $('.js-meal-water').is(':checked');
	const isMeal = $('.js-meal-meal').is(':checked');
	const comment = $('.js-meal-comment').val() || "";
	const start_time = Date.now();
	console.log(isWater, isMeal, comment, start_time);

	$('.js-meal-water').attr('checked', false);
	$('.js-meal-meal').attr('checked', false);
	$('.js-meal-comment').val('');

	if (!isWater && !isMeal) {
		alert('Choose snack type!');
		return;
	}


	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			console.log(dogId, data)

			const activity = {
				type: 'meal',
				properties: {
					start_time: start_time,
					hasWater: isWater,
					hasMeal: isMeal,
					comment: comment,
				},
				actor: firebase.auth().currentUser.uid,
			};

			return DoggyDash.addActivity(dogId, activity, false);
		})
		.then((object) => {
			const {dogId, data} = object;
			buildFeed(data)
			$(views.feed).removeClass('section-hide');
			$(views.logMealCard).addClass('section-hide');
		});

	
}


// LOGGING A COMMENT

const commentButton = $('.js-comment-btn');
commentButton.click(onCommentBtn);

function onCommentBtn(e) {
	$(views.feed).addClass('section-hide');
	$(views.logMealCard).addClass('section-hide');
	$(views.logCommentCard).removeClass('section-hide');

const closeCommentBtn = $('.js-close-log-comment');
closeCommentBtn.click(onLogCommentX);
	
	function onLogCommentX(e) {
		$(views.logCommentCard).addClass('section-hide');
		$(views.feed).removeClass('section-hide');
	}	
}

const submitCommentBtnPress = $('.js-submit-comment');
submitCommentBtnPress.click(collectCommentData);

function collectCommentData(e) {

	const comment = $('.js-comment-comment').val() || "";
	const start_time = Date.now();
	console.log(comment, start_time);

	$('.js-comment-comment').val('');

	if (!comment === "") {
		alert('awww, belly rub please?!');
		return;
	}


	DoggyDash
		.getDogIdFromUser(firebase.auth().currentUser)
		.then((dogId) => DoggyDash.getDog(dogId))
		.then(function(object) {
			const {dogId, data} = object;
			console.log(dogId, data)

			const activity = {
				type: 'notes',
				properties: {
					start_time: start_time,
					comment: comment,
				},
				actor: firebase.auth().currentUser.uid,
			};

			return DoggyDash.addActivity(dogId, activity, false);
		})
		.then((object) => {
			const {dogId, data} = object;
			buildFeed(data)
			$(views.feed).removeClass('section-hide');
			$(views.logCommentCard).addClass('section-hide');
		});


	
	
}

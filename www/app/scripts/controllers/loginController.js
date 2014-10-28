// --------------------------------------
// ------ The login module.
// Setup as a factory / service.
// As it's used between controllers.
// --------------------------------------

function loginModule($rootScope,$http,$cookies,$cookieStore,$timeout,$store,ENV) {

	// $store is our localstorage object.

	var COOKIE_STORE_KEY = 'userprops';

	this.username = '';
	this.session = '';
	this.sessionpack = {
		username: '',
		session: '',
	};
	this.status = false;	// What's the login status?
	
	// A centralized way to broadcast the login status.
	this.broadcastLoginStatus = function(status) {

		// Give a tiny delay, so that child scopes can be instantiated.
		// ...that was causing me a bunch of trouble.

	    $timeout(function(){
	       $rootScope.$broadcast('loginStatus',status);
	    }, 100);

	};

	var broadcastLoginStatus = this.broadcastLoginStatus;

	// Submit a login attempt to the API
	// returns false if the attempt failed, true otherwise.

	this.submitAttempt = function(loginform,callback) {

		// console.log("!trace loginform?",loginform);

		$http.post(ENV.api_url + '/api/login', loginform)	
			.success(function(data) {
				
				// Ok.... callback with the result.
				console.log("!trace LOGIN AJAX: ",data);

				if (data.session) {
					
					this.setLoggedIn(loginform.email,data.session,function(){
						broadcastLoginStatus(true);
						callback(true);
					});

				} else {

					this.setLoggedOut(function(){
						callback(false);
					});
					
				}
			}.bind(this))
			.error(function(data) {
			
				// Couldn't reach the api, seems.
				this.setLoggedOut(function(){
					callback(false);
				});

			}.bind(this));	

	};

	// This bad boy happens on page refresh / initial page load.
	// So anything you have in cookies is going to come through here, first.

	this.validateSession = function(callback) {

		var userprops = {
			admin: $store.get('userprops_admin'),
			operator: $store.get('userprops_operator'),
		};

		if ($store.get('username')) {
			if ($store.get('session')) {
				
				// Ok, now call up the API.
				$http.post(ENV.api_url + '/api/validateSession', { session: { username: $store.get('username'), session: $store.get('session') } })
					.success(function(data){

						// console.log("!trace return from validateSession? ",data);

						// Nice, are they really verified?
						if (data.valid) {

							// Great!
							this.setLoggedIn($store.get('username'),$store.get('session'),function(){
							
								broadcastLoginStatus(true);
								callback(true);
							
							}.bind(this));

						} else {

							// Nope, that's no good.
							this.setLoggedOut(function(){
								callback(false);
							});
							
						}

					}.bind(this)).error(function(data){

						// That failed.
						this.setLoggedOut(function(){
							callback(false);
						});
						

					}.bind(this));

			} else {
				callback(false);
			}
		} else {
			callback(false);
		}


	};

	this.setLoggedIn = function(email,session,callback) {

		// Keep that login status.
		this.status = true;

		// Ok, that's good, we can set what we need here.
		// Now set our session cookie.
		$store.set('session',session);
		$store.set('username',email);

		// And keep our object properties.
		this.username = email;
		this.session = session;
		
		// We pack some of these together for a handy "session pack"
		this.setSessionPack();

		// Pretty handy.
		// console.log("!trace | session: %s | username: %s | admin: %s | operator: %s",this.username,this.session,this.admin,this.operator);

		// Little console info.
		console.log("!trace Successful login with session: ",$store.get('session'));
		// console.log("!trace Successful admin: ",$store.get('admin'));

		// Send an event.
		
		callback();

	};

	this.setSessionPack = function() {
		this.sessionpack = {
			username: $store.get('username'),
			session: $store.get('session'),
		};
	};

	this.setLoggedOut = function(callback) {

		// Keep that logged-out status.
		this.status = false;

		// Rest everything.
		$store.set('session','');
		$store.set('username','');
		
		this.username = '';
		this.session = '';
		
		broadcastLoginStatus(false);
		callback();

	};

}

bowlineApp.factory('loginModule', ["$rootScope", "$http", "$cookies", "$cookieStore", "localStorageService", "$timeout", 'ENV', function($rootScope,$http,$cookies,$cookieStore,localStorageService,$timeout,ENV) {
	return new loginModule($rootScope,$http,$cookies,$cookieStore,$timeout,localStorageService,ENV);
}]);

bowlineApp.controller('loginController', ['$scope', '$location', '$http', 'loginModule', 'ENV', function($scope,$location,$http,login,ENV) {

	console.log("!trace login controller instantiated.");
	console.log("!trace login controller ENV: ",ENV.api_url);
	console.log("!trace login controller status: ",login.status);

	// Let's check their login status.
	$scope.page_loaded = false;

	// Try to validate via session.
	login.validateSession(function(status){
		// console.log("!trace login returned, wewwwt: " + status);
		switch (ENV.name) {
			case "development":
			case "mobile":
				if (status) {
					$location.path("matchinbox");
				}
				break;
			
		}
		
		$scope.page_loaded = true;
	});

	$scope.clickLogin = function() {

		// console.log("!trace click login data: ",$scope.loginForm);

		login.submitAttempt($scope.loginForm,function(sessionid){

			if (sessionid) {
				// Successful login!!!
				// Reset any previous errors.
				$scope.loginfailure = false;

					switch (ENV.name) {
						case "development":
						case "mobile":
							$location.path("matchinbox");
							break;

						default:				
							$location.search('initiallogin', 'true');
							$location.path("home");
							break;

					}

			} else {
				// Welp. That's a failure.
				$scope.loginfailure = true;
			}

		});


	};


}]);



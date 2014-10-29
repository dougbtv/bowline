/* global bowlineApp */
/* global $ */

bowlineApp.controller('registerController', ['$scope', '$location', '$http', '$timeout', '$interval', '$cookies', 'loginModule', 'ENV', 
	function($scope,$location,$http,$timeout,$interval,$cookies,login,ENV) {

	// Just scroll to the top.
	$("body,html").animate({scrollTop: 0}, "slow");

	// Initialize the user.
	$scope.user = {
		email: "",
		password: "",
		passwordverify: "",
	};

	// Check out if this is for a password reset.
	var loc = $location.search();
	if (typeof loc.resetpass != 'undefined') {
		// Ok, we're in a password reset mode.
		$scope.registration_phase = "resetpass";

	}

	$scope.show_forgotpass_text = false;
	if (typeof loc.forgot != 'undefined') {
		// Ok, we're in a password reset mode.
		$scope.registration_phase = "forgot";
		$scope.show_forgotpass_text = true;
	}

	$scope.show_terms = false;

	$scope.showTerms = function() {
		$scope.show_terms = !$scope.show_terms;
	};

	$scope.forgotPassword = function() {

		// Reset error conditions
		$scope.user.error_email = false;
		$scope.user.error_emailunknown = false;

		// Let's verify
		if ($scope.validateEmail($scope.user.email)) {

			// Now, check if we really know that person.
			// If we do, they'll get an email.
			$http.post(ENV.api_url + '/api/forgotpassword', { email: $scope.user.email })
				.success(function(data){

					if (typeof data.error === 'undefined') {
						// That looks like a success.
						$scope.registration_phase = "complete";
					} else {
						// Looks like we don't know that email address.
						$scope.user.error_emailunknown = true;						
					}

				}.bind(this)).error(function(data){

					console.log("ERROR: Too bad, couldn't get data from set password API call");

				}.bind(this));


		} else {
			// Let 'em know that's not a real email address.
			$scope.user.error_email = true;
		}

	};


	$scope.resetPassword = function() {

		// Set default error conditions on each attempt.
		$scope.user.error_passwordshort = false;
		$scope.user.error_passwordmismatch = false;

		// Ok, let's validate that password.
		if ($scope.user.password.length > 5) {

			if ($scope.user.password == $scope.user.passwordverify) {

				// That looks really good so far.
				// Now we'll let the API see if it's for real.
				$http.post(ENV.api_url + '/api/setpassword', { email: loc.email, resetkey: loc.resetpass, password: $scope.user.password })
					.success(function(data){

						if (typeof data.error === 'undefined') {
							// That looks like a success.
							$scope.registration_phase = "passwordresetcomplete";

							// Let's try to log them in, now.
							login.setLoggedIn(loc.email,data.session,data.admin,data.operator,data.fulluser,function(){
								
								// Now that they're logged in, bring 'em to the home page?
								// !bang

								login.broadcastLoginStatus(true);
								$location.search('initiallogin', 'true');
								$location.path("home");
							
							});

						} else {
							// Show the api error.
							$scope.user.error_api = data.error;
						}

					}.bind(this)).error(function(data){

						console.log("ERROR: Too bad, couldn't get data from set password API call");

					}.bind(this));

			} else {
				// Password must match.
				$scope.user.error_passwordmismatch = true;
			}

		} else {
			// That's too short.
			$scope.user.error_passwordshort = true;
		}


	};

	$scope.validateEmail = function(email) {
	
		// First check if any value was actually set
		if (typeof email === 'undefined') { return false; }
		if (email.length === 0) { return false; }
		// Now validate the email format using Regex
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
		return re.test(email);
	
	};


	$scope.submitRegistration = function() {

		// We're good, ship them along.

		// Reset errors.
		$scope.user.error_api = false;
		$scope.user.error_email = false;

		console.log("submitregistration -- user: %j",$scope.user);

		// Assume no error.
		var is_error = false;

		// Ok, let's validate that email.
		if (!$scope.validateEmail($scope.user.email)) {
			$scope.user.error_email = true;
			is_error = true;
		}

		if (!is_error) {
			// Ok, that looks like a good request, send it out!
			
			// Ship that off to the API.
			$http.post(ENV.api_url + '/api/register', { 
					
					user: $scope.user, 

				}).success(function(data){

					if (typeof data.error === 'undefined') {

						// That looks like a success.
						$scope.registration_phase = "complete";

						// Scroll to the top.
						$("body,html").animate({scrollTop: 0}, "slow");


					} else {

						// Show the api error.
						$scope.user.error_api = data.error;

					}

					console.log("!trace test data from api: ",data);

				}.bind(this)).error(function(data){

					console.log("ERROR: Yep, couldn't get data from registration API call");

				}.bind(this));


		}


	

	};

	
}]);
/* global bowlineApp, moment, io */
bowlineApp.directive('navbar', function(){

	return {
		restrict: 'E',
		scope: {
			loggedin: '=loggedin',
		},
		templateUrl: 'views/navbar.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			var socket = io.connect(ENV.api_url);

			$scope.messages = [];
			
			$scope.$on("loginStatus",function(event,status){
				socket.emit('subscribe_user',{ session: login.sessionpack });
				// console.log("!trace woot NAVBAR directive.");

				socket.on("buildbegins",function(data){
					// console.log("!trace buildbegins SOCKET",data);
					$scope.messages.unshift({
						mode: "buildbegins",
						slug: data.slug,
						releaseid: data.releaseid,
						read: false,
						indate: new Date(),
					});
					$scope.$apply();
				});

				socket.on("buildcomplete",function(data){
					// console.log("!trace buildcomplete SOCKET",data);
					$scope.messages.unshift({
						mode: "buildcomplete",
						slug: data.slug,
						releaseid: data.releaseid,
						success: data.success,
						read: false,
						indate: new Date(),
					});
					$scope.$apply();
				});
				
			});

			$scope.numberUnread = function() {
				if ($scope.messages.length) {
					var counted = 0;
					$scope.messages.forEach(function(message){
						if (!message.read) {
							counted++;
						}
					});
					return counted;
				} else {
					return 0;
				}
			};

			$scope.clearMessages = function() {
				$scope.messages = [];
			};

			$scope.clickMessage = function(index){

				switch ($scope.messages[index].mode) {

					case "buildbegins":
					case "buildcomplete":
						// Let's build a location for the knot build in progress.
						$location.path("/knots");
						$location.search("details",$scope.messages[index].releaseid);
						$location.search("showbuild","true");
						break;

					default:
						console.log("!ERROR: clickMessage mode doesn't exist: ",$scope.messages[index].mode);
						break;

				}

				$scope.messages[index].read = true;

			};

			$scope.messageReadClass = function(read) {

				if (read) {
					return "message-read";
				} else {
					return "message-unread";
				}

			};

			$scope.navClass = function (page) {
	
				// Get the route.
				var currentRoute = $location.path().substring(1) || 'home';

				// Set the onPage if it's wrong.
				if (currentRoute !== $scope.onPage) {
					$scope.onPage = currentRoute;
				}

				
				return page === currentRoute ? 'active' : '';
			};

			$scope.secondsAgo = function(indate) {

				return moment(indate).fromNow();

			};

			// Ok it's been opened.
			$scope.toggledAlerts = function(open) {
				// console.log("!trace opened? ",open);
			};

			$scope.myKnots = function() {
				$location.path("/knots");
				$location.search('mine','true');
				$location.search('add',null);
				$location.search('details',null);
			};

			$scope.addKnot = function() {
				$location.path("/knots");
				$location.search('add','true');
				$location.search('mine',null);
				$location.search('details',null);
			};

			$scope.goConsole = function() {
				$location.path("/console");
			};

			$scope.goProfile = function() {
				$location.path("/profile");
			};

			$scope.logOut = function() {

				login.setLoggedOut(function(){
					$location.path("/");
				});

			};
			
		}],
	};

});
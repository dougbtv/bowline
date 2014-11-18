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
					console.log("!trace buildbegins TRACE IT",data);
					$scope.messages.push({
						mode: "buildbegins",
						slug: data.slug,
						releaseid: data.releaseid,
						read: false,
						indate: new Date(),
					});
					$scope.$apply();
				});
			});

			$scope.clickMessage = function(message){

				switch (message.mode) {

					case "buildbegins":
						// Let's build a location for the knot build in progress.
						$location.path("/knots");
						$location.search("details",message.releaseid);
						$location.search("showbuild","true");
						
						break;
					default:
						console.log("!ERROR: clickMessage mode doesn't exist: ",message.mode);
						break;

				}

			}

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

			}

			// Ok it's been opened.
			$scope.toggledAlerts = function(open) {
				// console.log("!trace opened? ",open);
			}
			
		}],
	};

});
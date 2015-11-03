/* global bowlineApp, moment, io */
bowlineApp.directive('dockersyntax', function(){

	return {
		restrict: 'E',
		scope: {
			dockerfile: '=', // an array of lines of a dockerfile.
		},
		templateUrl: 'views/dockersyntax.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			var dockercmds = [
				'FROM',
				'MAINTAINER',
				'RUN',
				'CMD',
				'EXPOSE',
				'ENV',
				'ADD',
				'COPY',
				'ENTRYPOINT',
				'VOLUME',
				'USER',
				'WORKDIR',
				'ONBUILD',
			];

			$scope.$watch('dockerfile', function(newValue, oldValue) {
				// console.log("!trace dockerfile watch!",{oldValue: oldValue, newValue: newValue});
				$scope.init();
			}, true);

			$scope.init = function() {

				// console.log("!trace dockersyntax.... init");

				$scope.syntax = [];

				// Ok, cycle the lines of the dockerfile, and make add chunked stylized portions per line.
				for (var i = 0; i < $scope.dockerfile.length; i++) {
					var line = $scope.dockerfile[i];

					$scope.syntax.push($scope.syntaxHighlight(line));

				}

				// console.log("!trace syntax pack ",$scope.syntax);

			};

			$scope.syntaxHighlight = function(dockerline) {

				if (/^[\s]*#/.test(dockerline)) {
					// Is it a bowline specific tag?
					if (/^#bowline/.test(dockerline)) {
						return [{ text: dockerline, style: "coded-bowlinedefine" }];
					} else {
						// That's a remark
						return [{ text: dockerline, style: "coded-comment" }];
					}

				} else {

					var collection = [];

					for (var i = 0; i < dockercmds.length; i++) {
						if (dockerline.indexOf(dockercmds[i]) > -1) {
							// ok it matches that command,
							// we need to put that part
							var dockerline_eachtext = dockerline.replace(new RegExp(dockercmds[i], 'g'),'');
							collection.push({ text: dockercmds[i], style: "coded-highlight"});
							collection.push({ text: dockerline_eachtext, style: "coded"});
						}
					}

					if (dockerline.indexOf('AUTOBUILD_UNIXTIME') > -1) {
						var useline = dockerline;
						if (collection.length > 0) {
							var end = collection.pop();
							useline = end.text;
						}

						var eachtext = useline.replace(new RegExp('AUTOBUILD_UNIXTIME', 'g'),'');

						collection.push({ text: ' AUTOBUILD_UNIXTIME' + " ", style: "coded-autobuild"});
						collection.push({ text: eachtext, style: "coded"});
						
					}

					return collection;
				}

			};

			$scope.init();

		}]
	};

});

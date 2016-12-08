/* global bowlineApp, moment, io */
bowlineApp.directive('dockersyntax', function(){

	return {
		restrict: 'E',
		scope: {
			dockerfile: '=dockerfile', // an array of lines of a dockerfile.
		},
		templateUrl: 'views/dockersyntax.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			var dockercmds = [
				'FROM',
				'MAINTAINER',
				'RUN',
				'CMD',
				'LABEL',
				'EXPOSE',
				'ENV',
				'ADD',
				'COPY',
				'ENTRYPOINT',
				'VOLUME',
				'USER',
				'WORKDIR',
				'ARG',
				'ONBUILD',
				'STOPSIGNAL',
				'HEALTHCHECK',
				'SHELL',
			];


			function stringDivider(str, width, spaceReplacer) {
		    if (str.length>width) {
	        var p=width;
	        for (;p>0 && str[p]!=' ';p--) {
	        }
	        if (p>0) {
	            var left = str.substring(0, p);
	            var right = str.substring(p+1);
	            return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
	        }
		    }
		    return str;
			}

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
					var is_raw = true;

					for (var i = 0; i < dockercmds.length; i++) {
						if (dockerline.indexOf(dockercmds[i]) > -1) {
							// ok it matches that command,
							// we need to put that part
							var dockerline_eachtext = dockerline.replace(new RegExp(dockercmds[i], 'g'),'');
							collection.push({ text: dockercmds[i], style: "coded-highlight"});
							collection.push({ text: stringDivider(dockerline_eachtext,80,"\n"), style: "coded"});
							is_raw = false;
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
						is_raw = false;
					}

					if (is_raw) {
						collection.push({ text: stringDivider(dockerline,80,"\n"), style: "coded"});
					}

					return collection;
				}

			};

			$scope.init();

		}]
	};

});

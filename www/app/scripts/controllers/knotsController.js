/* global bowlineApp, moment, Spinner, Flatdoc, io, $, lil */

bowlineApp.controller('knotsController', ['$scope', '$sce', '$location', '$http', 'loginModule', 'releaseModule', '$timeout', 'ENV', function($scope,$sce,$location,$http,login,release,$timeout,ENV) {

		$scope.params = $location.search();
		$scope.is_owner = false;

		$scope.form_edit = false;

		$scope.loading = true;

		// switch defaults if adding new knot
		if ($scope.params.add) {
			$scope.form_edit = true;
			$scope.loading = false;
			// initial the single
			$scope.single = {
				hook_secret: lil.uuid(),
			};
		}


		$scope.save_error = false;

		$scope.save_success = false;

		$scope.gitmethods = [
			{label: 'GitHub', value: 'github' },
			{label: 'Plain Git', value: 'git' },
		];

		$scope.selected_gitmethod = $scope.gitmethods[0];

		$scope.methods = [
			{label: 'Git Hook', value: 'hook' },
			{label: 'Manual Update', value: 'manual' },
			{label: 'Poll HTTP', value: 'http' },
		];

		$scope.selected_method = $scope.methods[0];

		$scope.validator = {};

		release.getReleaseValidator(function(err,validator){
			// console.log("!trace validator",validator);
			$scope.validator = validator;
		});

		$scope.entry = {};
		$scope.entry.enter_minute = "";

		var socket = io.connect(ENV.api_url); 

		$scope.logs = {};

		$scope.selectedlog = {};
		$scope.selectedlog.logid = '';
		$scope.selectedlog.log = {};
		
		$scope.getLogs = function(callback) {
			release.getLogs($scope.params.details,function(err,data){
				$scope.logs = data;
				if (callback) {
					callback(null);
				}
			});
		};

		if ($scope.params.details) {

			socket.on('build_slug',function(id,msg){
				console.log("!trace build_slug",id,msg);
			});

			$scope.getLogs();

			/*
				io.on('connection', function(socket){
					socket.join('some room');
				});
			*/

		}

		var subscribed = false;
		$scope.log_lines = [];

		$scope.socketSubscribe = function(single) {

			if (!subscribed) {

				subscribed = true;

				// let's join a room and listen for this slug.
				socket.emit('subscribe_build',{slug: single.slug});

				socket.on('buildlogline',function(logline){
					// console.log("!trace buildlogline: ",logline);
					$scope.$apply(function(){
						$scope.log_lines.push(logline);	
						$timeout(function(){
							$('#logdiv').scrollTop($('#logdiv').prop('scrollHeight'));
						},50);
					});
					// console.log("!trace buildlogline [dupe?]",$scope.log_lines);
				});

				socket.on('buildfinished',function(logline){
					// Ok, the build is finished, let's show 'em the log.
					$scope.getLogs(function(){
						// Alright, we refreshed the logs, let's move 'em to the right page
						$scope.mode = "logs";
						$scope.selectLog($scope.logs[0]._id);
					});
				});

				$scope.$on("$destroy", function() {
					// 
				});

			}

		};

		$scope.formatLogDate = function(indate){
			var a = moment();
			var b = moment(indate);
			var minutesold = a.diff(b, 'minutes');
			if (minutesold > 60) {
				return moment(indate).format("MMMM Do, h:mm:ss a");
			} else {
				return moment(indate).from();	
			}
			
		};

		$scope.logDuration = function(start,end) {

			var startmoment = moment(start);
			var endmoment = moment(end);
			var dura = startmoment.diff(endmoment);

			return moment.duration(dura).humanize();

		};

		$scope.logFormateDayDate = function(indate) {
			return moment(indate).format("YYYY-M-D h:mm:ss a");
		};

		$scope.logHighlight = function(logid) {

			if ($scope.selectedlog.logid == logid) {
				return "active logactive";
			} else {
				return "";
			}

		};

		$scope.selectLog = function(logid) {

			if ($scope.logs) {

				for (var i = 0; i < $scope.logs.length; i++) {
					if ($scope.logs[i]._id == logid) {
						$scope.selectedlog.logid = $scope.logs[i]._id;
						$scope.selectedlog.log = $scope.logs[i];
						$scope.selectedlog.lines = $scope.logs[i].log.split("\n");
						break;
					}
				}

			}

		};

		$scope.mode = "status";

		$scope.changeMode = function(mode) {

			$scope.mode = mode;

			switch (mode) {
				case "logs":
					if ($scope.logs.length) {
						$scope.selectLog($scope.logs[0]._id);
					}
					break;
				case "readme":
					$timeout(function(){
						var path_readme = $scope.single.git_path.replace(/Dockerfile/,'README.md');
						Flatdoc.run({
							fetcher: Flatdoc.github($scope.single.git_repo, path_readme),
						});
					},300);
					
					break;
				default:
			}

		};

		$scope.navHighlight = function(mode) {
			if ($scope.mode == mode) {
				return "active";
			} else {
				return "";
			}
		};

		$scope.getSingleRelease = function(callback) {

			$scope.is_owner = false;

			release.getSingleRelease($scope.params.details,function(err,single){

				if (!err) {

					$scope.socketSubscribe(single);
					
					$scope.single = single;
					// console.log("!trace checking single release owner: ",single.owner,login.fulluser._id,(single.owner == login.fulluser._id));
					
					// Are we the owner of this release?
					if (single.owner == login.fulluser._id) {
						$scope.is_owner = true;
					}

					// figure out the readme.
					// Strip the Dockerfile from the path.
					var path_readme = single.git_path.replace(/Dockerfile/,'README.md');
					
					// Ok, let's compile a github URL.
					// var url_github = 'https://github.com/' + release.git_repo + '/tree/' + release.branch_master + path_readme;

					Flatdoc.run({
						fetcher: Flatdoc.github(single.git_repo, path_readme),
					});


					// selects are a bummer, let's take the enumerated type of method and make it a reference to method.
					for (var i = 0; i < $scope.methods.length; i++) {
						if ($scope.methods[i].value == $scope.single.method) {
							// console.log("!trace HIT THAT METHOD");
							$scope.selected_method = $scope.methods[i];
						}
					}

					// same for gitmethod
					for (var j = 0; j < $scope.gitmethods.length; j++) {
						if ($scope.gitmethods[j].value == $scope.single.git_method) {
							$scope.selected_gitmethod = $scope.gitmethods[j];
							// console.log("!trace HIT THAT METHOD",$scope.selected_gitmethod);
						}
					}

				} else {
					$scope.error = err;
				}

				$scope.loading = false;

				if (callback) {
					callback(null);
				}
				

			});

		};

		$scope.generateUUID = function() {

			$scope.single.hook_secret = lil.uuid();

		};

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

		$scope.syntaxHighlight = function(dockerline) {

			if (/^[\s]*#/.test(dockerline)) {
				// That's a remark
				return $sce.trustAsHtml(dockerline.replace(dockerline, '<span class="coded-comment">$&</span>'));
			} else {
				var dockerhtml = dockerline;
				for (var i = 0; i < dockercmds.length; i++) {
					dockerhtml = dockerhtml.replace(new RegExp(dockercmds[i], 'g'), '<span class="coded-highlight">$&</span>');
				}

				dockerhtml = dockerhtml.replace(new RegExp('AUTOBUILD_UNIXTIME', 'g'), '<span class="coded-autobuild">$&</span>');

				return $sce.trustAsHtml(dockerhtml);
			}

		};

		
		$scope.cancelChanges = function() {
			$scope.loading = true;
			$scope.form_edit = false;
			$scope.getSingleRelease();
		};

		$scope.addMinute = function(minute) {

			// reset input field.
			$scope.entry.enter_minute = "";

			// operate only if non empty.
			if (minute !== '') {
				// operate only if minute on the clock
				if (/^([0-5][0-9]|[0-9])$/.test(minute)) {
					// ok, let's push it in the array.
					// dedupe it.
					// and sort it.
					if (!$scope.single.check_minutes) {
						$scope.single.check_minutes = [];
					}
					$scope.single.check_minutes.push(parseInt(minute));

					// Now make it unique.
					var uniqueArray = $scope.single.check_minutes.filter(function(item, pos) {
					    return $scope.single.check_minutes.indexOf(item) == pos;
					});

					// And set it.
					$scope.single.check_minutes = uniqueArray;

					// Now sort it.
					$scope.single.check_minutes.sort(function(a, b){
						return a-b;
					});

				}
			}

		};

		$scope.saveRelease = function(release_method,update_method) {

			
			$scope.save_error = false;
			$scope.loading = true;

			// Tack on the selected values.
			$scope.single.method = update_method.value;
			$scope.single.git_method = release_method.value;

			console.log("!trace scope single on saveRelease: ",$scope.single);

			

			release.editRelease($scope.single,$scope.params.add,function(err){
				if (!err) {

					// Ok, that's good, now we can reload.
					// Let's start the job.
					$scope.startJob($scope.single._id,function(){
						
						$scope.form_edit = false;
						$scope.save_success = true;
						$timeout(function(){
							$scope.save_success = false;
						},1250);

					});

				} else {
					$scope.loading = false;
					$scope.save_error = true;
				}
			});

		};

		$scope.deleteMinute = function(minute) {

			// Keep everything but this minute.

			var keeper = [];

			for (var i = 0; i < $scope.single.check_minutes.length; i++) {
				if ($scope.single.check_minutes[i] != minute) {
					keeper.push($scope.single.check_minutes[i]);
				}
			}

			$scope.single.check_minutes = keeper;

			// Now sort it.
			$scope.single.check_minutes.sort(function(a, b){
				return a-b;
			});

		};

		$scope.showCloseMinute = function() {
			return ($scope.is_owner && !$scope.formEnabled());
		};

		$scope.padZero = function(n) {
		    return (n < 10) ? ("0" + n) : n;
		};

		$scope.enableForm = function() {

			// hack for re-draw
			if ($scope.formEnabled()) {
				var keep = $scope.single.check_minutes;
				$scope.single.check_minutes = [];
				$timeout(function(){
					$scope.single.check_minutes = keep;	
				},100);	
			}
			
			$scope.form_edit = true;
		};

		$scope.formEnabled = function() {
			if ($scope.params.add) {
				return false;
			} else {

				if ($scope.single) {
				
					if (!$scope.form_edit) {
						return true;
					} else {
						if ($scope.single.job.exists) {
							return true;
						} else {
							return false;
						}
					}
					
				} else {
					return !$scope.form_edit;	
				}

			}


			 
		};

		$scope.validateJob = function(id) {
			$scope.loading = true;
			// console.log("!trace validateJob id: ",id);
			release.validateJob(id,function(err){
				$scope.getSingleRelease();
			});
		};

		$scope.startJob = function(id,callback) {
			if (typeof callback == 'undefined') {
				callback = function(){};
			}
			$scope.loading = true;
			// console.log("!trace startJob id: ",id);
			release.startJob(id,function(err){
				callback();
				$scope.getSingleRelease();
			});
		};

		$scope.forceUpdate = function(id) {

			release.forceUpdate(id,function(err){
				
				console.log("!trace re-get after forceUpdate");

				// force that the job is in progress.
				$scope.getSingleRelease(function(){
					$scope.single.job.in_progress = true;
				});

				// show the logs screen.
				$scope.mode = "in_progress";
			});

		};

		$scope.stopJob = function(id,enable_form) {
			$scope.loading = true;
			// console.log("!trace stopJob id: ",id);
			release.stopJob(id,function(err){
				$scope.getSingleRelease();
				if (enable_form) {
					$scope.enableForm();
				}
			});
		};

		$scope.ago = function(indate) {
			if (indate) {
				return moment(indate).fromNow();
			} else {
				return "Pending";
			}
			
		};

		// Ok bring up the details link.
		$scope.showDetails = function(id) {
			$location.search('details', id);
			$location.search('add', null);
		};

		// And instantiate.
		if ($scope.params.add) {

			// Ok, I guess we need a blank one...

		} else {

			if ($scope.params.details) {

				$scope.getSingleRelease();

			} else {

				release.getReleases(function(err,rels){

					if (!err) {

						$scope.releases = rels;
						// console.log("!trace checking releases: ",rels);
					} else {
						$scope.error = err;
					}
					

				});

			}

		}

		

}]);

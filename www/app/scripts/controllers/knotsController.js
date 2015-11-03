/* global bowlineApp, moment, Spinner, Flatdoc, io, $, lil */

bowlineApp.controller('knotsController', ['$scope', '$sce', '$location', '$http', 'loginModule', 'releaseModule', '$timeout', 'ENV', function($scope,$sce,$location,$http,login,release,$timeout,ENV) {

		// Default our mode.
		$scope.mode = "status";

		$scope.params = $location.search();
		$scope.is_owner = false;

		$scope.form_edit = false;

		$scope.loading = true;

		$scope.log_loading = true;

		$scope.knot_search = "";

		$scope.tags = [];

		// switch defaults if adding new knot
		if ($scope.params.add) {
			$scope.form_edit = true;
			$scope.loading = false;

			// initial the single
			// ...with some friendly defaults
			$scope.single = {
				hook_secret: lil.uuid(),
				branch_name: "autobuild",
				branch_master: "master",
			};

			$scope.mode = "properties";
		}

		// 
		$scope.HOOKURL = ENV.githook_url;


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

		$scope.selectedcollab = {};
		$scope.selectedcollab.collaborator = '';

		$scope.logSetDefaults = function() {

			$scope.logs = [];

			$scope.selectedlog = {};
			$scope.selectedlog.logid = '';
			$scope.selectedlog.log = {};

			$scope.logs_pagestart = 0;
			$scope.logs_pageend = 10;
			$scope.logs_pageincrement = 10;
			$scope.logs_found_all = false;
		};

		$scope.logSetDefaults();

		
		$scope.getLogs = function(callback) {
			release.getLogs(
				$scope.params.details,
				$scope.logs_pagestart,
				$scope.logs_pageend,
				function(err,data){
					$scope.logs_pagestart += $scope.logs_pageincrement;
					$scope.logs_pageend += $scope.logs_pageincrement;
					// console.log("!getLogs data: ",data);
					$scope.logs = $scope.logs.concat(data.logs);
					if (data.count < $scope.logs_pageend) {
						$scope.logs_found_all = true;
					}
					if (callback) {
						callback(null);
					}

				});
		};

		if ($scope.params.details) {

			socket.on('build_slug',function(id,msg){
				console.log("!trace build_slug",id,msg);
			});

			$scope.logSetDefaults();
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

						$scope.log_lines.push($scope.getColoredLine(logline));	
						$timeout(function(){
							$('#logdiv').scrollTop($('#logdiv').prop('scrollHeight'));
						},50);
					});
					// console.log("!trace buildlogline [dupe?]",$scope.log_lines);
				});

				socket.on('buildfinished',function(logline){
					// Ok, the build is finished, let's show 'em the log.
					// ... We also need to refresh the single.
					$scope.getSingleRelease(function(){
	
						$scope.logSetDefaults();
						$scope.getLogs(function(){
							// Alright, we refreshed the logs, let's move 'em to the right page
							$timeout(function(){
								$scope.mode = "logs";
								$scope.selectLog($scope.logs[0]._id);
							},120);
						});

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

		$scope.showDetails = function(id) {
			$location.path('/knots').search('details', id);
		};

		$scope.addKnotButton = function(){
			$location.search('add','true');
			$location.search('details',null);
			$location.search('mine',null);
		};

		$scope.selectFamily = function() {
			$scope.mode = 'family';
			release.getFamily($scope.single._id,function(err,family){
				$scope.family = family;
			});
		};

		$scope.selectLog = function(logid) {

			$scope.mode = 'logdetail';

			if ($scope.logs) {

				for (var i = 0; i < $scope.logs.length; i++) {
					if ($scope.logs[i]._id == logid) {
						$scope.selectedlog.logid = $scope.logs[i]._id;
						$scope.selectedlog.log = $scope.logs[i];
						break;
					}
				}

			}

			// Ok, now let's load the log text on it's own.
			$scope.log_loading = true;

			release.getLogText($scope.single._id,$scope.selectedlog.logid,function(err,logtext){

				$scope.log_loading = false;

				var templines;

				if (!err) {
					templines = logtext.split("\n");
					$scope.selectedlog.lines = [];

					// color lines that you want.
					for (var i = 0; i < templines.length; i++) {
						
						var color = $scope.getColoredLine(templines[i]);
						
						$scope.selectedlog.lines.push({
							text: color.line,
							colored: color.colored,
						});

					}

				} else {
					console.log("!ERROR: Couldn't get log text: ",err);
				}

				
				
			});

		};

		// Now what about colorizing those ANSI colors?
		// TODO: This is a quick hack.
		// Escape.js -- google it, nice, designed for ANSI art.
		// We'll just strip these codes and color red if it's colored.

		$scope.getColoredLine = function(line) {

			var colored = false;

			// Does it have an escape sequence?
			// \x1b will match ascii code 27.

			// Let's strip reset first.
			line = line.replace(/\x1b\[0m/g, "", line);

			// If we stripped reset first, and something is here, let's mark it as colored.
			if (line.match(/\x1b/)) {
				colored = true;
				// console.log("!trace line: ",line);
				// Ok, cycle this line....
				// console.log("!trace charAt: ",line.charCodeAt(0));
				// ... remove the escape sequence.
				line = line.replace(/\x1b\[\d+m/g, "", line);
			}

			return { line: line, colored: colored };

		};

		$scope.changeMode = function(mode) {

			$scope.mode = mode;

			switch (mode) {
				case "family":
					$scope.selectFamily();
					break;
				case "tags":
					$scope.getTags();
					break;
				case "logs":
					/* if ($scope.logs.length) {
						$scope.selectLog($scope.logs[0]._id);
					} */
					break;
				case "readme":

					switch ($scope.single.git_method) {
						case "github": 
							$timeout(function(){
								var path_readme = $scope.single.git_path.replace(/Dockerfile/,'README.md');
								Flatdoc.run({
									fetcher: Flatdoc.github($scope.single.git_repo, path_readme),
								});
							},300);
							break;
							
						default:
							console.log("!TODO: Build readme support for vanilla git");
					}
					
					break;

				default:
					// nothing yet...
					break;
			}

		};

		$scope.navHighlight = function(mode) {
			if ($scope.mode == mode) {
				return "active";
			} else {
				return "";
			}
		};

		// ---------------------------- branch dropdown
		
		$scope.on_branch = {
			label: 'All branches',
			idx: -1,
		};

		$scope.selectBranch = function(branchidx){

			switch (branchidx) {
				case -1:
					$scope.on_branch.label = "All branches"
					$scope.on_branch.idx = 0;
					break;
				default:
					$scope.on_branch.label = $scope.single.branches[branchidx].name;
					$scope.on_branch.idx = branchidx;
					break;
			}


		}

		$scope.status = {
			isopen: false
		};

		$scope.toggled = function(open) {
			console.log('Dropdown is now: ', open);
		};

		$scope.toggleDropdown = function($event) {
			$event.preventDefault();
			$event.stopPropagation();
			$scope.status.isopen = !$scope.status.isopen;
		};
		// --------------------------------------------

		$scope.getSingleRelease = function(callback) {

			$scope.is_owner = false;

			release.getSingleRelease($scope.params.details,function(err,single){

				// Which which are required.
				console.log("!trace GET SINGLE: ",single);

				if (!err) {

					$scope.socketSubscribe(single);

					$scope.single = single;
					// console.log("!trace checking single release owner: ",single.owner,login.fulluser._id,(single.owner == login.fulluser._id));

					// Sometimes we show build info, e.g. when clicking in from messages.
					if ($scope.params.showbuild) {

						// Is the job still running?
						if ($scope.single.job.in_progress) {

							$scope.single.job.in_progress = true;
							// show the logs screen.
							$scope.mode = "in_progress";

						} else {

							// If it's not running, let's show the latest job.
							$scope.logSetDefaults();
							$scope.getLogs(function(){
								$scope.mode = "logs";
								$scope.selectLog($scope.logs[0]._id);
							});

						}
						
					}
					
					// Are we the owner of this release?
					if (single.owner._id == login.fulluser._id) {
						$scope.is_owner = true;
					}

					// Or if we're a collaborator.
					$scope.single.collaborators.forEach(function(col){
						// console.log("!trace colid: ",col._id);
						if (col._id == login.fulluser._id) {
							$scope.is_owner = true;
						}
					});

					// figure out the readme.
					// Strip the Dockerfile from the path.
					var path_readme = '';
					if (single.git_path) {
						path_readme = single.git_path.replace(/Dockerfile/,'README.md');	
					}
					
					// Ok, let's compile a github URL.
					// var url_github = 'https://github.com/' + release.git_repo + '/tree/' + release.branch_master + path_readme;

					/*
					Flatdoc.run({
						fetcher: Flatdoc.github(single.git_repo, path_readme),
					});
					*/

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

		$scope.getTags = function(){
			release.getTags($scope.params.details,function(err,tags){
				$scope.tags = tags;
			});
		};

		$scope.generateUUID = function() {

			$scope.single.hook_secret = lil.uuid();

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

			release.editRelease($scope.single,$scope.params.add,function(err,releaseid){

				$scope.loading = false;

				if (!err) {

					// Ok, that's good, now we can reload.
					// Let's start the job.
					$scope.startJob(releaseid,function(){

						$scope.form_edit = false;
						$scope.save_success = true;

						// Let's reload with details.
						if ($scope.params.add) {
							$scope.showDetails(releaseid);
						}
						
						$timeout(function(){
							$scope.save_success = false;
						},1250);

					});

				} else {
					$scope.save_error = true;
				}
			});

		};

		$scope.collaborators = [];

		$scope.searchCollaborators = function(searchstring) {

			// console.log("!trace searchCollaborators??? ",searchstring);

			if (searchstring) {
				if (searchstring.length >= 3) {
					release.searchCollaborators(searchstring,function(err,users){
						// console.log("searched for %s, found: %j",searchstring,users);
						if (users) {
							if (users.length) {
								// console.log("DINGER DINGER DINGER  searched for %s, found: %j",searchstring,users);
								$scope.collaborators = users;
							} else {
								$scope.collaborators = [];
							}
						} else {
							$scope.collaborators = [];
						}
					});
				} else {
					$scope.collaborators =  [];
				}
			} else {
				$scope.collaborators = [];
			}

		};

		$scope.addCollaborator = function(add_username) {

			// Ok, let's pick this out of the last collabs

			var found = null;
			for (var i = 0; i < $scope.collaborators.length; i++) {
				if ($scope.collaborators[i].username == add_username) {
					found = $scope.collaborators[i];
					break;
				}
			}

			if (found) {

				var isdupe = false;
				for (var j = 0; j < $scope.single.collaborators.length; j++) {
					if ($scope.single.collaborators[j]._id == found._id) {
						isdupe = true;
					}
				}

				if ($scope.single.owner == found._id) {
					isdupe = true;
				}

				if (!isdupe) {
					$scope.single.collaborators.push({
						_id: found._id,
						username: add_username,
					});				
				}
			}

			// console.log("!trace addCollaborator: ",$scope.selectedcollab.collaborator);
			$scope.selectedcollab.collaborator = "";


		
			
		};

		$scope.deleteCollaborator = function(userid) {

			var keep = [];
			for (var i = 0; i < $scope.single.collaborators.length; i++) {
				if ($scope.single.collaborators[i]._id != userid) {
					keep.push($scope.single.collaborators[i]);
				}
			}

			$scope.single.collaborators = keep;

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

		// https://github.com/dougbtv/bowline/commit/b64a5431a2f7562fb615839378dfa53f6172af62

		$scope.gitHubCommitURL = function(commit) {
			if ($scope.single) {
				if ($scope.single.git_repo) {
					return "https://github.com/" + $scope.single.git_repo + "/commit/" + commit;
				}
			}
			return "";
		};

		$scope.shortCommit = function(commit) {
			if (commit) {
				return commit.substring(0,7);
			} else {
				return "";
			}
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
						if ($scope.single.job) {
							if ($scope.single.job.exists) {
								return true;
							} else {
								return false;
							}
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
				
				// console.log("!trace re-get after forceUpdate");

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

		

		// And instantiate.
		if ($scope.params.add) {

			// Ok, I guess we need a blank one...

		} else {

			if ($scope.params.details) {

				$scope.getSingleRelease();

			}

		}

		

}]);

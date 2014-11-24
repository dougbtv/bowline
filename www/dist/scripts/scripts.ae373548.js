"use strict";function loginModule(a,b,c,d,e,f,g){this.username="",this.session="",this.sessionpack={username:"",session:""},this.fulluser={},this.status=!1,this.broadcastLoginStatus=function(b){e(function(){a.$broadcast("loginStatus",b)},100)};var h=this.broadcastLoginStatus;this.submitAttempt=function(a,c){b.post(g.api_url+"/api/login",a).success(function(b){console.log("!trace LOGIN AJAX: ",b),b.session?this.setLoggedIn(a.email,b.session,function(){this.fulluser=b.fulluser,h(!0),c(!0)}.bind(this)):this.setLoggedOut(function(){c(!1)})}.bind(this)).error(function(){this.setLoggedOut(function(){c(!1)})}.bind(this))},this.validateSession=function(a){({admin:f.get("userprops_admin"),operator:f.get("userprops_operator")});f.get("username")&&f.get("session")?b.post(g.api_url+"/api/validateSession",{session:{username:f.get("username"),session:f.get("session")}}).success(function(b){b.valid?this.setLoggedIn(f.get("username"),f.get("session"),function(){this.fulluser=b.fulluser,h(!0),a(!0)}.bind(this)):this.setLoggedOut(function(){a(!1)})}.bind(this)).error(function(){this.setLoggedOut(function(){a(!1)})}.bind(this)):a(!1)},this.setLoggedIn=function(a,b,c){this.status=!0,f.set("session",b),f.set("username",a),this.username=a,this.session=b,this.setSessionPack(),console.log("!trace Successful login with session: ",f.get("session")),c&&c()},this.setSessionPack=function(){this.sessionpack={username:f.get("username"),session:f.get("session")}},this.setLoggedOut=function(a){this.status=!1,f.set("session",""),f.set("username",""),this.username="",this.session="",h(!1),a()}}function releaseModule(a,b,c,d,e){console.log("!trace releaseModule instantiated, login status: ",d.status),this.validator={},this.getReleases=function(a,c,f,g){var h={};d.status&&(h=d.sessionpack),b.post(e.api_url+"/api/getReleases",{session:h,username:c,mineonly:a,search:f}).success(function(a){g(null,a)}.bind(this)).error(function(){g("Had trouble with getReleases from API")}.bind(this))},this.editRelease=function(a,c,f){c?b.post(e.api_url+"/api/addRelease",{release:a,session:d.sessionpack}).success(function(a){f(a.error,a.releaseid)}.bind(this)).error(function(){f("Had trouble with addRelease from API")}.bind(this)):b.post(e.api_url+"/api/editRelease",{release:a,session:d.sessionpack}).success(function(a){f(a.error,a.releaseid)}.bind(this)).error(function(){f("Had trouble with editRelease from API")}.bind(this))},this.searchCollaborators=function(a,c){b.post(e.api_url+"/api/searchCollaborators",{session:d.sessionpack,search:a}).success(function(a){c(null,a)}.bind(this)).error(function(){c("Had trouble with searchCollaborators from API")}.bind(this))},this.getSingleRelease=function(a,c){b.post(e.api_url+"/api/getSingleRelease",{id:a,session:d.sessionpack}).success(function(a){c(null,a)}.bind(this)).error(function(){c("Had trouble with getSingleRelease from API")}.bind(this))},this.getTags=function(a,c){b.post(e.api_url+"/api/getTags",{releaseid:a,session:d.sessionpack}).success(function(a){console.log("!trace getTags tags",a),c(null,a)}.bind(this)).error(function(){c("Had trouble with getTags from API")}.bind(this))},this.getReleaseValidator=function(a){b.post(e.api_url+"/api/getReleaseValidator",{session:d.sessionpack}).success(function(b){a(null,b),this.validator=b}.bind(this)).error(function(){a("Had trouble with getReleaseValidator from API")}.bind(this))},this.forceUpdate=function(a,c){b.post(e.api_url+"/api/forceUpdate",{id:a,session:d.sessionpack}).success(function(a){var b=null;a.error&&(b=a.error),c(b,a)}.bind(this)).error(function(){c("Had trouble with forceUpdate from API")}.bind(this))},this.getLogText=function(a,c,f){b.post(e.api_url+"/api/getLogText",{releaseid:a,logid:c,session:d.sessionpack}).success(function(a){var b=null;a.error&&(b=a.error),f(b,a.log)}.bind(this)).error(function(){f("Had trouble with getLogText from API")}.bind(this))},this.getLogs=function(a,c,f,g){b.post(e.api_url+"/api/getLogs",{id:a,session:d.sessionpack,startpos:c,endpos:f}).success(function(a){var b=null;a.error&&(b=a.error),g(b,a)}.bind(this)).error(function(){g("Had trouble with getLogs from API")}.bind(this))},this.validateJob=function(a,c){b.post(e.api_url+"/api/validateJob",{id:a,session:d.sessionpack}).success(function(a){var b=null;a.error&&(b=a.error),c(b,a)}.bind(this)).error(function(){c("Had trouble with validateJob from API")}.bind(this))},this.startJob=function(a,c){b.post(e.api_url+"/api/startJob",{id:a,session:d.sessionpack}).success(function(a){var b=null;a.error&&(b=a.error),c(b,a)}.bind(this)).error(function(){c("Had trouble with startJob from API")}.bind(this))},this.stopJob=function(a,c){b.post(e.api_url+"/api/stopJob",{id:a,session:d.sessionpack}).success(function(a){var b=null;a.error&&(b=a.error),c(b,a)}.bind(this)).error(function(){c("Had trouble with stopJob from API")}.bind(this))}}var bowlineApp=angular.module("bowlineApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap","config","LocalStorageModule"]).config(["$routeProvider","ENV",function(a){a.when("/",{templateUrl:"views/main.html",controller:"MainCtrl"}).when("/docs",{templateUrl:"views/docs.html",controller:"docsController"}).when("/knots",{templateUrl:"views/knots.html",controller:"knotsController"}).when("/login",{templateUrl:"views/login.html",controller:"loginController"}).when("/console",{templateUrl:"views/console.html",controller:"consoleController"}).when("/profile/:username",{templateUrl:"views/profile.html",controller:"profileController"}).when("/profile/",{templateUrl:"views/profile.html",controller:"profileController"}).when("/register",{templateUrl:"views/register.html",controller:"registerController"}).otherwise({redirectTo:"/"})}]);bowlineApp.controller("bowlineMainController",["$scope","$location","$http","$cookies","$route","$interval","loginModule","ENV",function(a,b,c,d,e,f,g){a.loggedin=g.status,a.$on("loginStatus",function(b,c){a.loggedin=c}),g.validateSession(function(){})}]),angular.module("config",[]).constant("ENV",{name:"production",githook_url:"https://bowline.io/api/gitHookUpdate/",api_url:""}),bowlineApp.factory("loginModule",["$rootScope","$http","$cookies","$cookieStore","localStorageService","$timeout","ENV",function(a,b,c,d,e,f,g){return new loginModule(a,b,c,d,f,e,g)}]),bowlineApp.controller("loginController",["$scope","$location","$http","loginModule","ENV",function(a,b,c,d,e){console.log("!trace login controller instantiated."),console.log("!trace login controller ENV: ",e.api_url),console.log("!trace login controller status: ",d.status),a.page_loaded=!1,d.validateSession(function(c){switch(e.name){case"development":case"mobile":c&&b.path("matchinbox")}a.page_loaded=!0}),a.clickLogin=function(){d.submitAttempt(a.loginForm,function(c){if(c)switch(a.loginfailure=!1,e.name){case"development":case"mobile":b.path("matchinbox");break;default:b.search("initiallogin","true"),b.path("home")}else a.loginfailure=!0})}}]),bowlineApp.controller("registerController",["$scope","$location","$http","$timeout","$interval","loginModule","ENV",function(a,b,c,d,e,f,g){$("body,html").animate({scrollTop:0},"slow"),a.user={email:"",username:"",password:"",passwordverify:""};var h=b.search();"undefined"!=typeof h.resetpass&&(a.registration_phase="resetpass"),a.localchange=!1,h.localchange&&(a.localchange=!0),a.show_forgotpass_text=!1,"undefined"!=typeof h.forgot&&(a.registration_phase="forgot",a.show_forgotpass_text=!0),a.show_terms=!1,a.showTerms=function(){a.show_terms=!a.show_terms},a.forgotPassword=function(){a.user.error_email=!1,a.user.error_emailunknown=!1,a.validateEmail(a.user.email)?c.post(g.api_url+"/api/forgotpassword",{email:a.user.email}).success(function(b){"undefined"==typeof b.error?a.registration_phase="complete":a.user.error_emailunknown=!0}.bind(this)).error(function(){console.log("ERROR: Too bad, couldn't get data from set password API call")}.bind(this)):a.user.error_email=!0},a.resetPassword=function(){a.user.error_passwordshort=!1,a.user.error_passwordmismatch=!1,a.user.password.length>5?a.user.password==a.user.passwordverify?c.post(g.api_url+"/api/setpassword",{email:h.email,resetkey:h.resetpass,password:a.user.password}).success(function(b){"undefined"==typeof b.error?a.registration_phase="passwordresetcomplete":a.user.error_api=b.error}.bind(this)).error(function(){console.log("ERROR: Too bad, couldn't get data from set password API call")}.bind(this)):a.user.error_passwordmismatch=!0:a.user.error_passwordshort=!0},a.validateEmail=function(a){if("undefined"==typeof a)return!1;if(0===a.length)return!1;var b=/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;return b.test(a)},a.submitRegistration=function(){a.user.error_api=!1,a.user.error_email=!1,a.user.error_username=!1,console.log("submitregistration -- user: %j",a.user);var b=!1;a.validateEmail(a.user.email)||(a.user.error_email=!0,b=!0),/^[a-zA-Z0-9\\-_\\.]{4,}$/.test(a.user.username)||(a.user.error_username=!0,b=!0),b||c.post(g.api_url+"/api/register",{user:a.user}).success(function(b){"undefined"==typeof b.error?(a.registration_phase="complete",$("body,html").animate({scrollTop:0},"slow")):a.user.error_api=b.error,console.log("!trace test data from api: ",b)}.bind(this)).error(function(){console.log("ERROR: Yep, couldn't get data from registration API call")}.bind(this))}}]),bowlineApp.directive("menu",function(){return{restrict:"E",scope:{},templateUrl:"views/menu.html",controller:["$scope","$http","$attrs","$location","ENV","loginModule",function(){}]}}),angular.module("bowlineApp").controller("MainCtrl",["$scope",function(a){a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}]),bowlineApp.controller("docsController",["$scope","$location","$http","loginModule","ENV",function(a){var b="dougbtv/bowline";Flatdoc.run({fetcher:Flatdoc.github(b,"README.md")});var c={readme:"README.md",started:"docs/GettingStarted.md"};a.mode="readme",a.clickDocs=function(d){a.mode=d,Flatdoc.run({fetcher:Flatdoc.github(b,c[d])})},a.docsTab=function(b){return b===a.mode?"active":""}}]),bowlineApp.controller("knotsController",["$scope","$sce","$location","$http","loginModule","releaseModule","$timeout","ENV",function(a,b,c,d,e,f,g,h){a.mode="status",a.params=c.search(),a.is_owner=!1,a.form_edit=!1,a.loading=!0,a.log_loading=!0,a.knot_search="",a.tags=[],a.params.add&&(a.form_edit=!0,a.loading=!1,a.single={hook_secret:lil.uuid(),branch_name:"autobuild",branch_master:"master"},a.mode="properties"),a.HOOKURL=h.githook_url,a.save_error=!1,a.save_success=!1,a.gitmethods=[{label:"GitHub",value:"github"},{label:"Plain Git",value:"git"}],a.selected_gitmethod=a.gitmethods[0],a.methods=[{label:"Git Hook",value:"hook"},{label:"Manual Update",value:"manual"},{label:"Poll HTTP",value:"http"}],a.selected_method=a.methods[0],a.validator={},f.getReleaseValidator(function(b,c){a.validator=c}),a.entry={},a.entry.enter_minute="";var i=io.connect(h.api_url);a.selectedcollab={},a.selectedcollab.collaborator="",a.logSetDefaults=function(){a.logs=[],a.selectedlog={},a.selectedlog.logid="",a.selectedlog.log={},a.logs_pagestart=0,a.logs_pageend=10,a.logs_pageincrement=10,a.logs_found_all=!1},a.logSetDefaults(),a.getLogs=function(b){f.getLogs(a.params.details,a.logs_pagestart,a.logs_pageend,function(c,d){a.logs_pagestart+=a.logs_pageincrement,a.logs_pageend+=a.logs_pageincrement,a.logs=a.logs.concat(d.logs),d.count<a.logs_pageend&&(a.logs_found_all=!0),b&&b(null)})},a.params.details&&(i.on("build_slug",function(a,b){console.log("!trace build_slug",a,b)}),a.logSetDefaults(),a.getLogs());var j=!1;a.log_lines=[],a.socketSubscribe=function(b){j||(j=!0,i.emit("subscribe_build",{slug:b.slug}),i.on("buildlogline",function(b){a.$apply(function(){a.log_lines.push(a.getColoredLine(b)),g(function(){$("#logdiv").scrollTop($("#logdiv").prop("scrollHeight"))},50)})}),i.on("buildfinished",function(){a.getSingleRelease(function(){a.logSetDefaults(),a.getLogs(function(){g(function(){a.mode="logs",a.selectLog(a.logs[0]._id)},120)})})}),a.$on("$destroy",function(){}))},a.formatLogDate=function(a){var b=moment(),c=moment(a),d=b.diff(c,"minutes");return d>60?moment(a).format("MMMM Do, h:mm:ss a"):moment(a).from()},a.logDuration=function(a,b){var c=moment(a),d=moment(b),e=c.diff(d);return moment.duration(e).humanize()},a.logFormateDayDate=function(a){return moment(a).format("YYYY-M-D h:mm:ss a")},a.logHighlight=function(b){return a.selectedlog.logid==b?"active logactive":""},a.showDetails=function(a){c.path("/knots").search("details",a)},a.addKnotButton=function(){c.search("add","true"),c.search("details",null),c.search("mine",null)},a.selectLog=function(b){if(a.mode="logdetail",a.logs)for(var c=0;c<a.logs.length;c++)if(a.logs[c]._id==b){a.selectedlog.logid=a.logs[c]._id,a.selectedlog.log=a.logs[c];break}a.log_loading=!0,f.getLogText(a.single._id,a.selectedlog.logid,function(b,c){a.log_loading=!1;var d;if(b)console.log("!ERROR: Couldn't get log text: ",b);else{d=c.split("\n"),a.selectedlog.lines=[];for(var e=0;e<d.length;e++){var f=a.getColoredLine(d[e]);a.selectedlog.lines.push({text:f.line,colored:f.colored})}}})},a.getColoredLine=function(a){var b=!1;return a=a.replace(/\x1b\[0m/g,"",a),a.match(/\x1b/)&&(b=!0,a=a.replace(/\x1b\[\d+m/g,"",a)),{line:a,colored:b}},a.changeMode=function(b){switch(a.mode=b,b){case"tags":a.getTags();break;case"logs":break;case"readme":g(function(){var b=a.single.git_path.replace(/Dockerfile/,"README.md");Flatdoc.run({fetcher:Flatdoc.github(a.single.git_repo,b)})},300)}},a.navHighlight=function(b){return a.mode==b?"active":""},a.getSingleRelease=function(b){a.is_owner=!1,f.getSingleRelease(a.params.details,function(c,d){if(c)a.error=c;else{a.socketSubscribe(d),a.single=d,a.params.showbuild&&(a.single.job.in_progress?(a.single.job.in_progress=!0,a.mode="in_progress"):(a.logSetDefaults(),a.getLogs(function(){a.mode="logs",a.selectLog(a.logs[0]._id)}))),d.owner._id==e.fulluser._id&&(a.is_owner=!0),a.single.collaborators.forEach(function(b){b._id==e.fulluser._id&&(a.is_owner=!0)});var f="";d.git_path&&(f=d.git_path.replace(/Dockerfile/,"README.md")),Flatdoc.run({fetcher:Flatdoc.github(d.git_repo,f)});for(var g=0;g<a.methods.length;g++)a.methods[g].value==a.single.method&&(a.selected_method=a.methods[g]);for(var h=0;h<a.gitmethods.length;h++)a.gitmethods[h].value==a.single.git_method&&(a.selected_gitmethod=a.gitmethods[h])}a.loading=!1,b&&b(null)})},a.getTags=function(){f.getTags(a.params.details,function(b,c){a.tags=c})},a.generateUUID=function(){a.single.hook_secret=lil.uuid()};var k=["FROM","MAINTAINER","RUN","CMD","EXPOSE","ENV","ADD","COPY","ENTRYPOINT","VOLUME","USER","WORKDIR","ONBUILD"];a.syntaxHighlight=function(a){if(/^[\s]*#/.test(a))return b.trustAsHtml(/^#bowline/.test(a)?a.replace(a,'<span class="coded-bowlinedefine">$&</span>'):a.replace(a,'<span class="coded-comment">$&</span>'));for(var c=a,d=0;d<k.length;d++)c=c.replace(new RegExp(k[d],"g"),'<span class="coded-highlight">$&</span>');return c=c.replace(new RegExp("AUTOBUILD_UNIXTIME","g"),'<span class="coded-autobuild">$&</span>'),b.trustAsHtml(c)},a.cancelChanges=function(){a.loading=!0,a.form_edit=!1,a.getSingleRelease()},a.addMinute=function(b){if(a.entry.enter_minute="",""!==b&&/^([0-5][0-9]|[0-9])$/.test(b)){a.single.check_minutes||(a.single.check_minutes=[]),a.single.check_minutes.push(parseInt(b));var c=a.single.check_minutes.filter(function(b,c){return a.single.check_minutes.indexOf(b)==c});a.single.check_minutes=c,a.single.check_minutes.sort(function(a,b){return a-b})}},a.saveRelease=function(b,c){a.save_error=!1,a.loading=!0,a.single.method=c.value,a.single.git_method=b.value,console.log("!trace scope single on saveRelease: ",a.single),f.editRelease(a.single,a.params.add,function(b,c){a.loading=!1,b?a.save_error=!0:a.startJob(c,function(){a.form_edit=!1,a.save_success=!0,a.params.add&&a.showDetails(c),g(function(){a.save_success=!1},1250)})})},a.collaborators=[],a.searchCollaborators=function(b){b&&b.length>=3?f.searchCollaborators(b,function(b,c){a.collaborators=c&&c.length?c:[]}):a.collaborators=[]},a.addCollaborator=function(b){for(var c=null,d=0;d<a.collaborators.length;d++)if(a.collaborators[d].username==b){c=a.collaborators[d];break}if(c){for(var e=!1,f=0;f<a.single.collaborators.length;f++)a.single.collaborators[f]._id==c._id&&(e=!0);a.single.owner==c._id&&(e=!0),e||a.single.collaborators.push({_id:c._id,username:b})}a.selectedcollab.collaborator=""},a.deleteCollaborator=function(b){for(var c=[],d=0;d<a.single.collaborators.length;d++)a.single.collaborators[d]._id!=b&&c.push(a.single.collaborators[d]);a.single.collaborators=c},a.deleteMinute=function(b){for(var c=[],d=0;d<a.single.check_minutes.length;d++)a.single.check_minutes[d]!=b&&c.push(a.single.check_minutes[d]);a.single.check_minutes=c,a.single.check_minutes.sort(function(a,b){return a-b})},a.showCloseMinute=function(){return a.is_owner&&!a.formEnabled()},a.padZero=function(a){return 10>a?"0"+a:a},a.gitHubCommitURL=function(b){return a.single&&a.single.git_repo?"https://github.com/"+a.single.git_repo+"/commit/"+b:""},a.shortCommit=function(a){return a?a.substring(0,7):""},a.enableForm=function(){if(a.formEnabled()){var b=a.single.check_minutes;a.single.check_minutes=[],g(function(){a.single.check_minutes=b},100)}a.form_edit=!0},a.formEnabled=function(){return a.params.add?!1:a.single?a.form_edit?a.single.job&&a.single.job.exists?!0:!1:!0:!a.form_edit},a.validateJob=function(b){a.loading=!0,f.validateJob(b,function(){a.getSingleRelease()})},a.startJob=function(b,c){"undefined"==typeof c&&(c=function(){}),a.loading=!0,f.startJob(b,function(){c(),a.getSingleRelease()})},a.forceUpdate=function(b){f.forceUpdate(b,function(){a.getSingleRelease(function(){a.single.job.in_progress=!0}),a.mode="in_progress"})},a.stopJob=function(b,c){a.loading=!0,f.stopJob(b,function(){a.getSingleRelease(),c&&a.enableForm()})},a.ago=function(a){return a?moment(a).fromNow():"Pending"},a.params.add||a.params.details&&a.getSingleRelease()}]),bowlineApp.controller("consoleController",["$scope","$location","$http","loginModule","ENV",function(a,b,c,d,e){a.resetPasswordLink=function(){c.post(e.api_url+"/api/resetPasswordParameters",{session:d.sessionpack}).success(function(a){b.path("/register"),b.search("resetpass",a.resetpass),b.search("email",a.email),b.search("localchange","true")}.bind(this)).error(function(){console.log("ERROR: Had trouble with resetPasswordParameters from API")}.bind(this))}}]),bowlineApp.controller("profileController",["$scope","$sce","$location","$http","$routeParams","loginModule","releaseModule","$timeout","ENV",function(a,b,c,d,e,f,g,h,i){a.edit=!1,a.error="",a.save_error="",a.save_success=!1,a.profile={},this.initializer=function(){a.username="",e.username?(a.username=e.username,a.getPublicProfile()):f.status?(a.username=f.username,a.edit=!0,a.getProfile()):a.error="You need to be logged in to do that."},a.viewProfile=function(){c.path("/profile/"+a.username)},a.getPublicProfile=function(){d.post(i.api_url+"/api/getPublicProfile",{username:a.username,session:f.sessionpack}).success(function(b){a.profile=b}.bind(this)).error(function(){console.log("ERROR: Had trouble with getPublicProfile from API")}.bind(this))},a.getProfile=function(){d.post(i.api_url+"/api/getProfile",{username:a.username,session:f.sessionpack}).success(function(b){a.profile=b}.bind(this)).error(function(){console.log("ERROR: Had trouble with getProfile from API")}.bind(this))},a.saveProfile=function(){d.post(i.api_url+"/api/setProfile",{profile:a.profile,session:f.sessionpack}).success(function(b){b.error?a.save_error=b.error:(a.save_success=!0,a.save_error="",h(function(){a.save_success=!1},5e3))}.bind(this)).error(function(){console.log("ERROR: Had trouble with setProfile from API")}.bind(this))},this.initializer()}]),bowlineApp.factory("releaseModule",["$rootScope","$http","$timeout","loginModule","ENV",function(a,b,c,d,e){return new releaseModule(a,b,c,d,e)}]),bowlineApp.directive("validator",function(){return{restrict:"E",scope:{variable:"=variable",regex:"=regex",message:"=message",required:"=required",emptyok:"=emptyok"},templateUrl:"views/validator.html",controller:["$scope","$http","$attrs","$location","ENV","loginModule",function(a){"undefined"!=typeof a.required&&(a.required=!0),a.show_required=!1,a.show_failedvalid=!1,a.validateIt=function(){if("undefined"!=typeof a.variable){if("string"==typeof a.variable)if(""===a.variable&&a.required)a.show_required=!0,a.show_failedvalid=!1;else if(a.emptyok&&""===a.variable)a.show_required=!1,a.show_failedvalid=!1;else if(a.show_required=!1,a.regex){var b=new RegExp(a.regex);a.show_failedvalid=!b.test(a.variable)}else a.show_failedvalid=!1}else a.required&&(a.show_failedvalid=!1,a.show_required=!0)},a.$watch("variable",function(){a.validateIt(a.variable)})}]}}),bowlineApp.directive("spinner",function(){return{restrict:"A",replace:!0,transclude:!0,scope:{loading:"=spinner"},template:'<div style="position: relative;"><div ng-show="loading" class="my-loading-spinner-container" style="min-height: 18px; margin-bottom: 5px;"></div><div ng-hide="loading" ng-transclude></div></div>',link:function(a,b){var c={lines:11,length:2,width:3,corners:1,radius:6,rotate:0,direction:1,color:"#000",speed:.8,trail:40,shadow:!1,hwaccel:!1,className:"spinner",zIndex:2e9,top:"50%",left:"50%"},d=new Spinner(c).spin(),e=b.find(".my-loading-spinner-container")[0];e.appendChild(d.el)}}}),bowlineApp.directive("ngEnter",function(){return function(a,b,c){b.bind("keydown keypress",function(b){13===b.which&&(a.$apply(function(){a.$eval(c.ngEnter,{event:b})}),b.preventDefault())})}}),bowlineApp.directive("navbar",function(){return{restrict:"E",scope:{loggedin:"=loggedin"},templateUrl:"views/navbar.html",controller:["$scope","$http","$attrs","$location","ENV","loginModule",function(a,b,c,d,e,f){var g=io.connect(e.api_url);a.messages=[],a.$on("loginStatus",function(){g.emit("subscribe_user",{session:f.sessionpack}),g.on("buildbegins",function(b){a.messages.unshift({mode:"buildbegins",slug:b.slug,releaseid:b.releaseid,read:!1,indate:new Date}),a.$apply()}),g.on("buildcomplete",function(b){a.messages.unshift({mode:"buildcomplete",slug:b.slug,releaseid:b.releaseid,success:b.success,read:!1,indate:new Date}),a.$apply()})}),a.numberUnread=function(){if(a.messages.length){var b=0;return a.messages.forEach(function(a){a.read||b++}),b}return 0},a.clearMessages=function(){a.messages=[]},a.clickMessage=function(b){switch(a.messages[b].mode){case"buildbegins":case"buildcomplete":d.path("/knots").search("details",a.messages[b].releaseid).search("add",null).search("showbuild","true");break;default:console.log("!ERROR: clickMessage mode doesn't exist: ",a.messages[b].mode)}a.messages[b].read=!0},a.messageReadClass=function(a){return a?"message-read":"message-unread"},a.navClass=function(b){var c=d.path().substring(1)||"home";return c!==a.onPage&&(a.onPage=c),b===c?"active":""},a.secondsAgo=function(a){return moment(a).fromNow()},a.toggledAlerts=function(){},a.myKnots=function(){d.path("/knots").search("mine","true").search("add",null).search("showbuild",null).search("details",null)},a.addKnot=function(){d.path("/knots").search("add","true").search("mine",null).search("showbuild",null).search("details",null)},a.goConsole=function(){d.path("/console")},a.goProfile=function(){d.path("/profile")},a.logOut=function(){f.setLoggedOut(function(){d.path("/")})}}]}}),bowlineApp.directive("knotlist",function(){return{restrict:"E",scope:{mine:"=mine",username:"=username"},templateUrl:"views/knotlist.html",controller:["$scope","$http","$attrs","$location","ENV","loginModule","releaseModule",function(a,b,c,d,e,f,g){a.showDetails=function(a){d.path("/knots").search("details",a)},a.getReleases=function(){g.getReleases(a.mine,a.username,a.knot_search,function(b,c){b?a.error=b:a.releases=c})},a.knotSearchFilter=function(){(a.knot_search.length>=3||""===a.knot_search)&&a.getReleases()},a.ago=function(a){return a?moment(a).fromNow():"Pending"},a.getReleases()}]}}),bowlineApp.animation(".getfaded",function(){return{beforeAddClass:function(a,b,c){"ng-hide"==b?jQuery(a).animate({opacity:0},c):c()},removeClass:function(a,b,c){"ng-hide"==b?(a.css("opacity",0),jQuery(a).animate({opacity:1},c)):c()}}});
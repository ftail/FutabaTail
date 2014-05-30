'use strict';

angular.module('ftail')
.controller('ThreadCtrl', function($scope, $resource){
	var query = {};
	angular.forEach(location.search.substr(1).split('&'), function(val){
		var temp = val.split('=');
		query[temp[0]] = temp[1];
	});
	$scope.server = query.server;
	$scope.responses = [];
	$scope.isLoading = false;

	var api = $resource('/api/thread');

	$scope.loadResponse = function(){
		$scope.isLoading = true;
		var result = api.query({server:$scope.server, id:query.id}, function(){
			$scope.isLoading = false;
			if($scope.responses.length < result.length){
				angular.forEach(result, function(res, index){
					if($scope.responses[index] === undefined){
						$scope.responses[index] = res;
					}
				});
			}
		});
	}

	$scope.reload = function(e){
		e.stopPropagation();
		e.preventDefault();

		$scope.loadResponse();
	}

	$scope.loadResponse();
});
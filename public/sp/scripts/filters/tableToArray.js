'use strict';

angular.module('ftail')
.filter('tableToArray', function(){
	return function(input){
		var result = [];
		angular.forEach(input, function(row){
			angular.forEach(row, function(val){
				result.push(val);
			});
		});
		return result;
	}
});
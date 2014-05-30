'use strict';

angular.module('ftail')
.filter('filename', function(){
	return function(input){
		if(!input){
			return null;
		}
		var tmp = input.split('/');
		return tmp[tmp.length-1];
	}
});
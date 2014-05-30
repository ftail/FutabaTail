'use strict';

angular.module('ftail')
.filter('thumbnailUrl', function(){
	return function(input){
		if(!input){
			return null;
		}
		
		
		
		return input.replace(/(\.)[^\.]+$/, function(a){return 's.jpg'}).replace('src', 'thumb');
	}
});
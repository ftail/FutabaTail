'use strict';

angular.module('ftail')
.filter('autolink', function(){
	function checkImage(name){
		if(name.toLowerCase().match(/\.(jpeg|jpg|png|gif|bmp)$/)){
			return true;
		}
		return false;
	}

	return function(input){
		if(!input){
			return null;
		}
		var lines = input.split('<br>');
		var result = '';

		var thumbnails = [];
		angular.forEach(lines, function(str){
			var match;
			if(match = str.match(/https?:\/\/[^\s　]+/)){
				str = str.replace(/https?:\/\/[^\s　]+/g, function(href){
					if(checkImage(href)){
						thumbnails.push(href);
					}
					return '<a href="'+href+'" target="_blank">'+href+'</a>';
				});
			}else if(match = str.match(/s([apq])[0-9]+(\.[a-zA-Z]+)?/)){
				str = str.replace(/s([apq])[0-9]+(\.[a-zA-Z]+)?/g, function(val, type){
					var servers = {
						a:'http://www.nijibox6.com/futabafiles/001/src/',
						p:'http://www.nijibox2.com/futabafiles/003/src/',
						q:'http://www.nijibox6.com/futabafiles/mid/src/'
					};
					var href = servers[type]+val;
					if(checkImage(val)){
						thumbnails.push(href);
					}
					return '<a href="'+href+'" target="_blank">'+val+'</a>';

				});
			}else if(match = str.match(/f(u?)[0-9]+(\.[a-zA-Z]+)/)){
				str = str.replace(/f(u?)[0-9]+(\.[a-zA-Z]+)/, function(val, type){
					type = type || 'n';
					var servers = {
						u:'http://dec.2chan.net/up2/src/',
						n:'http://dec.2chan.net/up/src/'
					};
					var href = servers[type] + val;

					if(checkImage(val)){
						thumbnails.push(href);
					}
					return '<a href="'+href+'" target="_blank">'+val+'</a>';
				});
			}
			result += '<div>'+str+'</div>'
		});

		angular.forEach(thumbnails, function(src){
			result += '<img src="'+src+'" class="thumbnail" />';
		});
		return result;
	}
});
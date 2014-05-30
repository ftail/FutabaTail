'use strict';

angular.module('ftail')
.controller('CatalogCtrl', function($scope, $resource, $location, $cookies, $compile, $rootScope){
	var query = {};
	window.$scope = $scope;
	angular.forEach(location.search.substr(1).split('&'), function(val){
		var temp = val.split('=');
		query[temp[0]] = temp[1];
	});
	$scope.server = query.server;
	$scope.history = {};
	$scope.threads = [];
	$scope.thumbnail = null;
	$scope.isLoading = false;

	//カタログをロードする
	$scope.loadCatalog = function(){
		if(!query.server){
			//サーバが指定されていない, エラー
			return;
		}
		$scope.isLoading = true;
		var api = $resource('/api/catalog');
		var setting = JSON.parse(localStorage[query.server] || '{}');
		setting.cxyl = query.cxyl || setting.cxyl;
		$scope.history = setting.history || {};

		if(!setting.cxyl){
			setting.cxyl = '5x8x20';
		}

		localStorage[query.server] = JSON.stringify(setting);

		var result = api.get({server:$scope.server, cxyl:setting.cxyl},function(){
			$scope.isLoading = false;
			var readHistory = result.history;
			
			//$scope.historyの作成, result.historyにはなくて$scope.historyにある現行のスレを抽出
			angular.forEach(result.threads, function(rows){
				angular.forEach(rows, function(thread){
					if($scope.history[thread.url]){
						readHistory[thread.url] = true;
					}
				});
			});
			$scope.history = readHistory;
			$scope.threads = result.threads;


			var setting = JSON.parse(localStorage[$scope.server] || '{}');
			setting.history = $scope.history;
			localStorage[$scope.server] = JSON.stringify(setting);
		});
	}

	//レス表示
	$scope.open = function(e, thread){
		$scope.history[thread.url] = true;
		var setting = JSON.parse(localStorage[$scope.server] || '{}');
		setting.history = $scope.history;
		localStorage[$scope.server] = JSON.stringify(setting);
		return;
	}




	//オプションを表示, 未実装
	$scope.showOption = function(e){
		e.stopPropagation();
		e.preventDefault();

		alert('heyheyhey');
	}

	//オーバーレイを表示にする
	$scope.showThumbnail = function(e, url){
		e.stopPropagation();
		e.preventDefault();
		$scope.thumbnail = url.replace('cat', 'thumb');
		return ;
		var modal = angular.element(document.getElementById('thumbnailModal'));
		if(!modal || modal.length === 0){
			var modaljqLite = angular.element('<div id="thumbnailModal" ng-include="\'/views/thumbnail.html\'"></div>')
			modal = $compile(modaljqLite)($scope);
			$scope.thumbnail = url.replace('cat', 'src');
			angular.element(document.body).append(modal);
		}
		modal.css({display:'block'});
	}

	//オーバーレイを非表示にする
	$scope.closeThumbnail = function(){
		$scope.thumbnail = null;
	}

	//カタログをリロードする
	$scope.reload = function(e){
		e.stopPropagation();
		e.preventDefault();

		if(query.server){
			$scope.loadCatalog();
		}
	}

	document.title = $scope.server + ' - ' + document.title;
	$scope.loadCatalog();

});
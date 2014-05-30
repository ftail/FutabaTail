var request = require('request');
var iconv = require('iconv');
var conv = iconv.Iconv('shift-jis', 'UTF-8//TRANSLIT//IGNORE');
var cheerio = require('cheerio');

var history = {};

exports.catalog = function(_req, _res){
	var server = _req.query.server;
	if(!server){
		_res.writeHead(500);
		_res.end();
		return;
	}
	var targetUrl = 'http://'+server+'.2chan.net/b/futaba.php?mode=cat';
	var cxyl = _req.query.cxyl;
	var jar = request.jar();
	if(cxyl){
		var cookie = request.cookie('cxyl='+cxyl+';');
		jar.setCookie(cookie, targetUrl);
	}


	//cookieからposttimeを取得する関数
	function getPosttime(str){
		console.log(str);
		var temp = str.split(';');
		for(var i = 0;i < temp.length;i++){
			var value = temp[i].split('=');
			if(value[0] === 'posttime'){
				return value[1];
			}
		}
		return null;
	}

	var posttime = null;
	posttime = getPosttime(_req.headers.cookie || '');
	if(posttime){
		var cookie = request.cookie('posttime='+posttime+';');
		jar.setCookie(cookie, targetUrl);
	}

	request({
		uri: targetUrl,
		encoding: null,
		jar: jar
	}, function(err, res, body){
		if(err){
			_res.writeHead(500);
			_res.end();
			return;
		}
		//スクレイピングした結果を格納する用
		var result = {
			row: 0,
			column: 0,
			threads:[],
			history:{}
		};

		//jqueryみたいにスクレイピングする用
		var $ = cheerio.load(conv.convert(body).toString());

		//set-cookieからposttimeだけ取得
		var posttime = null;
		if(res.headers['set-cookie']){
			posttime = getPosttime(res.headers['set-cookie'][0]);
		}

		var table = $('table').eq(1);
		var rows = table.find('tr');
		result.row = rows.length;
		result.column = rows.eq(0).find('td').length;

		rows.each(function(){
			var row = [];
			result.threads.push(row);
			$(this).find('td a').each(function(){
				var a = $(this);
				var obj = {res: null, img: null, text: null, res: 0};
				obj.url = (a.attr('href') || '').split('/')[1];
				if(history[obj.url]){
					result.history[obj.url] = true;
				}
				obj.img = a.find('img').attr('src');
				var parent = a.parent();
				obj.text = parent.find('small').html() || '';
				//cheerioでスクレイピングすると日本語が文字参照の形になっているので戻す
				obj.text = obj.text.replace(/&#x([0-9A-F]+);/g, function(_,hex){
					return String.fromCharCode(parseInt(hex, 16));
				});
				obj.res = Number(parent.find('font').html());
				row.push(obj);
			});
		});
		//スレッド一覧をスクレイピング
		table.find('tr td a').map(function(){
		});


		var headers = {
			'Content-Type': 'application/json; charset=utf8;'
		};

		if(posttime){
			headers['Set-Cookie'] = 'posttime=' + posttime + ';';
		}
		console.log(headers);
		_res.writeHead(200, headers);
		_res.write(JSON.stringify(result));
		_res.end();
	});
};

function decodeStr(str){
	return str.replace(/&#x([0-9A-F]+);/g, function(_,hex){
		return String.fromCharCode(parseInt(hex, 16));
	});

}

exports.thread = function(_req, _res){
	var server = _req.query.server;
	var id = _req.query.id;
	if(!server || !id){
		_res.writeHead(500);
		_res.end();
		return;
	}
	var targetUrl = 'http://'+server+'.2chan.net/b/res/'+id;
	var jar = request.jar();

	request({
		uri: targetUrl,
		encoding: null,
		jar: jar
	}, function(err, res, body){

		var headers = {
			'Content-Type': 'application/json; charset=utf8;'
		};


		if(err){
			_res.writeHead(500, headers);
			_res.write(JSON.stringify({status:'error', reason:'unknown'}));
			_res.end();
			return;
		}

		console.log(res.statusCode);
		if(res.statusCode !== 200){
			_res.writeHead(res.statusCode, headers);
			_res.write(JSON.stringify({status:'error', reason:'not found'}));
			_res.end();
			return;
		}

		history[id] = true;
		//スクレイピングした結果を格納する用
		var result = [];

		//jqueryみたいにスクレイピングする用
		var $ = cheerio.load(conv.convert(body).toString());
		//レス部分
		var form = $('form').eq(1);

		//スレ画取得
		var obj = {};
		var img = null;
		var temp = form.find('.tue').next();
		if(temp[0].name.toUpperCase() === 'A'){
			img = $(temp).attr('href');
		}

		//0レス目 最後にもう一度スクレイピングする
		var obj = {text:null, img:null, title:null, name:null, date:null, mail:null, no:null, id:null, ip:null, soudane:0};
		var img = form.find('.tue').next()
		if(img[0].name.toUpperCase() === 'A'){
			obj.img = img.attr('href');
		}
		result.push(obj);

		function resScraping(res, obj, alreadyImageScraping){
			var obj = obj || {text:null, img:null, title:null, name:null, date:null, mail:null, no:null, id:null, ip:null, soudane:0};
			obj.text = decodeStr(res.find('blockquote').html());
			res.find('blockquote').html('');	//レスの内容が今後の正規表現に引っかからないように
			var resBody = decodeStr(res.html());
			obj.no = (resBody.match(/No\.([0-9]+)/) || [])[1];
			var soudane = res.find('#sd'+obj.no);
			if(soudane.length > 0){
				var _soudane = soudane.html();
				if(_soudane !== '+'){
					obj.soudane = Number((_soudane.match(/[0-9]+$/) || [])[0]);
				}
			}

			obj.id = (resBody.match(/ID:([0-9a-zA-Z\.\/]+)/) || [])[1];
			var temp = res.find('b');
			obj.title = decodeStr(temp.eq(0).html() || '');
			obj.name = decodeStr(temp.eq(1).html() || '');
			obj.mail = (resBody.match(/href="mailto:([^"]+)"/) || [])[1];
			obj.date = (resBody.match(/[0-9]{2}\/[0-9]{2}\/[0-9]{2}\([月火水木土日]\)[0-9]{2}:[0-9]{2}:[0-9]{2}/) || [''])[0];
			if(!alreadyImageScraping){
				obj.img = res.find('a img').parent().attr('href');
			}
			return obj;
		}

		//レス一覧をスクレイピング
		form.find('table').each(function(){
			var res = $(this).find('td').eq(1);
			result.push(resScraping(res));
		}).html('');	//0レス目のスクレイピグがしやすいように

		resScraping(form, obj, true);	//再度0レス目をスクレイピングする


		_res.writeHead(200, headers);
		_res.write(JSON.stringify(result));
		_res.end();
	});
}
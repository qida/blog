/*
 * @author bh-lay
 */
/*
@demo
-----------------------------------------------------------------
get_list: 								|		get_detail
	$.ajax({                      |       	$.ajax({
		'type':'GET',              |       		'type':'GET',
		'url':'/ajax/blog',        |       		'url':'/ajax/blog',
		'data':{                   |       		'data':{
			'act' : 'get_list',     |       			'act' : 'get_detail',
			'limit_num' : '12',		|					'id' :'123456789'
			'skip_num' : '34'			|				}
		}	       						|       	});
	});                           |
-----------------------------------------------------------------
 */

var mongo = require('../conf/mongo_connect');
var fs = require('fs');
var querystring=require('querystring');

function get_list(data,callback){
	var data = data,
		limit_num = parseInt(data['limit'])||10,
		skip_num = parseInt(data['skip'])||0;
	
	var resJSON = {
		'code':1,
		'limit':limit_num,
		'skip':skip_num,
	};
	
	var method = mongo.start();
	method.open({'collection_name':'blog_friend'},function(err,collection){
      //count the all list
		collection.count(function(err,count){
			resJSON['count'] = count;
			
			collection.find({},{limit:limit_num}).sort({id:-1}).skip(skip_num).toArray(function(err, docs) {
				method.close();
				if(err){
					resJSON.code = 2;
				}else{
					for(var i=0 in docs){
						delete docs[i]['content'];
					}
					resJSON['list'] = docs;
				}
				callback&&callback(resJSON);
			});
		});
	});
}
function get_detail(data,callback){
	var data=data,
		articleID = data['id'];
	
	var resJSON = {
		'code':1,
		'id' : data['id'],
	};
	var method = mongo.start();
	method.open({'collection_name':'blog_friend'},function(err,collection){
		collection.find({id:articleID}).toArray(function(err, docs) {
			method.close();
			if(arguments[1].length==0){
				resJSON['code'] = 2;
				resJSON['msg'] = 'could not find this blog !';				
			}else{ 
				resJSON['detail'] = docs[0];
			}
			callback&&callback(resJSON);
		});
	});
}

function this_control(url,callback){
	var search = url.split('?')[1],
		 data = querystring.parse(search);
	
	if(data['act']=='get_list'){
		get_list(data,function(json_data){
			callback&&callback(json_data);
		});
		
	}else if(data['act']=='get_detail'){
		if(data['id']){
			get_detail(data,function(json_data){
				callback&&callback(json_data);
			});
		}else{
			callback&&callback({
				'code' : 2,
				'msg' : 'plese tell me which blog article you want to get !'
			});
		}
	}else{
		callback&&callback({
			'code' : 2,
			'msg' : 'plese use [act] get_detail or get_list !'
		});
	}
}

exports.render = function (req,res_this,res){
	
	var url = req.url;

	cache.ajax(url,function(this_cache){
		res_this.json(this_cache);
	},function(save_cache){
		this_control(url,function(this_data){
			save_cache(JSON.stringify(this_data));
		});
	});
}
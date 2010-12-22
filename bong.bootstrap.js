Array.prototype.each = function(ftor){
	var len = this.length;
	if (typeof ftor != "function")
	  throw new TypeError();
	
	var thisp = arguments[1];
	for (var i = 0; i < len; i++){
	  if(i in this && !ftor.call(thisp, this[i], i, this))
	    return false;
	}
	return true;
};
NodeList.prototype.each = Array.prototype.each;
var bong = {
	_readyQueue: [],
	onready: function(ftor){
		bong._readyQueue.push(ftor);
	},
	//http://stackoverflow.com/users/119081/blixt
	_ready: function(callback){
		/* Internet Explorer */
		/*@cc_on
		@if (@_win32 || @_win64)
			document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
			document.getElementById('ieScriptLoad').onreadystatechange = function() {
				if (this.readyState == 'complete') {
					callback();
				}
			};
		@end @*/
		/* Mozilla, Chrome, Opera */
		if (document.addEventListener){
			document.addEventListener('DOMContentLoaded', callback, false);
			return true;
		}
		/* Safari, iCab, Konqueror */
		if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
			var DOMLoadTimer = setInterval(function () {
				if (/loaded|complete/i.test(document.readyState)) {
					callback();
					clearInterval(DOMLoadTimer);
					return true;
				}
			}, 10);
		}
		/* Other web browsers */
		window.onload = callback;
		return true;
	},
	console: {
		log: function(text){
			console ? console.log(text) : function(){
				window.status = text;
			}();
		},
		error: function(text){
			console ? console.error(text) : function(){
				alert(text);
			}();
		}
	},
	isArray: function(o) {
		return bong.core.util.isArray(o);
	},
	addEvent: function(elem, evType, fn){
		if(bong.core.util.isArray(elem)){
			elem.each(function(e){
				bong.addEvent(e, evType, fn);
			});
		}else{
			if(elem.addEventListener){
				elem.addEventListener(evType, function(e){
					fn.call(elem, e);
				}, false);
				return true;
			}else if(elem.attachEvent){
				return elem.attachEvent("on"+evType, function(e){
					fn.call(elem, e);
				});
			}else{
				return false;
			}
		}
	},
	removeEvent: function(elem, evType, fn, useCapture){
		if(elem.removeEventListener){
			elem.removeEventListener(evType, fn, useCapture);
			return true;
		}else if(elem.detachEvent){
			return elem.detachEvent("on"+evType, fn);
		}else{
			return false;
		}
	},
	viewport: {
		height: function(){
			if (window.innerHeight!=window.undefined) return window.innerHeight;
			if (document.compatMode=='CSS1Compat') return document.documentElement.clientHeight;
			if (document.body) return document.body.clientHeight; 
			return window.undefined; 
		},
		width: function(){
			var offset = 17;
			var width = null;
			if (window.innerWidth!=window.undefined) return window.innerWidth; 
			if (document.compatMode=='CSS1Compat') return document.documentElement.clientWidth; 
			if (document.body) return document.body.clientWidth;
		}
	},
	scroll: {
		top: function(){
			if(self.pageYOffset){
				return self.pageYOffset;
			}else if(document.documentElement && document.documentElement.scrollTop){
				return document.documentElement.scrollTop;
			}else if (document.body){
				return document.body.scrollTop;
			}
		},
		left: function(){
			if(self.pageXOffset){
				return self.pageXOffset;
			}else if(document.documentElement && document.documentElement.scrollLeft){
				return document.documentElement.scrollLeft;
			}else if (document.body){
				return document.body.scrollLeft;
			}
		}
	},
	domify: function(htmlStr, handle){
		var container = document.createElement('div');
		container.innerHTML = htmlStr;
		var dom = container.childNodes[0];
		//container will cause a very slight memory leak. :-(
		if(handle && typeof handle == 'object'){
			var elems = dom.getElementsByTagName('*');
			for(var i=0;i<elems.length;++i){
				if(elems[i].getAttribute('bong:handle')){
					handle[elems[i].getAttribute('bong:handle')] = elems[i];
				}
			}
		}
		return container.removeChild(dom);
	},
	_button: function(handle, conf){
		var dom = this.domify('<button class="bong-dialog-btn '+(conf.isDefault ? 'bong-dialog-btn-default' : '')+'">'+conf.label+'</button>');
		dom.onclick = function(){
			conf.action.call(handle);
		}
		return dom;
	},
	_activeDialog: {
		_stack: [],
		push: function(dom){
			bong._activeDialog._stack.push(dom);
		},
		top: function(){
			return bong._activeDialog._stack[bong._activeDialog._stack.length-1];
		},
		pop: function(){
			return bong._activeDialog._stack.pop();;
		}
	},
	activeDialog: function(){
		return{
			dom: function(){
				return bong._activeDialog.top();
			},
			show: function(){
				var dom = this.dom();
				if(dom.style.display == 'none'){
					dom.style.display = 'block';
				}
			},
			hide: function(){
				this.dom().style.display = 'none';
			},
			rollback: function(){
				var dom = bong._activeDialog.pop();
				bong.body().removeChild(dom);
				this.show();
			}
		};
	},
	dialog: function(conf){
		console.log(conf);
		if(!conf)conf = {};
		if(!conf.buttons)conf.buttons = [];
		if(!conf.height)conf.height = '160';
		if(!conf.width)conf.width = '300';
		var title = '';
		var body = '';
		var buttonArea = '';
		if(conf.title){
			title = '<div class="bong-dialog-title">'+conf.title;
			title += this.closable ? '<div class="bong-dialog-title-close"></div>' : '<div class="bong-dialog-title-loading"></div>';
			title += '</div>';
		}
		body = '<div class="bong-dialog-body">'+conf.content+'</div>';
		buttonArea = '<div class="bong-dialog-button-area"></bong>';
		var margin_top = (this.viewport.height()-conf.height)/3;
		var dialog = this.domify('<div class="bong-dialog-mask"><div class="bong-dialog-container"><div class="bong-dialog-wrapper" style="width: '+conf.width+'px;margin-top: '+margin_top+'px">'+title+body+buttonArea+'</div></div></div>');
		var handle = {};
		var elems = dialog.getElementsByTagName('*');
		for(var i=0;i<elems.length;++i){
			if(elems[i].getAttribute('bong:handle')){
				handle[elems[i].getAttribute('bong:handle')] = elems[i];
			}
		}
		var buttonArea = dialog.getElementsByClassName('bong-dialog-container')[0].getElementsByClassName('bong-dialog-button-area')[0];
		for(var i=0;i < conf.buttons.length;++i){
			buttonArea.appendChild(this._button(handle, conf.buttons[i]));
		}
		var container = dialog.getElementsByClassName('bong-dialog-container')[0];
		container.left = (bong.viewport.width()-parseInt(dialog.style.width))/2;
		container.top = (bong.viewport.height()-parseInt(dialog.style.height))/2;
		var content = dialog.getElementsByClassName('bong-dialog-body')[0];
		if(!conf.content && conf.href){
			bong.href(conf.href).update(content);
		}
		bong._activeDialog.push(dialog);
		bong.body().appendChild(dialog);
	},
	byId: function(id){
		return document.getElementById(id);
	},
	byClassName: function(className){
		return document.getElementsByClassName(className);
	},
	body: function(){
		return document.getElementsByTagName('body')[0];
	},
	core: {
		util: {
			isArray: function(array){
				return bong.core.util.type(array) == 'array';
			},
			isString: function(str){
				return bong.core.util.type(str) == 'string';
			},
			type: function(o){
				if(!o.constructor)
					return 'null';
				var match = o.constructor.toString().match(/function (\w+)\(\)/);
				if(match != null){
					switch(match[1].toLowerCase()){
						case 'nodelist':
						case 'array':
							return 'array';
						default:
							return match[1].toLowerCase();
					}
				}else{
					return 'null';
				}
			},
			setValue: function(elem, value){
				if(elem.context)
					elem = elem.context;
				if(elem.nodeType == 1){//ELEMENT_NODE
					if(elem.tagName.toLowerCase() == 'input' && elem.type.toLowerCase() == 'text'){
						elem.value = value;
					}else if(elem.tagName.toLowerCase() == 'input' && elem.type.toLowerCase() == 'checkbox'){
						elem.checked = !(!value);
					}else{
						elem.innerHTML = value;
					}
				}else if(elem.nodeType == 3){//TEXT_NODE
					elem.nodeValue = value;
				}
			}
		},
		_ajax: {
			_dict: function(typeText){
				var dict = {
					text: 'text/plain',
					xml:  'text/xml',
					json: 'application/json'
				};
				if(dict[typeText])return dict[typeText];
				return null;
			},
			request: function(){
				var req = false;
				//Use IE's ActiveX items to load the file.
				if(typeof ActiveXObject != 'undefined') {
					try {req = new ActiveXObject("Msxml2.XMLHTTP");}
					catch (e) {
						try {req = new ActiveXObject("Microsoft.XMLHTTP");}
						catch (E) {req = false;}
					}
				//If ActiveX is not available, use the XMLHttpRequest of Firefox/Mozilla etc. to load the document.
				} else if (window.XMLHttpRequest) {
					try {req = new XMLHttpRequest();}
					catch (e) {req = false;}
				}
				return req;
			},
			_eat: function(){
				//Do Nothing
			},
			_error: function(url, status){
				bong.console.error(url+' XHR Failed with Status Code '+status);
			},
			/**
			 * _loading is invoked twice. Once When Request Starts (with loading=true) and Once When request ends (with loading=false).
			 * @param url string
			 * @param loading bool
			 */
			_loading: function(url, loading){
				bong.console.log(url+' '+(loading ? 'Loading...' : 'Finished'));
			}
		},
		ajax: function(url, callback, conf){/*format, method, async, errCallback*/
			console.log("AJAXing "+url);
			if(!callback)callback=this._ajax._eat;
			if(!conf)conf = {};
			for(var key in ['format', 'method', 'async', 'error', 'loading']){
				if(typeof conf[key] == 'undefined')
					conf[key] = null;
			}
			if(conf.async == null)conf.async=true;
			if(conf.method == null)conf.method='GET';
			if(conf.format == null)conf.format='text';
			if(conf.error == null)conf.error=this._ajax._error;
			if(conf.loading == null)conf.loading=this._ajax._loading;
			if(!conf.params)conf.params = '';
			if(conf.args){
				conf.params += '&__bong_argument='+json.encode(conf.args);
			}
			conf.loading(url, true);
			
			var now = "uid=" + new Date().getTime();
			url += (url.indexOf("?")+1) ? "&" : "?";
			url += now;
			
			var request = this._ajax.request();
			request.open(conf.method.toUpperCase(), url, conf.async);

			if(conf.method.toLowerCase()=="post"){
				request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				request.setRequestHeader("Content-length", conf.params.length);
				request.setRequestHeader("Connection", "close");
			}
			
			request.onreadystatechange = function(){
				if(request.readyState == 4){
					if(request.status == 200){
						var responseMimeType = request.getResponseHeader('Content-Type');
						var overridenMimeType = conf.format ? bong.core._ajax._dict(conf.format) : null;

						if(overridenMimeType)
							request.overrideMimeType(overridenMimeType);
						var response = null;
						if(responseMimeType.indexOf('xml') >= 0){
							response = request.responseXML;
						}else if(responseMimeType.indexOf('json') >= 0){
							response = request.responseText.replace(/[\n\r]/g,"");
							response = eval('('+response+')');
						}else{
							response = request.responseText;
						}
						if(conf.loading)conf.loading(url, false);
						callback(response);
					}else{
						conf.error(request.status);
					}
				}
			}

			request.send(conf.params);
		}
	},
	instanciate: function(conf){
		var fnc = function(templateText){
			var dom = bong.domify(templateText);
			var handle = {};
			var elems = dialog.getElementsByTagName('*');
			for(var i=0;i<elems.length;++i){
				if(elems[i].getAttribute('bong:handle')){
					elems[i].innerHTML = conf[elems[i].getAttribute('bong:handle')];
				}
			}
		};
		if(conf.templateUrl){
			bong.href(conf.templateUrl, conf).async(fnc);
		}else{
			fnc(conf.template);
		}
	},
	href: function(url, config){
		return {
			sync: function(){

			},
			async: function(callback, conf){
				return bong.core.ajax(url, callback, (conf ? conf : config));
			},
			update: function(dom, conf){
				var conff = (conf ? conf : config);
				if(!conff)conff = {format: 'text'};
				if(!conff.format) conff.format = 'text';
				return this.async(function(response){
					if(!bong.core.util.isArray(dom)){
						bong.core.util.setValue(dom, response);
					}else{
						for(i in dom){
							bong.core.util.setValue(dom[i], response);
						}
					}
				}, conff);
			},
			freezingUpdate: function(dom){

			},
			/**
			 * async interval
			 */
			tick: function(callback, interval, conf){
				var self = this;
				return setInterval(function(){
					self.async(callback, (conf ? conf : config));
				}, interval ? interval : 2000);
			},
			/**
			 * update interval
			 */
			refresh: function(dom, interval){
				var self = this;
				return setInterval(function(){
					self.update(dom);
				}, interval ? interval : 2000);
			},
			invoke: function(callback, conf){
				return this.async(callback, (conf ? conf : config));
			},
			eval: function(conf){
				var conff = (conf ? conf : config);
				if(!conff)conff = {format: 'text'};
				if(!conff.format) conff.format = 'text';
				return this.async(function(response){
					try{
						eval(response);
					}catch(ex){
						console.error(ex);
						console.log(response);
					}
				}, conff);
			},
			/**
			 * eval interval
			 */
			periodic: function(interval, conf){
				var self = this;
				return setInterval(function(){
					self.eval((conf ? conf : config));
				}, interval ? interval : 2000);
			},
			post: function(formDom){
				_postParams = function(formDom){
					var fields = [];
					fields[0] = [];//text,password,select,textarea
					fields[1] = [];//select Multiple
					fields[2] = [];//radio groups
					fields[3] = [];//checkbox
					var formData = '';
					var formElems = formDom.elements;
					for(var i=0;i<formElems.length;++i){
						var elem = formElems[i];
						switch(elem.type){
							case 'text':
							case 'password':
							case 'select-one':
							case 'textarea':
								fields[0].push(elem);
								break;
							case 'select-multiple':
								fields[1].push(elem);
								break;
							case 'radio':
								fields[2].push(elem);
								break;
							case 'checkbox':
								fields[3].push(elem);
								break;
						}
					}
					for(var i=0;i<fields.length;++i){
						switch(i){
							case 0:{
								for(var j=0;j<fields[i].length;++j)
									formData += '&'+fields[i][j].name+'='+fields[i][j].value;
								}break;
							case 1:{
								for(var j=0;j<fields[i].length;++j){
									for(var k=0;k<fields[i][j].options.length;++k){
										if(fields[i][j].options[k].checked){
											formData += '&'+fields[i][j].name+'='+fields[i][j].options[k].value;
										}
									}
								}
								}break;
							case 2:{
								for(var j=0;j<fields[i].length;++j){
									var name = fields[i][j].name;
									var nameFields = formDom.getElementsByName(name);
									for(var k=0;k<nameFields.length;++k){
										if(nameFields[k].checked){
											formData += '&'+nameFields[k].name+'='+nameFields[k].value;
											break;
										}
									}
								}
								}break;
							case 3:{
								if(fields[i].checked){
									formData += '&'+fields[i].name+'='+fields[i].value;
								}
								}break;
						}
					}
					return formData;
				}
				return {
					async: function(){
						bong.href(url, {
							params: _postParams(formDom),
							method: 'post'
						}).async();
					},
					eval: function(){
						bong.href(url, {
							params: _postParams(formDom),
							method: 'post'
						}).eval();
					},
					update: function(dom){
						bong.href(url, {
							params: _postParams(formDom),
							method: 'post'
						}).update(dom);
					}
				};
			}
		}
	}
};

bong._ready(function(){
	for(var i=0;i<bong._readyQueue.length;++i){
		bong._readyQueue[i].call();
		bong._readyQueue.pop();
	}
});
bong.onready(function(){
	var scripts = document.getElementsByTagName('script');
	function slotize(script){
		var dom = script.parentNode;
		var event = script.event;
		var code = script.innerHTML;
		var callback = new Function(code);
		var ftor = function(){
			callback.call(dom);
		}
		//console.log(dom, event);
		bong.addEvent(dom, event, ftor);
	};
	for(var i=0;i<scripts.length;++i){
		if(scripts[i].type.toLowerCase() == 'text/bongscript'){
			slotize(scripts[i]);
/*
			scripts[i].type = "text/javascript";
			scripts[i].innerHTML = "bong.addEvent(this.parentNode, 'click',function(){"+scripts[i].innerHTML+"});";
*/
		}
	}
	
});

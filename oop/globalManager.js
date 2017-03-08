//修改dataCommon
function Globalmanager(options) {
	this.fromStr = options.fromStr;
	this.api = options.api;
	this.page = 1;
	this.firstLoad = options.firstLoad || true;
	this.isLoading = false;
	this.fixTop = options.fixTop || 52;
	this.ajaxTimeout = options.ajaxTimeout || 5000;
	this.stop = false;
	this.textCompareHeight = options.textCompareHeight || 48;
	this.$pullMoreDom = $('pull-more');
	this.globalMinUpdated = '';
	this.appendData = [];
	this.insertData = []; //
	this.insertBeforeData = [];
	this.insertAfterData = [];
	this.dateArr = [];
	this.index = '';
	this.filtrate = options.filtrate;
	this.topDateArr = [];
	this.eventTpl = options.eventTpl;
}
Globalmanager.prototype.init = function(){
	var self = this;
	self.loadpage();
	self.addFixedDate();
	$(window).on('scroll',function(){self.scrollFunc()})
}
//Loadpage
Globalmanager.prototype.loadpage = function(){
	var self = this;
	self.isLoading = true;
	$.ajax({
		url: self.api.live + self.filtrate,
		data: {
			page:self.page
		},
		dataType:'JSONP',
		success:function(res){
			console.log('loadpage is true');
			self.isLoading = false;
			if(res.results.length > 0){
				//Dom操作
				self.appendDataFunc(res.results);
				self.appendDomFunc();
				self.mianze();
				self.page++;
				$('.pull-more').text('上拉加载更多')
				if(self.firstLoad){
					self.firstLoad = false;
					self.realTime()
				}
			}
		},
		error: function(){
			console.log('loadpage is error');
			setTimeout(function(){
				self.loadpage(self.firstLoad)
			},2000)
		}
	})
}
//realtime
Globalmanager.prototype.realTime = function(){
	var self = this;
	if( self.stop ) return;
	var nowTime = Date.now();
	$.ajax({
		url: self.api.real + self.filtrate,
		data: {
			min_updated:(+globalMinUpdated) + 1,
		},
		dataType: 'JSONP',
		timeout: self.ajaxTimeout,
		success: function(res){
			console.log('realtime is success')
			if(res.results.length > 0) {
				//Dom操作
				self.insertDataFunc(res.results);
				self.afterOrBeforDom();
				self.mianze();
			}
			self.realTimeloop(nowTime);
		},
		error: function(){
			console.log('realtime is error')
			self.realTimeloop(nowTime);
		}
	})
}
//realtimeloop
Globalmanager.prototype.realTimeloop = function(nowTime){
	var self = this;
	if(nowTime) {
		var newTime = Date.now();
		var timeGap = self.ajaxTimeout - (newTime - nowTime);
		if(timeGap > 0) {
			setTimeout(function(){
				self.realTime()
			},timeGap);
		}else {
			self.realTime();
		}
	}else{
		self.realTime();
	}
}
//data处理
//appendData
Globalmanager.prototype.appendDataFunc = function(data){
	var self = this;
	self.appendData = []; // 清空数据
	var initializeObj = formatTime(data[0].createdAt);
    var initializeDay = initializeObj.monthDay;
	var $firstdate = $('#event-list .date-item:first');
    var firstDate = $firstdate.data('date');
    var $lastdate = $('#event-list .date-item:last');
    var lastDate  = $lastdate.data('date');
    if($firstdate.length === 0) {
    	var date = {
			date: initializeDay,
			monthWeek: initializeObj.monthWeek
		}
		self.appendData.push(date);
    }
    if($lastdate.length > 0) {
    	initializeDay = lastDate;
    }
	self.dataCommonFunc(data,initializeDay,'appendData');
}
//appendDom
Globalmanager.prototype.appendDomFunc = function(){
	var html = this.eventTpl({ events: this.appendData});
	var $html = $(html);
	var self = this;
	$('#event-list').append($html);
	$html.find('.text-content .text-wrap').each(function(index,item){
		// style = $(item).height();
		var style = window.getComputedStyle(item,null);
	    if(parseInt(style.height)>self.textCompareHeight){
	        $(item).closest('.text-content').next().append('<div class="display-all-btn">展开</div>')
	    }
    })
    self.addDateIndex();
    console.log(self.topDateArr)
}
//insertData 区分为after 和 before
Globalmanager.prototype.insertDataFunc = function(data){
	var self = this;
	self.insertBeforeData = [];
	self.insertAfterData = [];
	//data 的三种情况
	var $firstdate = $('#event-list .date-item:first'),
		initializeDay = $firstdate.data('date'),
		initDay = new Date(initializeDay);
	//创建新的data  这个新的data会将data中的只包括insertData
	self.getInsertData(data);
	var arr = [];
	var arr2 = [];
	//将newDate分为insertBefore和insertAfter
	self.insertData.map(function(item){
		var date = new Date(formatTime(item.createdAt.monthDay));
		if(+date > +initDay) {
			arr.push(item);
		}else{
			arr2.push(item);
		}
	})
	self.dataCommonFunc(arr,initializeDay,'insertBeforeData');
	self.dataCommonFunc(arr2,initializeDay,'insertAfterData');

}
//此时会将状态为deleted 的元素删除，小于第一个日期的更新元素，更新,并获得insertData
Globalmanager.prototype.getInsertData = function(data){
	var self = this;
	var $firstEvent = $('#event-list .event-item:first'),
		firstCreatedAt = $firstEvent.data('created-at');
	self.insertData = [];//清空数据
	data.map(function(item){
		var itemId = item.id;
		var createdAt = item.createdAt,
			updatedAt = item.createdAt,
			time = formatTime(createdAt);
		var contentExtra = $(item.text.contentExtra)
        var images  = contentExtra.find('img');
        var imgContent = processImage(images)
        images.remove();
        var extraPara = getHtmlStr(contentExtra);
        var content = item.contentHtml + extraPara;
		var $EventItemDom = $('[data-key='+itemId+']')
		if( item.status === 'deleted') {
			$('[data-key=' + itemId + ']').remove();
		}else if( firstCreatedAt >= createdAt ){
			//更新
			if($EventItemDom.length > 0) {
				$EventItemDom.find('.text-wrap').html(content);
				$EventItemDom.attr('data-updated-at',updatedAt);
			}
		}else{
			self.insertData.push(item);
		}
	})
}
//afterOrBeforDom
Globalmanager.prototype.afterOrBeforDom = function(){
	var self = this;
	var $firstD = $('#event-list .date-item:first');
	var html,$html;
	if(self.insertAfterData.length) {
		html = self.eventTpl({ events: self.insertAfterData});
		$html = $(html);
		$html.insertAfter($firstD);
		self.addDateIndex();
		$html.find('.text-content .text-wrap').each(function(index,item){
	        var style = window.getComputedStyle(item,null);
	        if(parseInt(style.height) > self.textCompareHeight) {
	            $(item).closest('.text-content ').next().append('<div class="display-all-btn">展开</div>')
	        }
	    })
	}
	if(self.insertBeforeData.length) {
		html = self.eventTpl({ events: self.insertBeforeData});
		$html = $(html);
		$html.insertBefore($firstD);
		self.addDateIndex();
		console.log(self.topDateArr)
		self.index++
		$html.find('.text-content .text-wrap').each(function(indexd,item){
	        var style = window.getComputedStyle(item,null);
	        if(parseInt(style.height) > self.textCompareHeight) {
	            $(item).closest('.text-content').next().append('<div class="display-all-btn">展开</div>')
	        }
	    })
	}
}
//addDateIndex
Globalmanager.prototype.addDateIndex = function(){
    var self = this;
    self.topDateArr = [];
    $('#event-list .date-item').each(function(index,dateItem){
        $(dateItem).attr('id','');
        $(dateItem).attr('id','event-date-' + index);
        var dateItemOffsetTop = $(dateItem).offset().top;
        console.log(dateItemOffsetTop)
        self.topDateArr.push(dateItemOffsetTop)
    });
}
//add fix-date
Globalmanager.prototype.addFixedDate = function(){
    var self = this;
    $ele = "<div id='fixed-date-container'><div class='event-date fix-date'></div>";
    $('#livenews-content').append($ele);
}
//dataCommonFunc
Globalmanager.prototype.dataCommonFunc = function(data,initializeDay,dataType){
	var self = this;
	data.map(function(item){
		var itemId = item.id;
		var createdAt = item.createdAt;
		var updatedAt = item.updatedAt;
		var time = formatTime(createdAt);
		if( initializeDay != time.monthDay ) {
			initializeDay = time.monthDay;
			date = {
				date: initializeDay,
				monthWeek: time.monthWeek
			},
			self[dataType].push(date)
		}
		var contentExtra = $(item.text.contentExtra),
			images = contentExtra.find('img'),
			imgContent = processImage(images);
			images.remove();
		var	extraPara = getHtmlStr(contentExtra);
		var tplData = {
			id: itemId,
			content: item.contentHtml + extraPara,
			importance: item.importance,
			hourMinute: time.hourMinute,
			monthDay: time.monthDay,
			monthWeek: time.monthWeek,
			createdAt: createdAt,
			updatedAt: updatedAt,
			imgContent: imgContent,
		}
		self[dataType].push(tplData);
		if(self.globalMinUpdated) {
			if( updatedAt > self.globalMinUpdated ) {
				self.globalMinUpdated = updatedAt;
			}
		}else {
			globalMinUpdated = updatedAt
		}
	})
}
//mianze
Globalmanager.prototype.mianze = function() {
	var $mianzeHave = $('#event-list .mianze');
		$firstD = $('#event-list .date-item:first');
		$mianze = $firstD.find('.mianze');
	if ($mianze.length <= 0) {
		$mianzeHave.length > 0? $mianzeHave.remove() : null;
		var $spanEl = $("<span class='mianze'>免责声明</span>");
		$firstD.append($spanEl);
	}
}
//sroll
Globalmanager.prototype.scrollFunc = function(){
	var self = this;
    var winScrollTop = $(window).scrollTop();
    if (winScrollTop + $(window).height() >= $(document).height()-10) {
        if(self.isLoading) return
        $('.pull-more').text('加载中...');
        self.loadpage(self.firstLoad);
    }
    winScrollTop > 0 ? $('#fixed-date-container').show() : $('#fixed-date-container').hide();
    var topDateArr = self.topDateArr;
    if(winScrollTop >= 0) {
        if(topDateArr.length === 1 ){
            self.index = 0
        } else {
            if(winScrollTop + self.fixTop >= topDateArr[topDateArr.length - 1])  self.index = topDateArr.length - 1;
            if(winScrollTop + self.fixTop < topDateArr[self.index]) {
                self.index = self.index -1
            } else if ( winScrollTop + self.fixTop < topDateArr[self.index + 1]){
                self.index = self.index
            } else {
                self.index + 1
            }
        }
    }
    var text = $('#event-date-' + self.index).text();
    var reg = /免责声明/;
    var newstr = '';
    var newtext = text.replace(reg,newstr)
    $('#fixed-date-container .fix-date').text(newtext)
}
// stopFunc
Globalmanager.prototype.stopFunc = function(){
	var self = this;
	self.stop = true;
	$(window).off('srcoll',self.scrollFunc);
}
//
Globalmanager.prototype.restartFunc = function(){
	var self = this;
	if( self.stop ) {
		self.stop = false;
		self.realTimeloop();
	}
	$(window).on('scroll',self.scrollFunc)
}
//
function processImage($images){
    var parent = $('<div></div>').html($images);
    $images.each(function(index,item){
        var _this = $(this);
        var src = _this.attr('src');
        var a = $('<a></a>').attr('href',src).attr('data-lightbox',src).html(_this);
        parent.append(a);
    })
    return parent.html();
}
function getHtmlStr(content){
    var parent = $('<div></div>').html(content);
    return parent.html()
}




function Xgbmanager(options){
    this.api = options.api; //xgb api
    this.isLoading = options.isLoading || false;
    this.firstLoad = options.firstLoad || true;// 默认是首次拉取
    this.headMark = '';
    this.tailMark = Math.ceil(Date.now()/1000);
    this.ajaxTimeout = options.ajaxTimeout || 5000;
    this.stop = options.stop || false;
    this.textCompareHeight = options.textCompareHeight || 48;
    this.stocksSymbolArr = [];
    this.topDateArr = [];
    this.appendData = [];
    this.insertBeforeData = [];
    this.insertAfterData = [];
    this.topDisplay = false;
    this.index = '';
    this.fixTop = options.fixTop || 0;
    this.xgbEventTpl = options.xgbEventTpl;
}
//初始化
Xgbmanager.prototype.init = function(){
    var self = this;
    //The realTimeloop function will be start By loadpage
    this.loadPage();
    this.addFixedDate();
    $(window).on('scroll',function(){self.scrollFunc()})

}
//loadPage
Xgbmanager.prototype.loadPage = function(){
    var self = this;
    self.isLoading = true;
    $.ajax({
        url:this.api,
        data: {
            TailMark: self.tailMark
        },
        type: 'GET',
        dataType: 'json',
        ajaxTimeout: self.ajaxTimeout,
        success: function(res){
            self.isLoading = false;
            //创建dom
            if( res.NewMsgs.length > 0){
                self.appendDataFunc(res.NewMsgs);
                self.tailMark = res.TailMark;
                if( self.firstLoad ) {
                    self.firstLoad = false;
                    self.headMark = res.HeadMark;
                    self.realTime();
                }
            }
        },
        error:function(){
            setTimeout(function(){
                self.loadPage(self.firstLoad)
            },2000)
        }
    })
}
//realtime
Xgbmanager.prototype.realTime = function(){
    var self = this;
    if( self.stop ) return;
    var nowTime = Date.now();
    $.ajax({
        url: self.api,
        data: {
            HeadMark: self.headMark
        },
        type: 'GET',
        dataType: 'json',
        ajaxTimeout: self.ajaxTimeout,
        success: function(res){
            if(self.stop) return
            if( res.NewMsgs.length > 0 ) {
                self.headMark = res.HeadMark;
                self.insertDataFunc( res.NewMsgs );
            }
            if( res.UpdatedMsgs.length > 0 ) {
                self.updateOrDeletedDomFunc( res.UpdatedMsgs, 'update')
            }
            if( res.DeletedMsgs.length > 0 ) {
                self.updateOrDeletedDomFunc( res.DeletedMsgs, 'delete')
            }
            self.realTimeLoopFunc(nowTime);
        },
        error: function(){
            if(self.stop) return
            self.realTimeLoopFunc(nowTime)
        }
    })
}
//realtimeLoopFunc
Xgbmanager.prototype.realTimeLoopFunc = function(nowTime){
    var self = this;
    if(self.stop) return
    if(nowTime) {
        var newTime = Date.now();
        var timeGap = self.ajaxTimeout - ( newTime - nowTime )
        if( timeGap > 0 ) {
            setTimeout(function(){
                if(self.stop) return
                self.realTime();
            },timeGap)
        } else {
            if(self.stop) return
            self.realTime();
        }
    }else {
        if(self.stop) return
        self.realTime();
    }
}
//appendData 处理data 我们在处理data后直接调用 对应的插入dom的方法
Xgbmanager.prototype.appendDataFunc = function(data){
    this.appendData = [];// 初始化
    this.stocksArr(data);
    var self = this;
    var initializeDay = formatTime(data[0].CreatedAtInSec).monthDay;
    var $firstdate = $('#xgb-list .date-item:first');
    var firstDate = $firstdate.data('date');
    var $lastdate = $('#xgb-list .date-item:last');
    var lastDate  = $lastdate.data('date');
    var dataCommon = 'dataCommon',appendDomFunc = 'appendDomFunc';
    if ($firstdate.length ==  0) {
        var date = {
            date : initializeDay,
            monthWeek:formatTime(data[0].CreatedAtInSec).monthWeek
        }
        self.appendData.push(date);
    }
    if($lastdate.length > 0 ) {
        initializeDay = lastDate;
    }
    if( this.stocksSymbolArr.length > 0) {
        this.getStocksDataAndPutIn(data,dataCommon,initializeDay,'appendData',appendDomFunc);
    }else {
        this.dataCommon(data,initializeDay,'appendData');
        this.appendDomFunc()
    }

}
//Dom
Xgbmanager.prototype.appendDomFunc = function() {
    var html = this.xgbEventTpl({xgb:this.appendData});
    var $html = $(html);
    var self = this;
    $('#xgb-list').append($html);
    $html.find('.text-content .text-wrap').each(function(index,item){
        var style = window.getComputedStyle(item,null);
        if(parseInt(style.height) > self.textCompareHeight) {
            $(item).closest('.text-content').next().append('<div class="display-all-btn">展开</div>')
        }
    })
    self.addDateIndex();
    self.mianze();

}
//insertData
Xgbmanager.prototype.insertDataFunc = function(data){
    data.reverse();//反转数组顺序
    this.insertBeforeData = [];
    this.insertAfterData = []; // 清空数据
    this.stocksArr(data);
    var self = this;
    var first = new Date(formatTime(data[0].CreatedAtInSec).monthDay);
    var last = new Date(formatTime(data[data.length-1].CreatedAtInSec).monthDay);
    var insertThreeCases = 'insertThreeCases';
    if( this.stocksSymbolArr.length > 0 ) {
        this.getStocksDataAndPutIn(data,insertThreeCases,first,last);
    } else {
        this.insertThreeCases(data,first,last)
    }
}
//insertDataThreeCase
Xgbmanager.prototype.insertThreeCases = function(data,first,last){
    var $firstdate = $('#xgb-list .date-item:first');
    var firstDate = $firstdate.data('date');
    var initDay = new Date(firstDate);
    var arr = [];
    var arr2 = [];
    //1.data数组的最小日期大于初始日期
    if( +last > +initDay ) {
        this.dataCommon(data,firstDate,'insertBeforeData');
        this.insertDomFunc('before');
    }
    //2.data数组的最大日期等于初始日期
    if(+first === +initDay) {
        this.dataCommon(data,firstDate,'insertAfterData');
        this.insertDomFunc('after')
    }
    //3.初始日期 在最小日期和最大日期之间
    if(+first > +initDay >= +last) {
        for( var i = 0; i < data.length; i++ ){
            var date = new Date(formatTime(data[i].CreatedAtInSec).monthDay)
            if (+date > +initDay) {
                arr.push(data[i])
            }else{
                arr2.push(data[i])
            }
        }
        this.dataCommon(arr2,firstDate,'insertAfterData');
        this.insertDomFunc('after');
        this.dataCommon(arr,firstDate,'insertBeforeData');
        this.insertDomFunc('before');
    }
}
//insertDomFunc
Xgbmanager.prototype.insertDomFunc = function(type){
    var $firstD = $('#xgb-list .date-item:first');
    var html,$html;
    var self = this;
    if(type === 'before') {
        html = self.xgbEventTpl({ xgb: self.insertBeforeData })
        $html = $(html);
        $html.insertBefore($firstD);
        self.index++;
        self.addDateIndex();
    }else {
        html = self.xgbEventTpl({ xgb: self.insertAfterData })
        $html = $(html)
        $html.insertAfter($firstD);
        self.addDateIndex();
    }
    $html.find('.text-content .text-wrap').each(function(indexd,item){
        var style = window.getComputedStyle(item,null);
        if(parseInt(style.height) > self.textCompareHeight) {
            $(item).closest('.text-content').next().append('<div class="display-all-btn">展开</div>')
        }
    })
    self.mianze();
}
//update or delete
Xgbmanager.prototype.updateOrDeletedDomFunc = function(data,type){
    $.each(data,function(index,value){
        var eventItem = value,
            eventItemId = eventItem.Id;
        var $eventItemDom = $('#xgb-list [data-key=' + eventItemId + ']');
        if($eventItemDom.length > 0) {
            if(type === 'update') {
                $eventItemDom.find('.text-wrap').html('【' + eventItem.Title + '】' + eventItem.Summary);
                console.log('update is success!');
            }else {
                $eventItemDom.remove();
                console.log('delete is success!')
            }
        }
    })
}
//alldata dealwith this func
//1.将stocks put in stocksSymbolArr
Xgbmanager.prototype.stocksArr = function (data){
    var self = this;
    self.stocksSymbolArr = [];//初始化
    data.map(function(value){
        if(value.Stocks) {
            value.Stocks.map(function(va){
                self.stocksSymbolArr.push(va.Symbol);
            })
        }
    })
}
//2.获取股票的涨跌幅
Xgbmanager.prototype.getStocksDataAndPutIn = function(data,callback,callArgu1,callArgu2,callback2){
    var self = this;
    self.stocksSymbolArr = unique(self.stocksSymbolArr);
    stockSymbolStr = this.stocksSymbolArr.join(',');
    $.ajax({
        url: '//mdc.wallstreetcn.com/real?en_prod_code=' + stockSymbolStr + '&fields=px_change_rate',
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            var snap = res.data.snapshot;
            data.map(function(value){
                if(value.Stocks) {
                    value.Stocks.map(function(v){
                        if( !snap[v.Symbol] ) {
                            v.rate = '--'
                        }else {
                            v.rate = snap[v.Symbol][0].toFixed(2);
                            v.rate > 0 ? v.className = 'up' : v.className = 'down';
                        }
                        v.link = stocksLink(v.Symbol);
                    })
                }
            })
            if(self[callback]) {
                self[callback](data,callArgu1,callArgu2)
            }
            if(self[callback2]) {
                self[callback2]();
            }
        },
        error: function(){
            console.log('The Api of getStocks is error')
        }
    })
}
//3.dataCommon
Xgbmanager.prototype.dataCommon = function(data,initializeDay,dataType){
    var self = this;
    data.map(function(value){
        var eventItem = value;
        xgbContent = '';
        var eventId = eventItem.Id;
        var time = formatTime(eventItem.CreatedAtInSec);
        if( initializeDay != time.monthDay ) {
            initializeDay = time.monthDay;
            monthWeek = time.monthWeek;
            var date = {
                    date : initializeDay,
                    monthWeek: monthWeek
                }
            self[dataType].push(date);
        }
        if ( eventItem.Title ) {
            xgbContent = '【' + eventItem.Title + '】' + eventItem.Summary;
        } else {
            xgbContent = eventItem.Summary;
        }
        //限制stocks的个数 最多为两个
        var stocksArray = [];
        if(eventItem.Stocks && eventItem.Stocks.length > 2) {
            for (var h= 0; h < eventItem.Stocks.length; h++) {
                if (h < 1) {
                    stocksArray.push(eventItem.Stocks[h]);
                }
            }
        } else {
            stocksArray = eventItem.Stocks;
        }
        var tplData = {
                id: eventId,
                content: xgbContent,
                hourMinute: time.hourMinute,
                monthDay: time.monthDay,
                monthWeek: time.monthWeek,
                createdAt: eventItem.CreatedAt,
                updatedAt: eventItem.UpdatedAt,
                stocks: stocksArray
                // from:fromStr,
            }
        self[dataType].push(tplData)
    })
}
//mianze
Xgbmanager.prototype.mianze = function(){
    var $mianzeHave = $('#xgb-list .mianze');
    var $firstD = $('#xgb-list .date-item:first');
    var $mianze = $firstD.find('.mianze');
    if( $mianze.length <= 0 ){
        $mianzeHave.length > 0 ? $mianzeHave.remove() : null;
        var $spanEl = $("<span class='mianze' >免责声明</span>");
        $firstD.append($spanEl)
    }
}
//scrollFunc
Xgbmanager.prototype.scrollFunc = function(){
    var self = this;
    var winScrollTop = $(window).scrollTop();
    if (winScrollTop + $(window).height() >= $(document).height()-10) {
        if(self.isLoading) return
        $('.pull-more').text('加载中...');
        self.loadPage(self.firstLoad);
    }
    if(winScrollTop > 0) {
        $('#fixed-date-container').show()
    }else{
        $('#fixed-date-container').hide()
    }
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
    var text = $('#xgb-date-' + self.index).text();
    var reg = /免责声明/;
    var newstr = '';
    var newtext = text.replace(reg,newstr)
    $('#fixed-date-container .fix-date').text(newtext)
}
//XgbStop
Xgbmanager.prototype.stopFunc = function(){
    var self = this;
    self.stop = true;
    $(window).off('scroll',self.scrollFunc)
}
//restart
Xgbmanager.prototype.restartFunc = function(){
    var self = this;
    if( self.stop ) {
        self.stop = false;
        self.realTimeLoopFunc()
    }
    $(window).on('scroll',self.scrollFunc)
}
//
Xgbmanager.prototype.addDateIndex = function(){
    var self = this;
    self.topDateArr = [];
    $('#xgb-list .date-item').each(function(index,dateItem){
        $(dateItem).attr('id','');
        $(dateItem).attr('id','xgb-date-' + index);
        var dateItemOffsetTop = $(dateItem).offset().top;
        self.topDateArr.push(dateItemOffsetTop)
    });
}
//
Xgbmanager.prototype.addFixedDate = function(){
    var self = this;
    $ele = "<div id='fixed-date-container'><div class='event-date fix-date'></div>";
    $('#xgb-content').append($ele);
}
//数组去重
function unique(array) {
 var newArray = [];
    for (var i = 0; i < array.length; i ++){
        if(newArray.indexOf(array[i]) == -1) newArray.push(array[i]);
    }
    return newArray;
}
//yht股票link
function stocksLink (str) {
    var Arr = str.split('.');
    var str = Arr[1];
    var urldec = decodeURIComponent(window.location.href);
    var fromTest = /from=yht/;
    var linkTest = /&sLink=/;
    if(fromTest.test(urldec) && linkTest.test(urldec)) {
        var urlSlink = urldec.split('&sLink=')[1];
        var reg = /\$code\$/;
        var reg2 = /\$market\$/;
        var url = urlSlink.replace(reg,Arr[0]);
        if (str == 'SZ') {
            var link = url.replace(reg2,'0');
            return link
        } else if( str == 'SS'){
            var link = url.replace(reg2,'1');
            return link
        }
    }
}
//格式化时间
function formatTime(time) {
    time = +time*1000;
    var d = new Date(time),
        year = d.getFullYear(),
        month = d.getMonth() + 1,
        date = d.getDate(),
        day = d.getDay(),
        hour = d.getHours(),
        minute = d.getMinutes();
    // hour minute month day ，小于 10的 时候加0操作
     if(hour<10){hour = '0'+hour}
    if(minute<10){minute = '0'+minute}
    if(month<10){month = '0'+month}
    if(date<10){date = '0'+date}
    // 获取week
    switch (day) {
        case 0:
            day = "星期日";
            break;
        case 1:
            day = "星期一";
            break;
        case 2:
            day = "星期二";
            break;
        case 3:
            day = "星期三";
            break;
        case 4:
            day = "星期四";
            break;
        case 5:
            day = "星期五";
            break;
        case 6:
            day = "星期六";
            break;
        defalut:
            console.log('the function of formatTime is broken or the argument is defalut')
            break;
    }

    var hourMinute = hour + ':' + minute,
        monthDay = year + '-' + month + '-' + date,
        monthWeek = year + "年" + month + "月" + date + "日   " + day;

    return {
        hourMinute: hourMinute,
        monthDay: monthDay,
        monthWeek: monthWeek
    }
}
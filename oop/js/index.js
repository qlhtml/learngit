/**
 * Created by wscn on 2016/12/1.
 */
jQuery.extend({
    popup: function(msg){
        $('#toast').show();
        $('#toast-content').html(msg||'');
        setTimeout(function () {
            $('#toast').hide();
        }, 1500);
    }
});

$(function() {
    FastClick.attach(document.body);

    var lightbox = new Lightbox();

lightbox.option({
    'resizeDuration': 200,
    fadeDuration:200
})
//筛选
var selectStr = localStorage['UrlStr'];
var seletobj = getQueryObject(selectStr);
var liveStr = getSelecStr( seletobj);
//formwhichApp
var fromobj = getQueryObject(location.href);
var fromStr = getFromWhichApp(fromobj);

var eventSource = $('#event-tpl').html();
var eventTpl = Handlebars.compile(eventSource);

var xgbEventSource = $('#xgb-tpl').html();
var xgbEventTpl =  Handlebars.compile(xgbEventSource);

var textContentHeight = '40px';

var Xgbojb = new Xgbmanager({
    api:'//bao.wallstreetcn.com/api/alliance/zhaoshang/msgH5?limit=30',
    fixTop: 52,
    xgbEventTpl: xgbEventTpl
})
Xgbojb.init();
var api = {
    live: '//openapi.wallstreetcn.com//v2/livenews?limit=30&channelId=1&filter=招商证券',
    real: '//openapi.wallstreetcn.com//v2/livenews/realtime?channelId=1&filter=招商证券',
}
var liveObj = new Globalmanager({
    api: api,
    fixTop: 52,
    eventTpl: eventTpl
})
liveObj.init();
liveObj.stopFunc();

function getSelecStr(obj) {
    var livestr = '';
    if(obj['cid[]']){
        var cidStr =  obj['cid[]'];
        var cidArr = cidStr.split(',');
        for (var i = 0 ; i < cidArr.length; i ++){
            livestr += ('cid[]='+cidArr[i]+'&');
        }
    }
    if(obj['type']) {
        livestr += ('type='+obj['type']+'&');
    }
    if(obj['importance']) {
        livestr += ('importance='+obj['importance'])
    }

    if(livestr.slice(0,1) != '&' && livestr) {
        livestr = '&' + livestr;
    }
    return livestr
}

function getFromWhichApp(obj){
    var from = '';
    if(obj['from'] == 'tg') {
        return from = 'tg';
    } else{
        return from = '';
    }
}

$('#event-list,#xgb-list').on('click','.display-all-btn',function(){
    var self = $(this);
    if(self.hasClass('active')) {
        self.parent().prev('.text-content').css({
            'max-height': textContentHeight,
            'overflow': 'hidden'
        })
        self.text('展开').removeClass('active')
    }else{
        self.parent().prev('.text-content').css({
            'max-height': 'initial',
            'overflow': 'auto'
        })
        self.text('收起').addClass('active')

    }
})

$('#event-list,#xgb-list').on('click','.text-content',function(){
    var _this = $(this)
    var disBtn = _this.next().find('.display-all-btn');
    if(disBtn.length>0){
        disBtn.trigger('click')
    }

})
// $('#event-list,#xgb-list').on('taphold','.text-content',{duration: 500},function(e){
//     var $self = $(this);
//     // $self.attr('id','copy');
//     // $self.attr('data-clipboard-target','#copythis');
//     var $textDom = $(this).find('.text-wrap');
//     // copyToClipboard($textDom)
//     // $textDom.attr('id','copythis');
//     var $copyEle = $('#copy');
//     var $copyThis = $('#copythis')
//     if($copyEle.length > 0 && $copyThis.length > 0){
//         $copyEle.remove();
//         $copyThis.remove();
//     }
//     var Element = $("<div id='copy' style='display: none' data-clipboard-target='#copythis'></div> <div id='copythis' >"+$textDom.text()+"</div>");
//     console.log(Element)
//     $('body').append(Element);
//
//     Element.trigger('click');
//
// })

    // $(document).on('click','#copy',function(){
    //     var clip = new Clipboard('#copy');
    //
    // })


// 检测A股tab是否含active
var $xgbContent = $('#xgb-content');
setTimeout(function(){
    if ( $xgbContent.hasClass('active')) {
        console.log("显示A股")
        ga("send", {
            hitType: 'event',
            eventCategory: '显示A股',
            eventAction: 'click',
            eventLabel: '显示A股',
            'hitCallback': function(){
                console.log('显示成功');
            }
        })
    } else {
        console.log("显示全球")
        ga("send", {
            hitType: 'event',
            eventCategory: '显示全球',
            eventAction:'click',
            eventLabel: '显示全球',
            'hitCallback': function(){
                console.log('显示成功');
            }
        })
    }
},500)

$('.tab-item').each(function(index,item){
    $(this).click(function() {
        var $icon  = $(this).find('.shaixuan');
        $('.tab-item').removeClass('active');
        $(this).addClass('active');
        if($icon.length > 0){
            $icon.addClass('active');
            Xgbojb.stopFunc();
            liveObj.restartFunc();
        }else {
            $('.shaixuan').removeClass('active');
            liveObj.stopFunc();
            Xgbojb.restartFunc();
        }
        tabContents.removeClass('active').eq(index).addClass('active');
        if ( $xgbContent.hasClass('active')) {
            console.log("显示A")
            ga("send", {
                hitType: 'event',
                eventCategory: '显示A股',
                eventAction: 'click',
                eventLabel: '显示A股',
            })
        } else {
            console.log("显示B")
            ga("send", {
                hitType: 'event',
                eventCategory: '显示全球',
                eventAction:'click',
                eventLabel: '显示全球',
            })
        }
    })
});


var tabContents = $('.tab-content');
//刷选click
$('#tab-live').on('click','.shaixuan',function(){
    if(fromStr == 'tg') {
        window.location.href = './filtrate.html?from=tg'
    }else{
        click();
    }
})
//智远一户通点击事件
function openToCms(toUrl){
    if (navigator.userAgent.match(/cmschina/i)) {
        window.location.href="http://www.zsmodel.com/hybrid?jsonParam="+encodeURIComponent(JSON.stringify({url:toUrl}));
    }
    else{
        window.location.href='./filtrate.html?from=yht';
    }
}
function click(){
    //调用示例
    var toUrl="http://" + window.location.host + '/filtrate.html?from=yht';
    openToCms(toUrl);
}
//http://m.wscn.com/livenews?wallstreetcnwx=stocks 选股宝tab规范
var tabChoice=getQueryObject(location.href);
var xgbTabNameMap='wallstreetcnwx';
if(tabChoice[xgbTabNameMap]=='stocks'){
    $('#tab-xgb').trigger('click');
}

if (fromStr != 'tg') {
    setInterval(function(){
        var setInt= localStorage['UrlStr'];
        if(selectStr != setInt ) {
            selectStr = setInt;
            seletobj = getQueryObject(selectStr);
            liveStr = getSelecStr( seletobj);
            LivePage = 1;
            $('#event-list').html('')
            liveStopObj.loadPage(true)
        };
    },1000);
}
// 免责声明点击
$(document).on('click','.mianze',function(){
    $('.disclaimer').show();
    $('.disclaimer-btn').removeClass('active')
});

$(document).on('click','.disclaimer-btn',function(){
    $(this).addClass('active');
    $('.disclaimer').hide();
})

        function getQueryObject(url) {
    url = url == null ? window.location.href : url;
    var search = url.substring(url.lastIndexOf("?") + 1);
    var obj = {};
    var reg = /([^?&=]+)=([^?&=]*)/g;
    search.replace(reg, function (rs, $1, $2) {
        var name = decodeURIComponent($1);
        var val = decodeURIComponent($2);
        val = String(val);
        obj[name] = val;
        return rs;
    });
    return obj;
}
});

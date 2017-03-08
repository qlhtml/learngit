/**
 * Created by wscn on 2016/12/7.
 */
$(function (){
    //引入fastclick
    FastClick.attach(document.body);

    var url = window.location.href;
    var fromStr = getQueryObject(url).from;
    var selectedObj = getQueryObject(localStorage['UrlStr']);
    console.log(selectedObj)
    init(selectedObj)
    function init(obj){
        if(obj['cid[]']) {
            console.log(1)
            var cidStr =  obj['cid[]'];
            var cidArr = cidStr.split(',');
            for (var i = 0 ; i < cidArr.length; i ++){
                var $eve = $("input[name='cid[]'][value="+cidArr[i]+"]");
                var $eveParent = $eve.parent();
                $eveParent.addClass('checked')
            }
        };
        if(obj['importance']) {
           var $eventDom =  $('[name=importance]');
            var $parentDom = $eventDom.parent();
            $parentDom.addClass('checked');
            $parentDom.prev().removeClass('checked');

        };
        if(obj['type']) {
            console.log(3)
            var $eventDom = $("[name='type'][value='"+obj['type']+"']");
            var $parentDom = $eventDom.parent();
            $parentDom.siblings().removeClass('checked');
            $parentDom.addClass('checked');

        }
    }


    $('.menu-common').on('click','.menu-checkbox',function(){
        $(this).toggleClass('checked');
    })

    $('.menu-important').on('click','.menu-checkbox',function(){
        $(this).addClass('checked');
        $(this).siblings().removeClass('checked')
    })

    $('.menu-type').on('click','.menu-checkbox',function(){
        $(this).addClass('checked');
        $(this).siblings().removeClass('checked')
    })

    $('.footer').on('click','.finish',function(){
        var  UrlStr = '';
        var cids = [];
            $('.checked').map(function(index){
                var $eventItem = $('.checked').eq(index);
                var $eventInput = $eventItem.find('[type=checkbox]');
                var $eventText = $eventItem.find('.text');
                var text  = $eventText.text();
                if (text != '全部') {
                    var name = $eventInput.attr('name');
                    var value = $eventInput.val();
                    if (name == 'cid[]') {
                        cids.push(value)
                    }else {
                        UrlStr += (name +'='+value+'&');
                    }
                }
            });
        if (cids.length) {
            cids = cids.join(',');
            UrlStr += 'cid[]='+cids;
        }
        console.log(UrlStr)
        localStorage['UrlStr'] = UrlStr;
        if( fromStr == 'tg') {
            window.location.href= './index.html?from=tg';
        }else{
            window.location.href = 'http://www.zsmodel.com/zs.close?';
        }

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



})
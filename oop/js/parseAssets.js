/**
 * example text:
 * 李克强谈自贸区：简政放权和对外开放两个“轮子”要一起,李克强在福建自贸区厦门片区考察时说，创立自贸区李克强谈自贸区：
 * 简政放权和对外开放两个“轮子”要一起,李克强在福建自贸区厦门片区考察时说，创立自贸区.$中航资本(600020)$ $中国北车(600985)$
 *
 * */

var removeFunc = function (match) {
    return '';
}
var remove$ = function (match) {
    return match.substring(1, match.length - 1);
}

var remove$AndCode = function (match, p1, p2, p3) {
    return p1;
}

parseUtilFunc = {
    removeFunc: removeFunc,
    remove$Func: remove$,
    remvoe$AndCodeFunc: remove$AndCode
}
/**
 * @param p : 需要解析的文字，不改变
 * @param formatFn : 类型是function, 参数是$code$ 和code,返回值会替换$code$.默认的函数，不做替换
 * @returns {{newP: string, codes: Array}}，newP是新的文字，codes是所有code组成的数组
 */
parseTextWithStockCode =  function(p, formatFn) {
    formatFn = formatFn || remove$AndCode;
    var stocks = [];
    var stocksUniqueMap = {}
    //p1:中文,(),（）,英文,数字,Ａ-Ｚ,*
    //p2:字母，(目前应该只有SH，SZ)
    //p3:数字
    //var newP =  p.replace(/\$(\*[\s\(\)\（\）a-zA-Z0-9Ａ-Ｚ\u4E00-\u9FA5\uF900-\uFA2D]+)\((SH|SZ)([0-9a-zA-Z]+)\)\$/g,function(match,p1,p2,p3){
    var newP = p.replace(/\$([^\$\(\)]+)\((SH|SZ)([0-9a-zA-Z]+)\)\$/g, function (match, p1, p2, p3) {
        if (!(p3 in stocksUniqueMap)) {
            stocksUniqueMap[p3] = '';
            stocks.push({
                stockName: p1,
                market: p2,
                stockId: p3
            })
        }
        return formatFn(match, p1, p2, p3)
    })

    return {
        newP: newP,
        stocks: stocks
    }
}


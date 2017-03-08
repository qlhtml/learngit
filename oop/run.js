var any = {loc: 1};
amy.loc++;
var ben = {loc: 9};
ben.loc++
var carlike = function(obj,loc) {
    obj.loc = loc;
    obj.move = function(){
        obj.loc++;
    }
    return obj;
}
var amy = carlike({}, 1);
amy.move();

function log2Ceil(a) {
    var n = a+1;
    var r = 0;
    while (n>0) {
        r++;
        n \= 2;
    }
    return r;
}

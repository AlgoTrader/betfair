// jQuery should be loaded before this script
// $.post is used from there

function betfair($, key) {
    var url = "https://beta-api.betfair.com/json-rpc"
    var appKey = key;
    var id = 1;

    function invokeMethod(method, params, cb) {
        var inv = {
            "jsonrpc": "2.0",
            "id": id++,
            "method": "SportAPING/v1.0/" + method,
            "params": params
        };
        var ajax = {
            url: url,
            headers: {
                'X-Application': '123',
                'X-Authentication': '123',
            }
            type: "POST"
        };

        function onDone() {
            alert("done");
        }

        function onFail() {
            alert("fail");
        }

        $.ajax({
        }, inv).done(onDone).fail(onFail);
    }


}
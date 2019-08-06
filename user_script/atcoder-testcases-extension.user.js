// ==UserScript==
// @name           AtCoder TestCase Extension
// @namespace      tatsumack
// @version        1.0.5
// @description    AtCoderテストケースへのリンクを追加します
// @author         tatsumack
// @license        MIT
// @supportURL     https://github.com/tatsumack/atcoder-testcase-extension/issues
// @match          https://atcoder.jp/contests/*/submissions/*
// ==/UserScript==

(function (callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "//code.jquery.com/jquery-3.3.1.min.js");
    script.addEventListener('load', function() {
        var script = document.createElement("script");
        script.textContent = "(" + callback.toString() + ")(jQuery.noConflict(true));";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
})(function ($) {
    const url = location.href;
    const contestName = getContestName();
    const cacheDataKey = "atcoder-testcase-" + contestName;
    const cacheFetchedAtKey = "atcoder-test-case-last-fetched-at-" + contestName;
    const cacheMin = 10;

    function onSuccess(data) {
        if (data.status != "success") return;
        localStorage.setItem(cacheDataKey, JSON.stringify(data));

        var problemId = getProbremId();
        var content = JSON.parse(data.content);
        draw(content[problemId].in, content[problemId].out);
    }

    function draw(inUrl, outUrl) {
        if (!inUrl || !outUrl) return;

        $("table:eq(2) tr:gt(0) td:nth-child(1)").each(function () {
            var testCaseName = $(this).text();
            var fileName = getFileName(testCaseName);
            $(this).append(" [ <a href='" + inUrl + "?preview=" + fileName.in + "'>in</a> / <a href='" + outUrl + "?preview=" + fileName.out + "'>out</a> ]");
        });
    }

    function getFileName(testCaseName) {
        let inFile = testCaseName;
        let outFile = testCaseName;
        const exceptionList = ['arc096', 'abc095', 'abc043', 'arc059', 'nikkei2019-qual', 'abc120'];
        if (testCaseName.indexOf(".txt") === -1 && exceptionList.indexOf(contestName) === -1) {
            inFile += ".in";
            outFile += ".out";
        }
        return {in: inFile, out: outFile};
    }

    function getContestName() {
        return url.split("/")[4];
    }

    function getProbremId() {
        return $("td a").first().text().slice(0, 1).toUpperCase();
    }

    function main() {
        const data = localStorage.getItem(cacheDataKey);
        const lastFetchedAt = localStorage.getItem(cacheFetchedAtKey);
        if (data && lastFetchedAt && new Date().getTime() < Number(lastFetchedAt) + cacheMin * 60 * 1000) {
            onSuccess(JSON.parse(data));
            return;
        }

        $.ajax({
            url: "https://script.google.com/macros/s/AKfycbyUlYoF05ux7M1jBRnXwYkV9SjJIL9MNlHbWiB_eFiE93_91Hs/exec?contest=" + contestName,
            dataType: "json",
            type: "get",
            crossDomain: true,
            success: onSuccess
        });
        localStorage.setItem(cacheFetchedAtKey, new Date().getTime().toString());
    }

    main();

});

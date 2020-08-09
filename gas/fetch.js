var URL = "https://www.dropbox.com/sh/arnpe0ef5wds8cv/AAAk_SECQ2Nc6SVGii3rHX6Fa";
var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID"));

function fetchContests() {
    var urls = getUrls(URL);

    var sheet = ss.getSheetByName("contests");
    sheet.clear();

    sheet.getRange(1, 1).setValue("id");
    sheet.getRange(1, 2).setValue("url");

    var rows = 2;
    urls.forEach(function (url) {
        var id = url.split('/')[2].split('_ABC')[0];
        sheet.getRange(rows, 1).setValue(id);
        sheet.getRange(rows, 2).setValue(url);
        rows++;
    });
}

function fetchProblems() {
    var sheet = ss.getSheetByName("contests");
    var values = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();

    var res = [];
    for (var row in values) {
        if (row == 0) continue;
        var data = {};
        for (var col in values[row]) {
            if (!values[row][col]) continue;
            data[values[0][col]] = values[row][col];
        }
        if (0 === Object.keys(data).length) continue;
        res.push(data);
    }

    res.forEach(function (data) {
        var contestSheet = ss.getSheetByName(data.id);
        if (contestSheet != null) return;

        contestSheet = ss.insertSheet(data.id);
        contestSheet.getRange(1, 1).setValue("id");
        contestSheet.getRange(1, 2).setValue("type");
        contestSheet.getRange(1, 3).setValue("url");
        var problemUrls = getUrls("https://www.dropbox.com/sh/" + data.url);
        var rows = 2;
        problemUrls.forEach(function (problemUrl) {
            var inoutUrls = getUrls("https://www.dropbox.com/sh/" + problemUrl);

            inoutUrls.forEach(function (inoutUrl) {
                var problem = inoutUrl.split('/')[3];
                var type = inoutUrl.split('/')[4];
                contestSheet.getRange(rows, 1).setValue(problem);
                contestSheet.getRange(rows, 2).setValue(type);
                contestSheet.getRange(rows, 3).setValue("https://www.dropbox.com/sh/" + inoutUrl);
                rows++;
            });
        });
        contestSheet.deleteRows(rows, contestSheet.getRange("A:A").getLastRow() - rows);
    });
}

function fetchABCARC() {
    var abc = [];
    for (var p = 1; p <= 30; ++p) {
        var url = "https://atcoder.jp/contests/archive?ratedType=1" + "&page=" + p;
        var archive = fetchContestsArchive(url);
        if (archive === null) break;

        for (var i = 0; i < archive.times.length; ++i) {
            var data = {};
            data['time'] = archive.times[i];
            data['contest'] = archive.contests[i];
            abc.push(data);
        }
    }

    var arc = {};
    for (var p = 1; p <= 30; ++p) {
        var url = "https://atcoder.jp/contests/archive?ratedType=2" + "&page=" + p;
        var archive = fetchContestsArchive(url);
        if (archive === null) break;

        for (var i = 0; i < archive.times.length; ++i) {
            arc[archive.times[i]] = archive.contests[i];
        }
    }

    var sheet = ss.getSheetByName("abc-arc");
    sheet.clear();

    sheet.getRange(1, 1).setValue("time");
    sheet.getRange(1, 2).setValue("abc");
    sheet.getRange(1, 3).setValue("arc");

    var rows = 2;
    abc.forEach(function (row) {
        sheet.getRange(rows, 1).setValue(row.time);
        sheet.getRange(rows, 2).setValue(row.contest);
        if (arc[row.time]) {
            sheet.getRange(rows, 3).setValue(arc[row.time]);
        }
        rows++;
    });
}

function fetchContestsArchive(url) {
    var response = UrlFetchApp.fetch(url);
    Utilities.sleep(1000);
    if (response.getContentText().indexOf("No contests") > 0) return null;

    var times = Parser.data(response.getContentText())
        .from("<time class='fixtime fixtime-full'>")
        .to("</time>")
        .iterate();

    var contests = Parser.data(response.getContentText())
        .from("</span> <a href='/contests/")
        .to("'>")
        .iterate();

    return {times: times, contests: contests};
}

function getUrls(targetUrl) {
    var payload =
        {
            url: targetUrl,
            renderType: 'HTML',
            outputAsJson: true
        };
    payload = JSON.stringify(payload);
    payload = encodeURIComponent(payload);

    key = PropertiesService.getScriptProperties().getProperty("PHANTOM_JS_CLOUD_KEY");
    var scrapingUrl = 'https://phantomjscloud.com/api/browser/v2/' + key + '/?request=' + payload;
    Logger.log(scrapingUrl);

    const options = {
        method: "get",
        followRedirects: true
    };
    const response = UrlFetchApp.fetch(scrapingUrl, options);
    Utilities.sleep(1000);
    var json = JSON.parse(response.getContentText());
    return Parser.data(json.content.data)
        .from('<a href=\"https://www.dropbox.com/sh/')
        .to('?dl=0\" class=\"sl-link sl-link--folder\">')
        .iterate();
}


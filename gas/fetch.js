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
        url = url.replace('https://www.dropbox.com/sh/', '');
        url = url.replace('?dl=0', '');
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
            var inoutUrls = getUrls(problemUrl);

            inoutUrls.forEach(function (inoutUrl) {
                inoutUrl = inoutUrl.replace('https://www.dropbox.com/sh/', '');
                inoutUrl = inoutUrl.replace('?dl=0', '');
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

function fetchTestcaseExts() {
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

    var cnt = 0;
    res.forEach(function (data) {
        if (cnt >= 3) return;

        var contestSheet = ss.getSheetByName(data.id);
        if (contestSheet == null) return;

        var label = contestSheet.getRange(1, 4).getValue();
        if (label === 'exts') return;
        contestSheet.getRange(1, 4).setValue('exts');

        Logger.log(data.id);
        var values = contestSheet.getRange(1, 1, contestSheet.getLastRow(), 3).getValues();
        for (let row = 0; row < values.length; row++) {
            if (row == 0) continue;
            var url = values[row][2];
            if (url === '') continue;
            Logger.log(url);
            var urls = getUrls(url);
            if (urls.length === 0) continue;
            var fileUrl = urls[0];
            fileUrl = fileUrl.replace('https://www.dropbox.com/sh/', '');
            fileUrl = fileUrl.replace('?dl=0', '');
            var fileName = fileUrl.split('/').slice(-1)[0];
            var arr = fileName.split('.');
            var ext = arr.length <= 1 ? 'none' : arr.slice(-1)[0];
            Logger.log(ext);
            contestSheet.getRange(row + 1, 4).setValue(ext);
        }
        cnt++;
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

    var body = Parser.data(response.getContentText()).from('<tbody>').to('</tbody>').build();

    var contests = Parser.data(body)
        .from('<a href="/contests/')
        .to('">')
        .iterate();

    return {times: times, contests: contests};
}

function getUrls(targetUrl) {
    var headers = {
        'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty("GCLOUD_AUTH_TOKEN")
    };
    var options = {
        'method': 'GET',
        'headers': headers,
    };
    var response = UrlFetchApp.fetch('https://asia-northeast1-project-id-0053938540869249501.cloudfunctions.net/scraping_dropbox?url=' + encodeURIComponent(targetUrl), options).getContentText();
    return JSON.parse(response);
}


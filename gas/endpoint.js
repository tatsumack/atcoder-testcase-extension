function doGet(e) {
    var contestParam = e.parameter.contest;
    var contestId = convertContestId(contestParam);
    var problemData = getProblemData(contestId);

    var res = {};
    res.status = problemData ? "success" : "fail";
    res.content = problemData;
    Logger.log(res);

    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(res));

    return output;
}

function getProblemData(contestId) {
    if (!contestId) return;

    var sheet = ss.getSheetByName(contestId);
    if (sheet == null) return;

    var values = sheet.getRange(1, 1, sheet.getLastRow(), 4).getValues();

    var res = {};
    for (var row in values) {
        if (row == 0) continue;
        var id = values[row][0];
        var type = values[row][1];
        var url = values[row][2];
        var ext = values[row][3];
        res[id] = res[id] || {};
        res[id][type] = url;
        res[id]['ext'] = ext;
    }

    return JSON.stringify(res);
}

function convertContestId(contestId) {
    if (!contestId) return;

    var sheet = ss.getSheetByName("abc-arc");

    var values = sheet.getRange(1, 2, 1000, 3).getValues();

    var map = {};
    for (var row in values) {
        if (row == 0) continue;
        var abc = values[row][0];
        var arc = values[row][1];
        map[abc] = arc;
    }

    map["nikkei2019-qual"] = "2019nikkei_qual";
    map["tenka1-2018"]     = "tenka1_2018";
    contestId = map[contestId] || contestId;

    if (contestId.indexOf("abc") === 0 || contestId.indexOf("arc") === 0 || contestId.indexOf("agc") === 0) {
        contestId = contestId.toUpperCase();
    }
    return contestId
}
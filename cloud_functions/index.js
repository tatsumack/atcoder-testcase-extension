/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const puppeteer = require('puppeteer');
let page;

async function getBrowserPage() {
    // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    return browser.newPage();
}

async function sleep(t) {
    return await new Promise(r => {
        setTimeout(() => {
            r();
        }, t);
    });
}

const getAccessToken = function (header) {
    if (!header) return null;
    const match = header.match(/^Bearer\s+([^\s]+)$/);
    return match ? match[1] : null;
}

exports.parseDropbox = async (req, res) => {
    const accessToken = getAccessToken(req.get('Authorization'));
    if (accessToken != process.env.ACCESS_TOKEN) {
        res.status(403).send("invalid access token")
        return
    }

    if (!req.query.url) {
        res.status(404).send("missing query parameter")
        return
    }

    if (!page) {
        page = await getBrowserPage();
    }

    await page.goto(req.query.url);
    await sleep(2000);

    const result = await page.evaluate(getUrls);

    res.set('Content-Type', 'application/json');
    res.send(result);
};

function getUrls() {
    console.log(document.querySelectorAll('.sl-link').length)
    console.log(document.body.innerHTML)
    return [...document.querySelectorAll('.sl-link')].map(node => {
        return node.href
    })
}

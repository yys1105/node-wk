const fs = require("fs")
const mommoth = require("mammoth")
const cheerio = require('cheerio')
const path = require('path');
const server = require('./server')

fs.readFile(__dirname + '/template/demo.html', { flag: 'r+', encoding: 'utf8' }, (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    // console.log(data);
    fs.writeFile(__dirname + '/output/test.html', data, [], (err) => {
        if (err) throw err;
        fs.open(__dirname + '/output/test.html', 'r', '0666', function (err, fd) {
            server.create();
          });
    })
});

// mommoth.convertToHtml({ path: "../docs/test.docx" }).then((res) => {

//     var html = res.value

//     fs.writeFile(__dirname + '/output/test.html', html, [], () => { })

// }).done()
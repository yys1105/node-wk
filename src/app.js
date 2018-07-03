const fs = require("fs")
const mommoth = require("mammoth")
const cheerio = require('cheerio')
const path = require('path');
const server = require('./server')

fs.readFile(__dirname + '/template/temp.html', { flag: 'r+', encoding: 'utf8' }, (err, data) => {
    if (err) throw err;
    // 获取模板内容
    var templateHtml = data;

    // 批量处理word文件转成html
    fs.readdir(__dirname + '/docs/', (err, docs) => {
        docs.forEach((doc) => {
            // 获取文件的路径
            let docPath = path.normalize(__dirname + '/docs/' + doc)
            // word转成html
            mommoth.convertToHtml({ path: docPath }).then((momRes) => {
                // 获取转成html的内容
                var docHtml = momRes.value,
                    outFileName = doc.replace('.docx', ''),
                    $ = cheerio.load(`<div id='root'>${docHtml}</div>`),
                    children = $('#root')[0].children;
                htmlBetween = (first, last) => {
                    let html = null
                    for (let i = 0; i < children.length; i++) {
                        if ($(children[i]).text() == first) {
                            html = ""
                        } else if (html != null && $(children[i]).text() != last) {
                            html += $.html(children[i])
                        }
                        if ($(children[i]).text() == last) {
                            return html;
                        }
                    }
                }
                // 生成临时html文件
                fs.writeFile(__dirname + '/temporary/' + outFileName + '-临时.html', momRes.value, [], (err) => {
                    if (err) throw err;
                    console.log('--------->生成临时html文件')
                })

                // 替换标题名
                templateHtml = templateHtml.replace('{{title}}', outFileName);

                // 替换检测项目概述
                var summary = htmlBetween('检测项目概述', '您的检测结果')
                templateHtml = templateHtml.replace('{{summary}}', summary);

                // 替换您的检测结果
                children.forEach((el) => {
                    if (el.name == 'table') {
                        let trs = $(el).find('tr'),
                            trStr = '',
                            trHeader = true
                        for (let i = 0; i < trs.length; i++) {
                            let tr = trs[i];
                            if ($(tr).text() == '基因检测位点变异类型参考序列检测结果变异情况' && trHeader) {
                                trStr += $.html(tr)
                                trHeader = false
                            } 
                            if($(tr).text() != '基因检测位点变异类型参考序列检测结果变异情况') {
                                trStr += $.html(tr)
                            }
                        }
                        console.log(trStr);
                        console.log($(trStr));
                        
                        templateHtml = templateHtml.replace('{{resTable}}', $.html($(trStr)));
                    }
                })


                // 替换内容后的字符串写入文件 templateHtml
                fs.writeFile(__dirname + '/output/' + outFileName + '.html', templateHtml, [], (err) => {
                    if (err) throw err;
                    // fs.open(__dirname +'/output/'+outFileName+'.html', 'r', '0666', function (err, fd) {
                    //     server.create();
                    //   });
                    console.log('--------->写入最终文件')
                })
            }).done()
        })
    })


    // fs.writeFile(__dirname + '/output/test.html', data, [], (err) => {
    //     if (err) throw err;
    //     fs.open(__dirname + '/output/test.html', 'r', '0666', function (err, fd) {
    //         server.create();
    //       });
    // })
});
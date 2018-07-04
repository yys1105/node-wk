const fs = require("fs")
const mommoth = require("mammoth")
const cheerio = require('cheerio')
const path = require('path');
const server = require('./server')
const escaper = require("true-html-escape");

fs.readFile(__dirname + '/template/temp.html', { flag: 'r+', encoding: 'utf8' }, (err, data) => {
    if (err) throw err;
    

    // 批量处理word文件转成html
    fs.readdir(__dirname + '/docs/', (err, docs) => {
        docs.forEach((doc) => {
            // 获取模板内容
            var templateHtml = data;
            // 获取文件的路径
            let docPath = path.normalize(__dirname + '/docs/' + doc)
            // word转成html
            mommoth.convertToHtml({ path: docPath }).then((momRes) => {
                // 获取转成html的内容
                var docHtml = momRes.value,
                    outFileName = doc.replace('.docx', ''),
                    $ = cheerio.load(`<div id='root'>${docHtml}</div>`),
                    children = $('#root')[0].children;
                // 查找中间内容，返回字符串
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
                htmlToArr = (start, end) => {
                    let startIndex = 0,
                    endIndex = 0;
                    for (let i = 0; i < children.length; i++) {
                        if ($(children[i]).text() == start) {
                            startIndex = i
                        }
                        if ($(children[i]).text() == end) {
                            endIndex = i
                        }
                    }
                    return children.slice(startIndex+1,endIndex)
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
                        templateHtml = templateHtml.replace('{{resTable}}', $.html($(trStr)));
                    }
                })
                
                // 替换预防保健建议
                var getProposalArr = () => {
                    let startIndex = 0,
                    endIndex = 0;
                    for (let i = 0; i < children.length; i++) {
                        if ($(children[i]).text() == '预防保健建议') {
                            startIndex = i
                        }
                        if (/^关于/.test($(children[i]).text())) {
                            endIndex = i
                        }
                    }
                    return children.slice(startIndex+1,endIndex)
                }
                var replaceHtml = (str) => {
                    if(/^<p>[一二三四五六七八九十]+[.|、]/.test(escaper.unescape($.html(str)))){
                        return '<div class="title-1">'+$(str).text()+'</div>'
                    }else if(/^<p>[1-9][0-9]*[.|、]/.test(escaper.unescape($.html(str)))){
                        return '<div class="title-2">'+$(str).text()+'</div>'
                    }else if(/★★适宜饮食/.test(escaper.unescape($.html(str)))){
                        return '<div class="food">适宜饮食</div>'
                    }else if(/禁忌饮食/.test(escaper.unescape($.html(str)))){
                        return '<div class="food err">禁忌饮食</div>'
                    }else{
                        return $.html(str)
                    }
                }
                var getProposal = () => {
                    var proposalArr = getProposalArr()
                    var html = ''
                    for (let i = 0; i < proposalArr.length; i++) {
                        const el = proposalArr[i];
                        html += replaceHtml(el)
                    }
                    return html
                }
                let proposal = getProposal()
                templateHtml = templateHtml.replace('{{proposal}}', $.html($(proposal)));

                // 替换关于疾病
                for (let i = 0; i < children.length; i++) {
                    if(/^关于/.test($(children[i]).text())){
                        let aboutName = $(children[i]).text()
                        templateHtml = templateHtml.replace('{{aboutName}}', aboutName);
                    }
                }
                var getAboutArr = () => {
                    let startIndex = 0,
                    endIndex = 0;
                    for (let i = 0; i < children.length; i++) {
                        if ($(children[i]).text() == '重要科学依据') {
                            endIndex = i
                        }
                        if (/^关于/.test($(children[i]).text())) {
                            startIndex = i
                        }
                    }
                    return children.slice(startIndex+1,endIndex)
                }
                var getAbout = () => {
                    var aboutArr = getAboutArr()
                    var html = ''
                    for (let i = 0; i < aboutArr.length; i++) {
                        const el = aboutArr[i];
                        html += replaceHtml(el)
                    }
                    return html
                }
                let about = getAbout()
                templateHtml = templateHtml.replace('{{about}}', $.html($(about)));

                // 替换文献
                let literature = htmlBetween('重要科学依据', '温馨提示')
                templateHtml = templateHtml.replace('{{literature}}', $.html($(literature)));
                

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
    // server.create();

    // fs.writeFile(__dirname + '/output/test.html', data, [], (err) => {
    //     if (err) throw err;
    //     fs.open(__dirname + '/output/test.html', 'r', '0666', function (err, fd) {
    //         server.create();
    //       });
    // })
});
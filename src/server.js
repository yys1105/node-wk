var http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')
var mime=require("mime");
var open = require("open");
var server = http.createServer(function(request, response){
    //获取输入的url解析后的对象
    var pathObj = url.parse(request.url, true);
    //static文件夹的绝对路径
    var staticPath = path.resolve(__dirname, 'output')
    //获取资源文件绝对路径
    var filePath = path.join(staticPath, decodeURIComponent(pathObj.pathname));
    //异步读取file

    fs.readFile(filePath, function(err, fileContent){
        if(err){
            response.writeHead(404, 'not found')
            response.end('<h1>404 Not Found</h1>')
        }else{
            response.setHeader('Content-Type',mime.getType(filePath)+';charset=utf-8');
            response.write(fileContent)
            response.end()
        }
    })
})


exports.create = function(){
    server.listen(8080)
    console.log('visit http://localhost:8080/')
    open('http://localhost:8080/', "chrome")
};
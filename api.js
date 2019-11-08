/**
 * Created by Administrator on 2019/11/7.
 */

//给前台返回数据的文件
let  express =  require('express')

//1-2 实例化当前的框架

const  app  =  new  express()

//4.导入mongodb数据库模块
var  mongoClient = require('mongodb').MongoClient;  //用来连接数据库

var DBurl = "mongodb://127.0.0.1:27017/myShop"   // 设置当前连接数据库的地址

//接口1 获取类别列表
app.get('/getTypes',function(req,res){
    //    链接数据看

    // res.writeHead(200,{"Content-Type":"application/json"})
    //
    // res.write(JSON.stringify("123456789"))
    mongoClient.connect(DBurl,function(err,db){
        //操作数据表
        db.collection('type').find().toArray(function(errs,ress){
            //获取数据之后，将所有的类别渲染到type/index模板中
            for(let i=0;i<ress.length;i++){
                ress[i].image='http://localhost:3000/'+ress[i].image.replace(/\\/g,'\/');
                if(ress[i].del) { //已经被删除则不展示
                    ress.splice(i,1);
                    i--;
                }
            }
            res.send(ress);
        })
    })
})

//接口2 获取轮播图1
// app.get('/getTypes',function(req,res){
//
// }
app.listen('3001',"127.0.0.1")
//  整个后台项目的入口文件（index.js）

//1.express框架测试

//1-1 导入 express

let  express =  require('express')
//导入 multiparty模块 处理 post数据已经文件上传数据的接参问题
var multiparty = require('multiparty');
//1-2 实例化当前的框架

const  app  =  new  express()


//2 使用ejs模板引擎  (ejs模板引擎 默认的模板目录 views)

//3.设置静态资源目录 (use设置中间件)
app.use(express.static('static'))
app.use("/upload",express.static('upload'))

//4.导入mongodb数据库模块
var  mongoClient = require('mongodb').MongoClient;  //用来连接数据库

var DBurl = "mongodb://127.0.0.1:27017/myShop"   // 设置当前连接数据库的地址

//当前网站根目录下，执行 npm  install  ejs  --save

//给当前express框架指定使用的模板引擎
app.set('view engine',"ejs")

//1-3 设置路由
app.get('/',function(req,res){
    res.render('type/index',{})
})

// ======================类别管理模块=====================

//类别路由1-查询类别
app.get('/type/index',function(req,res){
    //类别显示
    mongoClient.connect(DBurl,function(err,db){

        //操作数据表
        db.collection('type').find().toArray(function(errs,ress){
            //获取数据之后，将所有的类别渲染到type/index模板中
            for(let i=0;i<ress.length;i++){
                if(ress[i].del) { //已经被删除则不展示
                    ress.splice(i,1);
                    i--;
                }
            }
            res.render('type/index',{
                types:ress
            })
        })
    })

})

//类别路由2-添加类别
app.post('/type/doAdd',function(req,res){
    //实例化
    var form = new multiparty.Form();
    //指定文件上传目录
    form.uploadDir = "upload/type"
    form.parse(req, function(err, fields, files) {
        // fields    就是post数据
        // files    就是文件上传的信息
        let  typename = fields.typename[0];
        let  pic = files.pic[0].path;
        // console.log(files);

        //链接数据库，进行添加操作

        mongoClient.connect(DBurl,function(err,db){
            let length = db.collection('type').find().toArray((err1,arr1)=>{
                let length = arr1.length;
                db.collection('type').insertOne({
                    id:(length+1).toString(),
                    name:typename,
                    image:pic
                },function(errs,ress){
                    if(ress){
                        //添加成功
                        //  是否有图片上传
                        if(files.pic[0].size == 0){
                            fs.unlink(pic,function(){})
                        }
                        //数据库是否添加成功
                        res.send("<script>alert('类别添加成功！');location.href='/type/index'  </script>")
                    }else{
                        //添加失败
                        //有上传图图片，但是呢，数据库添加失败，此时需要把上传好的图片也要删除掉
                        if(pic){
                            fs.unlink(pic,function(){})
                        }
                        res.send("<script>alert('类别添加失败！');history.back() </script>")
                    }
                })
            })
        })
        res.send("<script>alert('类别添加成功！');location.href='/type/index'  </script>");

    });
})
app.get('/type/add',function(req,res){
    res.render('type/add',{})
})

//类别路由3-删除类别
app.get("/type/delete",function(req,res){
    // 处理id的数据类型  ObjectId
    let id =  req.query.id;
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection("type").updateOne({id}, {$set: {del: "1"}}, (err, result) => {
            if (err) {
                res.send("<script>alert('删除失败！');history.back() </script>")
            } else if (result['modifiedCount'] > 0) {// 有受影响的行数
                res.send("<script>alert('删除成功！');location.href='/type/index'</script>")
            } else {
                res.send("<script>alert('删除失败！可能已经被删除！');history.back() </script>")
            }
        });
    })

})

//类别路由4-修改类别
app.get('/type/edit',function(req,res){
    let id=req.query.id;
    mongoClient.connect(DBurl,function(err,db){
        //操作数据表
        db.collection('type').find({id}).toArray(function(errs,ress){
            //获取数据之后，将所有的类别渲染到type/index模板中
            // console.log(ress);
            res.render('type/edit',{
                types:ress[0]
            })
        })
    })
})


// -------------------------------------商品路由---------------------------------------------
//商品路由1-查询商品
app.get("/goods/index",function(req,res){
    //获取goods商品信息
    //类别显示
    mongoClient.connect(DBurl,function(err,db){
        //操作数据表
        db.collection('goods').find().toArray(function(errs,ress){
            // console.log(ress);
            //  ress 商品数组里面 只有 类别id ，现在需要每个商品的类别名称
            ress.forEach((item,index)=>{
                //此时类别id 在item内保存
                // x小米1  1000   小米  23456789 （小米 --  魅族）
                db.collection('type').findOne({"id":item.tid},function(errss,resss){
                    //
                    ress[index].typename = resss.name;
                })
            })

            setTimeout(()=>{
                //获取数据之后，将所有的类别渲染到type/index模板中
                res.render("goods/index",{
                    goods:ress
                })
            },50)
            // console.log(ress)
        })
    })
})

//商品路由2-添加商品
app.post('/goods/doAdd',function(req,res){
    //实例化
    var form = new multiparty.Form();
    //指定文件上传目录
    form.uploadDir = "upload/goods"
    form.parse(req, function(err, fields, files) {
        // fields    就是post数据
        // files    就是文件上传的信息
        console.log(fields);
        let  goodsname = fields.goodsname[0];
        let  typeId = fields.typeId[0];
        let  price = parseFloat(fields.price[0]);
        let  total = parseInt(fields.total[0]);
        let  state = parseInt(fields.state[0]);
        let  description = fields.description[0];
        let  pic = files.pic[0].path;
        // console.log(files);

        //链接数据库，进行添加操作

        mongoClient.connect(DBurl,function(err,db){
            let length = db.collection('goods').find().toArray((err1,arr1)=>{
                let length = arr1.length;
                db.collection('goods').insertOne({
                    gid:(length+1).toString(),
                    name:goodsname,
                    tid:typeId,
                    price,
                    total,
                    state,
                    describe:description,
                    image:pic
                },function(errs,ress){
                    if(ress){
                        //添加成功
                        //  是否有图片上传
                        if(files.pic[0].size == 0){
                            fs.unlink(pic,function(){})
                        }
                        //数据库是否添加成功
                        res.send("<script>alert('商品添加成功！');location.href='/goods/index'  </script>")
                    }else{
                        //添加失败
                        //有上传图图片，但是呢，数据库添加失败，此时需要把上传好的图片也要删除掉
                        if(pic){
                            fs.unlink(pic,function(){})
                        }
                        res.send("<script>alert('商品添加失败！');history.back() </script>")
                    }
                })
            })
        })
        // res.send("<script>alert('商品添加成功！');location.href='/goods/index'  </script>");

    });
})
app.get('/goods/add',function(req,res){
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('type').find().toArray((err,arr)=>{
            for(i=0;i<arr.length;i++){
                if(arr[i].del){
                    arr.splice(i,1);
                    i--;
                }
            }
            res.render('goods/add',{
                types:arr
            })
        })
    })
})

//1-4 设置端口
app.listen('3000',"127.0.0.1")
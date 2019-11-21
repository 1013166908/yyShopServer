/**
 * Created by Administrator on 2019/11/7.
 */

let bodyParser = require('body-parser');
//给前台返回数据的文件
let  express =  require('express')

//1-2 实例化当前的框架

const  app  =  new  express()

//2. post数据
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//3.设置静态资源目录 (use设置中间件)
// app.use(express.static('static'))
// app.use("/upload",express.static('upload'))

//4.导入mongodb数据库模块
var  mongoClient = require('mongodb').MongoClient;  //用来连接数据库

var DBurl = "mongodb://127.0.0.1:27017/myShop"   // 设置当前连接数据库的地址

//接口1 注册
app.post('/register',function(req,res){
    //    链接数据看
    let {usn,psw}=req.body;
    mongoClient.connect(DBurl,function(err,db){
        //操作数据表
        db.collection('user').find({usn:req.body.usn}).toArray(function(err_u,arr_u){
            //获取数据之后，将所有的类别渲染到type/index模板中
            // console.log(arr_u);
            let ReState="1000"
            if(arr_u.length){ //存在
                ReState="1001"
            }
            else{ //不存在
                db.collection('user').find().toArray((err_u1,arr_u1)=>{
                    let length=arr_u1.length;
                    db.collection("user").insertOne({
                        uid: String(length+1),
                        usn,
                        psw
                    }, (err, result) => {
                        if (err) {ReState="1001"}
                        if (result['insertedCount'] > 0) {ReState="1000"};
                    })
                })
            }
            res.writeHead(200,{"Content-Type":"application/json"});
            res.write(JSON.stringify(ReState));
            res.end();
        })
    })
})
//接口2 登录
app.post('/login',function(req,res){
    //    链接数据看
    mongoClient.connect(DBurl,function(err,db){
        //操作数据表
        db.collection('user').find({usn:req.body.usn}).toArray(function(err_u,arr_u){
            //获取数据之后，将所有的类别渲染到type/index模板中
            // console.log(arr_u);
            let ReState="1000"
            if(arr_u.length){ //存在
                if(arr_u[0].psw!=req.body.psw){
                    ReState="1001"
                }
            }
            else{ //不存在
                ReState="1001"
            }
            res.writeHead(200,{"Content-Type":"application/json"});
            res.write(JSON.stringify(ReState));
            res.end();
        })
    })
})

//接口3 获取全部类别列表
app.get('/getTypes',function(req,res){
    //    链接数据看

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
            res.writeHead(200,{"Content-Type":"application/json"})
            res.write(JSON.stringify(ress))
            res.end();
        })
    })
})

//接口4 获取商品列表
app.get('/getGoods',function(req,res){
    //根据请求参数设置查询条件
    let find_key={};
    if(req.query.tid) find_key={tid:req.query.tid}; //按照类别查找
    else if(req.query.gid) find_key={gid:req.query.gid}; //按照商品查找
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('goods').find(find_key).toArray((err_g,arr_g)=>{
            for(let i=0;i<arr_g.length;i++){
                arr_g[i].image='http://localhost:3000/'+arr_g[i].image.replace(/\\/g,'\/');
            }
            res.writeHead(200,{"Content-Type":"application/json"})
            res.write(JSON.stringify(arr_g));
            res.end();
        })
    })
})

//接口5 查看用户购物车内商品
app.get('/getCart',function(req,res){
    //根据请求参数设置查询条件
    let find_key={usn:req.query.usn};
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('cart').find(find_key).toArray((err_c,arr_c)=>{ //查询购物车表
            let goodsList=[];
            if(arr_c.length) {
                arr_c.map((item, index) => {
                    db.collection('goods').find({gid: item.gid}).toArray((err_g, arr_g) => {
                        arr_g[0].num=item.num;
                        arr_g[0].image='http://localhost:3000/'+arr_g[0].image.replace(/\\/g,'\/');
                        goodsList.push(arr_g[0]);
                        if (index == arr_c.length -1) {
                            setTimeout(()=>{
                                res.writeHead(200, {"Content-Type": "application/json"})
                                res.write(JSON.stringify(goodsList));
                                res.end();
                            },1000)
                        }
                    })
                })
            }
            else{//用户购物车为空
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write(JSON.stringify(""));
                res.end();
            }

        })
    })
})

//接口6 添加/修改购物车内商品
app.post('/addToCart',(req,res)=>{
    let {usn,gid,num}=req.body;
    num=parseInt(num);
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('cart').find({usn,gid}).toArray((err_f,arr_f)=>{
            if(arr_f.length){//已经添加过该商品
                let old_num=arr_f[0].num;
                db.collection('cart').update({usn,gid},{$set:{"num":old_num+num}},(err_u,res_u)=>{
                    // msg="添加成功
                })
            }
            else{
                db.collection('cart').insertOne(
                    {usn,gid,num},(err_i,res_i)=>{
                        // msg="添加成功"
                    }
                )
            }
        })
    })
    res.writeHead(200, {"Content-Type": "application/json"})
    res.write("添加成功");
    res.end();
})

//接口7 查询用户默认地址
app.get('/getAddress',(req,res)=>{
    let usn=req.query.usn;
    // console.log(usn);
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('user').find({usn}).toArray((err_u,arr_u)=>{
            let adid=arr_u[0].adid;
            db.collection('address').find({adid}).toArray((err_a,arr_a)=>{
               if(arr_a.length){
                   res.writeHead(200, {"Content-Type": "application/json"})
                   res.write(JSON.stringify(arr_a[0]));
                   res.end();
               }
               else{
                   res.writeHead(200, {"Content-Type": "application/json"})
                   res.write("0");
                   res.end();
               }
            })
        })
    })
})

//接口8 查询用户全部地址
app.get('/getAllAddress',(req,res)=>{
    let usn=req.query.usn;
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('address').find({usn}).toArray((err_a,arr_a)=>{
            if(arr_a.length){
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write(JSON.stringify(arr_a));
                res.end();
            }
            else{
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write("1001");
                res.end();
            }
        })
    })
})

//接口9 改变默认地址
app.post('/changeAddress',(req,res)=>{
    let {usn,adid}=req.body;
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('user').update({usn},{$set:{"adid":adid}},(err_u,res_u)=>{
            res.writeHead(200, {"Content-Type": "application/json"})
            res.write("1000");
            res.end();
        })
    })
})

//接口10 删除地址
app.post('/deleteAddress',(req,res)=>{
    let {adid}=req.body;
    console.log(adid);
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('address').deleteOne({adid}, (err_u, result) => {
            if (err_u) {
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write("1001");
                res.end();
            }else if (result['deletedCount'] > 0){
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write("1002");
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"})
                res.write("1000");
                res.end();
            }
        })
    })
})

//接口11 添加地址
app.post('/addAddress',(req,res)=>{
    console.log(req.body);
    let {usn,addr,pcode}=req.body;
    let ReState="1000";
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('address').find().toArray((err_a,arr_a)=>{
            let length=arr_a.length;
            db.collection("address").insertOne({
                adid: String(length+1),
                usn,
                addr,
                pcode
            }, (err, result) => {
                if (err) {ReState="1001"}
                if (result['insertedCount'] > 0) {
                    ReState="1000"

                };
            })
        })
    })
    res.writeHead(200, {"Content-Type": "application/json"})
    res.write(ReState);
    res.end();
})

//接口12 下单
app.post('/addList',(req,res)=>{
    console.log(req.body);
    let {usn,goodsList}=req.body;
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('list').find().toArray((err_l,arr_l)=>{
            let length=arr_l.length;
            let lid=String(length+1);
            db.collection("list").insertOne({ //添加订单号
                lid,
                usn,
                state:0
            }, (err, result) => {
                if (err) {ReState="1001"}
                if (result['insertedCount'] > 0) { //添加订单号成功后添加订单详情
                    goodsList.map((item,index)=>{
                        db.collection("list-goods").insertOne({ //添加订单详情
                            lid,
                            gid:item.gid,
                            num:item.num
                        })
                        db.collection('cart').deleteOne({usn,gid:item.gid}, (err_u, result) =>{ //删除购物车内

                        })
                    })
                };
            })
        })
    })
    setTimeout(()=>{
        res.writeHead(200, {"Content-Type": "application/json"})
        res.write("1000");
        res.end();
    },1500)
})

//接口13 获取用户订单数量
app.get('/getList',(req,res)=>{
    let usn=req.query.usn;
    mongoClient.connect(DBurl,(err,db)=>{
        db.collection('list').find({usn}).toArray((err_l,arr_l)=>{
            let numArr=[0,0,0];
            for(let i=0;i<arr_l.length;i++){
                if(arr_l[i].state==0) numArr[0]++;
                else if(arr_l[i].state==1) numArr[1]++;
                else numArr[2]++;
            }
            res.writeHead(200, {"Content-Type": "application/json"})
            res.write(JSON.stringify(numArr));
            res.end();
        })
    })
})
app.listen('3001',"127.0.0.1")